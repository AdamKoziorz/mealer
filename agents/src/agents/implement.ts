import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { runAgentLoop, type Tool } from '../lib/claude.js';
import { getIssue, getIssueComments, postIssueComment, createPR } from '../lib/github.js';
import { createBranch, commitAll, pushBranch } from '../lib/git.js';
import { guardPath, truncate } from '../lib/runtime.js';
import { TRIAGE_MARKER, type TriageResult } from './triage.js';

const WORKSPACE = process.env.GITHUB_WORKSPACE ?? process.cwd();

const ALLOWED_COMMAND_PREFIXES = [
  ['pnpm', 'lint'],
  ['pnpm', 'typecheck'],
  ['pnpm', 'test'],
  ['pnpm', 'build'],
  ['pnpm', '--dir', '<workspace>', 'lint|typecheck|test|build'],
  ['pnpm', '--dir', '<workspace>', 'exec', 'tsc'],
  ['npx', 'tsc'],
];

function readFileSlice(filePath: string, startLine?: number, endLine?: number, maxChars = 60_000): string {
  const content = fs.readFileSync(guardPath(filePath), 'utf-8');
  if (!startLine && !endLine) return truncate(content, maxChars);

  const lines = content.split(/\r?\n/);
  const start = Math.max((startLine ?? 1) - 1, 0);
  const end = Math.min(endLine ?? lines.length, lines.length);
  return truncate(lines.slice(start, end).map((line, index) => `${start + index + 1}:${line}`).join('\n'), maxChars);
}

function tokenizeCommand(command: string): string[] {
  if (/[\r\n;&|<>`$]/.test(command)) {
    throw new Error('Command contains unsupported shell metacharacters');
  }

  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (const char of command.trim()) {
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      continue;
    }
    if (char === quote) {
      quote = null;
      continue;
    }
    if (/\s/.test(char) && !quote) {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  if (quote) throw new Error('Unclosed quote in command');
  if (current) tokens.push(current);
  return tokens;
}

function isAllowedCommand(tokens: string[]): boolean {
  if (tokens[0] === 'pnpm' && tokens[1] === '--dir') {
    const script = tokens[3];
    if (['lint', 'typecheck', 'test', 'build'].includes(script)) return true;
    return script === 'exec' && tokens[4] === 'tsc';
  }

  return ALLOWED_COMMAND_PREFIXES.some((prefix) => {
    if (prefix.includes('<workspace>') || prefix.some((part) => part.includes('|'))) return false;
    return prefix.every((part, index) => tokens[index] === part);
  });
}

function formatAllowedCommands(): string {
  return ALLOWED_COMMAND_PREFIXES.map((prefix) => prefix.join(' ')).join(', ');
}

function parseTriageResult(comments: Awaited<ReturnType<typeof getIssueComments>>): TriageResult | null {
  for (const comment of [...comments].reverse()) {
    const body = comment.body ?? '';
    const markerStart = body.indexOf(`${TRIAGE_MARKER}:`);
    if (markerStart === -1) continue;
    const encoded = body.slice(markerStart + TRIAGE_MARKER.length + 1).split('-->')[0]?.trim();
    if (!encoded) continue;
    try {
      return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as TriageResult;
    } catch {
      return null;
    }
  }
  return null;
}

function makeTools(prNumberRef: { value: number }, branchName: string, issueNumber: number): Tool[] {
  return [
    {
      name: 'read_file',
      description: 'Read the current contents of a file before editing it.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to repo root' },
          start_line: { type: 'number', description: 'Optional 1-based first line to read' },
          end_line: { type: 'number', description: 'Optional 1-based final line to read' },
        },
        required: ['path'],
      },
      handler: async ({ path: p, start_line, end_line }) =>
        readFileSlice(p as string, start_line as number | undefined, end_line as number | undefined),
    },
    {
      name: 'write_file',
      description: 'Write content to a file. Always read_file first.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to repo root' },
          content: { type: 'string', description: 'Full file content to write' },
        },
        required: ['path', 'content'],
      },
      handler: async ({ path: p, content }) => {
        const full = guardPath(p as string);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, content as string, 'utf-8');
        return `Written: ${p}`;
      },
    },
    {
      name: 'run_command',
      description: 'Run a verification command (lint, typecheck, test, build). Not for making changes.',
      input_schema: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command'],
      },
      handler: async ({ command }) => {
        const cmd = command as string;
        const tokens = tokenizeCommand(cmd);
        if (!isAllowedCommand(tokens)) {
          throw new Error(`Blocked: "${cmd}". Allowed prefixes: ${formatAllowedCommands()}`);
        }
        try {
          const out = execFileSync(tokens[0], tokens.slice(1), {
            cwd: WORKSPACE,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
          });
          return truncate(out.trim() || '(succeeded with no output)', 20_000);
        } catch (err: unknown) {
          const e = err as { stdout?: string; stderr?: string; message?: string };
          return truncate(`FAILED:\nstdout: ${e.stdout ?? ''}\nstderr: ${e.stderr ?? e.message ?? ''}`, 20_000);
        }
      },
    },
    {
      name: 'commit_and_open_pr',
      description: 'Commit all staged changes, push the branch, and open a draft PR. Call this once the fix is verified.',
      input_schema: {
        type: 'object',
        properties: {
          commit_message: { type: 'string' },
          pr_title: { type: 'string' },
          pr_body: { type: 'string' },
        },
        required: ['commit_message', 'pr_title', 'pr_body'],
      },
      handler: async ({ commit_message, pr_title, pr_body }) => {
        commitAll(commit_message as string);
        pushBranch(branchName);
        const pr = await createPR({
          title: pr_title as string,
          body: `${pr_body as string}\n\nCloses #${issueNumber}`,
          head: branchName,
          base: 'main',
          draft: true,
        });
        prNumberRef.value = pr.number;
        return `Draft PR #${pr.number} opened: ${pr.html_url}`;
      },
    },
  ];
}

