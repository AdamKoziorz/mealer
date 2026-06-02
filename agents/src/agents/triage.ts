import { anthropic, extractText } from '../lib/claude.js';
import { getIssue, postIssueComment } from '../lib/github.js';
import { parseJsonObject, setGitHubOutput } from '../lib/runtime.js';

export const TRIAGE_MARKER = '<!-- triage-result';

export interface TriageResult {
  decision: 'accept' | 'decline';
  reason: string;
  complexity: 'low' | 'medium' | 'high';
  affected_areas: string[];
  post_comment: string;
}

export async function triage(issueNumber: number): Promise<void> {
  const issue = await getIssue(issueNumber);

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are a triage agent for the mealer repository — a fullstack restaurant tracker built with React/TypeScript (frontend, Feature-Sliced Design) and Node/Express/PostgreSQL (backend).

Output ONLY valid JSON. No prose, no markdown fences. Schema:
{
  "decision": "accept" | "decline",
  "reason": "<one sentence>",
  "complexity": "low" | "medium" | "high",
  "affected_areas": ["<file or layer>"],
  "post_comment": "<comment to post on the issue>"
}

Decline if:
- Requires design decisions or is a feature request without clear scope
- Touches auth, sessions, or security-sensitive code
- Requires database schema changes (new tables, column additions/removals)
- Is ambiguous or missing reproduction steps
- Affects infrastructure (Docker, nginx, CI/CD)

Accept if:
- Clear bug with reproduction steps
- Configuration fix (ESLint, tsconfig, Vite, env)
- Broken or missing import
- Small, unambiguous UI fix
- Missing type annotation or type error`,
    messages: [
      {
        role: 'user',
        content: `Issue #${issueNumber}\nTitle: ${issue.title}\n\n${issue.body ?? '(no body)'}`,
      },
    ],
  });

  const result = parseJsonObject<TriageResult>(extractText(response.content));

  setGitHubOutput('decision', result.decision);
  setGitHubOutput('complexity', result.complexity);
  console.log(`TRIAGE_DECISION=${result.decision}`);
  console.log(`TRIAGE_COMPLEXITY=${result.complexity}`);

  const encodedResult = Buffer.from(JSON.stringify(result), 'utf-8').toString('base64url');
  await postIssueComment(issueNumber, `${result.post_comment}\n\n${TRIAGE_MARKER}:${encodedResult} -->`);

  if (result.decision === 'decline') {
    console.log(`Triage declined: ${result.reason}`);
    process.exit(0);
  }

  console.log(`Triage accepted — complexity: ${result.complexity}, areas: ${result.affected_areas.join(', ')}`);
}
