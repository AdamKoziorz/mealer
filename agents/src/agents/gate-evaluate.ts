import { anthropic } from '../lib/claude.js';
import { getPRComments, getPR, getPRDiff, postPRComment, markPRReady } from '../lib/github.js';
import { parseJsonObject, truncate } from '../lib/runtime.js';
import { GATE_MARKER, GATE_RUBRIC_MARKER } from './gate-generate.js';

const BOT_LOGINS = new Set(['github-actions[bot]', 'claude-bot']);

interface GateEvaluation {
  passed: boolean;
  summary: string;
  question_results: Array<{
    question: string;
    passed: boolean;
    explanation: string;
  }>;
  follow_up_question?: string;
}

function extractRubric(body: string): string {
  const markerStart = body.indexOf(`${GATE_RUBRIC_MARKER}:`);
  if (markerStart === -1) return '(no private rubric found; evaluate against the diff and public questions)';

  const encoded = body.slice(markerStart + GATE_RUBRIC_MARKER.length + 1).split('-->')[0]?.trim();
  if (!encoded) return '(no private rubric found; evaluate against the diff and public questions)';

  try {
    return Buffer.from(encoded, 'base64url').toString('utf-8');
  } catch {
    return '(rubric could not be decoded; evaluate against the diff and public questions)';
  }
}

function stripHiddenRubric(body: string): string {
  return body.replace(new RegExp(`${GATE_RUBRIC_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:[^]*?-->`, 'm'), '').trim();
}

export async function gateEvaluate(prNumber: number): Promise<void> {
  const [pr, comments, diff] = await Promise.all([getPR(prNumber), getPRComments(prNumber), getPRDiff(prNumber)]);

  if (!pr.draft) {
    console.log(`PR #${prNumber} is already ready for review - skipping evaluation`);
    return;
  }

  const gateComment = comments.filter((c) => c.body?.includes(GATE_MARKER)).at(-1);
  if (!gateComment?.body) {
    await postPRComment(prNumber, 'No comprehension gate found on this PR. Waiting for gate-generate to run.');
    return;
  }

  const candidateComments = comments
    .filter((c) => !BOT_LOGINS.has(c.user?.login ?? ''))
    .filter((c) => new Date(c.created_at) > new Date(gateComment.created_at));

  const answerComments = candidateComments.filter((c) => c.body?.trim().startsWith('/gate-answer'));

  if (answerComments.length === 0) {
    await postPRComment(prNumber, 'No gate answer found yet. Please reply with `/gate-answer` followed by your answers.');
    return;
  }

  const answers = answerComments
    .map((comment, index) => `Answer comment ${index + 1} by ${comment.user?.login ?? 'unknown'} at ${comment.created_at}:\n${comment.body}`)
    .join('\n\n---\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
    system: `You are an evaluator for a developer comprehension gate. A developer has answered questions about a code change they are merging.

Output ONLY valid JSON. No prose, no markdown fences. Schema:
{
  "passed": true | false,
  "summary": "Brief overall evaluation.",
  "question_results": [
    { "question": "Question or short label", "passed": true | false, "explanation": "Specific reason." }
  ],
  "follow_up_question": "One targeted follow-up question when passed is false; omit when passed is true."
}

Evaluation standard:
- Correct and specific answers pass. Vague or partially correct answers on questions that touch the root cause do NOT pass.
- If an answer shows the developer understands the mechanism but uses imprecise wording, that passes.
- If any answer reveals a gap in understanding of WHY the fix is correct, that does not pass.
- Use the private rubric as the main standard, and verify it against the PR diff.`,
    messages: [
      {
        role: 'user',
        content: `PR diff:\n\n\`\`\`diff\n${truncate(diff, 60_000)}\n\`\`\`\n\n---\n\nGate questions:\n\n${stripHiddenRubric(gateComment.body)}\n\n---\n\nPrivate evaluator rubric:\n\n${extractRubric(gateComment.body)}\n\n---\n\nDeveloper answers:\n\n${answers}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const evaluation = parseJsonObject<GateEvaluation>(text);
  const resultLines = evaluation.question_results
    .map((result) => `- ${result.passed ? 'Pass' : 'Not yet'}: ${result.question} - ${result.explanation}`)
    .join('\n');

  if (evaluation.passed) {
    await postPRComment(
      prNumber,
      `## Gate: Passed\n\n${evaluation.summary}\n\n${resultLines}\n\n*Marking PR ready for review.*`
    );
    await markPRReady(prNumber);
    console.log(`Gate passed - PR #${prNumber} marked ready for review`);
  } else {
    await postPRComment(
      prNumber,
      `## Gate: Not Yet\n\n${evaluation.summary}\n\n${resultLines}\n\n**Follow-up**: ${evaluation.follow_up_question ?? 'Please clarify the missing reasoning above.'}`
    );
    console.log(`Gate not passed - follow-up posted to PR #${prNumber}`);
  }
}