export async function implement(issueNumber: number): Promise<number> {
  const issue = await getIssue(issueNumber);
  const comments = await getIssueComments(issueNumber);

  const planComment = comments
    .filter((c) => c.body?.includes('## Investigation: Root Cause Found'))
    .at(-1);
  const triageResult = parseTriageResult(comments);

  if (!planComment) {
    await postIssueComment(
      issueNumber,
      '❌ No investigation plan found on this issue. The investigate agent must run before implement.'
    );
    process.exit(1);
  }

  const branchName = `fix/issue-${issueNumber}`;
  createBranch(branchName);

  const prNumberRef = { value: -1 };

  const isHighComplexity = triageResult?.complexity === 'high';
  await runAgentLoop({
    model: isHighComplexity ? 'claude-opus-4-8' : 'claude-sonnet-4-6',
    maxTokens: isHighComplexity ? 8096 : 4096,
    system: `You are an implementation agent for the mealer repository.

You have been given an approved investigation plan. Execute it exactly.

Rules — non-negotiable:
1. Always call read_file before write_file. Never write blind.
2. Only modify files named in the plan. If you discover you must touch an additional file, state why in your reasoning before proceeding.
3. After every write_file, run the verification command from the plan. Do not call commit_and_open_pr until verification passes.
4. If verification fails twice for the same issue, stop and explain the problem rather than guessing further.
5. Do not refactor, rename, or clean up anything beyond the stated fix.
6. Call commit_and_open_pr exactly once when done.

Repository:
- apps/frontend/ — React 19, TypeScript, Vite, Feature-Sliced Design
- apps/backend/ — Node.js, Express, PostgreSQL
- packages/schemas/ — Shared Zod schemas`,
    messages: [
      {
        role: 'user',
        content: `Implement the fix for issue #${issueNumber}: ${issue.title}\n\n## Approved Plan\n\n${planComment.body}`,
      },
    ],
    tools: makeTools(prNumberRef, branchName, issueNumber),
  });

  if (prNumberRef.value === -1) {
    throw new Error('Agent completed without opening a PR');
  }

  return prNumberRef.value;
}
