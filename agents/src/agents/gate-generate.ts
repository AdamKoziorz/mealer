import { anthropic } from '../lib/claude.js';
import { getPRDiff, postPRComment } from '../lib/github.js';
import { parseJsonObject, truncate } from '../lib/runtime.js';

export const GATE_MARKER = '<!-- comprehension-gate -->';
export const GATE_RUBRIC_MARKER = '<!-- comprehension-gate-rubric';

interface GateGeneration {
  public_gate: string;
  evaluator_rubric: string;
}

export async function gateGenerate(prNumber: number): Promise<void> {
  const diff = await getPRDiff(prNumber);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
    system: `You are a comprehension gate agent. Your job is to generate questions and an evaluator rubric that verify a developer genuinely understands a code change, not merely that they approve of it.

Output ONLY valid JSON. No prose, no markdown fences. Schema:
{
  "public_gate": "## Comprehension Gate\\n\\n**Question header**\\nOne sentence of framing.\\n\\n...",
  "evaluator_rubric": "Private rubric with the expected answer points for each question."
}

Criteria for good questions:
- Ask WHY, not WHAT. The diff already shows what changed.
- Target non-obvious concepts: hidden constraints, subtle invariants, rejected alternatives.
- At least one question must ask what would break if a plausible but wrong approach had been taken instead.
- At least one question must target knowledge not visible in the diff: a library behavior, language rule, or tooling behavior the fix relies on.
- 3-4 questions maximum.
- The rubric must state the specific concepts a passing answer must mention, plus common wrong answers that should fail.

Questions to avoid:
- "What file was changed?" because the diff shows this
- "What does X do?" because it is too generic
- Anything with a yes/no answer`,
    messages: [
      {
        role: 'user',
        content: `Generate comprehension gate questions for PR #${prNumber}.\n\n\`\`\`diff\n${truncate(diff, 60_000)}\n\`\`\``,
      },
    ],
  });

  const text = response.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const result = parseJsonObject<GateGeneration>(text);
  const encodedRubric = Buffer.from(result.evaluator_rubric, 'utf-8').toString('base64url');
  const body = `${GATE_MARKER}\n\n${result.public_gate.trim()}\n\n${GATE_RUBRIC_MARKER}:${encodedRubric} -->\n\n---\nReply with \`/gate-answer\` followed by your answers. An evaluation agent will assess them and mark this PR ready for review, or ask a follow-up if something is missing.`;

  await postPRComment(prNumber, body);
  console.log(`Gate posted to PR #${prNumber}`);
}
