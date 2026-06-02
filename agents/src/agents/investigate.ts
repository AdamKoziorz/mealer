import * as fs from 'fs';
import * as path from 'path';
import { runAgentLoop, type Tool } from '../lib/claude.js';
import { getIssue, postIssueComment } from '../lib/github.js';
import { guardPath, truncate, WORKSPACE } from '../lib/runtime.js';

const SEARCH_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);

function readFileSlice(filePath: string, startLine?: number, endLine?: number, maxChars = 30_000): string {
  const content = fs.readFileSync(guardPath(filePath), 'utf-8');
  if (!startLine && !endLine) return truncate(content, maxChars);

  const lines = content.split(/\r?\n/);
  const start = Math.max((startLine ?? 1) - 1, 0);
  const end = Math.min(endLine ?? lines.length, lines.length);
  return truncate(lines.slice(start, end).map((line, index) => `${start + index + 1}:${line}`).join('\n'), maxChars);
}

function walkFiles(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    if (entry.isFile() && SEARCH_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }

  return files;
}

function searchCode(pattern: string, directory = '.', maxMatches = 80): string {
  const regex = new RegExp(pattern, 'i');
  const base = guardPath(directory);
  const matches: string[] = [];

  for (const file of walkFiles(base)) {
    const relative = path.relative(WORKSPACE, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      regex.lastIndex = 0;
      if (!regex.test(line)) continue;
      matches.push(`${relative}:${index + 1}:${line}`);
      if (matches.length >= maxMatches) return `${matches.join('\n')}\n[search truncated at ${maxMatches} matches]`;
    }
  }

  return matches.join('\n') || '(no matches)';
}

const tools: Tool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the repository.',
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
    name: 'list_directory',
    description: 'List files and subdirectories at a path.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path relative to repo root' } },
      required: ['path'],
    },
    handler: async ({ path: p }) => {
      const entries = fs.readdirSync(guardPath(p as string), { withFileTypes: true });
      return entries.map((e) => `${e.isDirectory() ? '[DIR] ' : '[FILE]'} ${e.name}`).join('\n');
    },
  },
  {
    name: 'search_code',
    description: 'Search for a regex pattern across TypeScript/JavaScript source files.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex pattern' },
        directory: { type: 'string', description: 'Directory to search (relative to repo root). Defaults to repo root.' },
      },
      required: ['pattern'],
    },
    handler: async ({ pattern, directory = '.' }) => {
      try {
        return searchCode(pattern as string, directory as string);
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  },
];

export async function investigate(issueNumber: number): Promise<void> {
  const issue = await getIssue(issueNumber);

  const result = await runAgentLoop({
    model: 'claude-sonnet-4-6',
    system: `You are an investigation agent for the mealer repository.

Stack:
- apps/frontend/ — React 19, TypeScript, Vite, TanStack Router + Query, MapLibre GL, Tailwind CSS, Feature-Sliced Design
- apps/backend/ — Node.js, Express, TypeScript, PostgreSQL (via pg)
- packages/schemas/ — Shared Zod validation schemas, imported by both apps

Feature-Sliced Design layer order (frontend), low → high:
  shared → entities → features → widgets → pages → app
A layer may only import from layers below it. Enforced by eslint-plugin-import no-restricted-paths rules in both the root and local eslint.config.js files.

Your task: identify the exact root cause of the reported bug. Use the tools to read relevant files. Be precise about file paths and line numbers. Prefer targeted searches and line-range reads before reading whole files.

When you have identified the root cause, write your final output as a GitHub comment in this exact structure — no extra prose before or after it:

## Investigation: Root Cause Found

**Root cause**: <precise technical explanation>

**Error you would see**:
\`\`\`
<actual error message or stack trace>
\`\`\`

**Proposed fix** — \`<file path>\`:
\`\`\`diff
<minimal unified diff>
\`\`\`

**Verification command**:
\`\`\`
<single lint, typecheck, test, or build command>
\`\`\`

**Why this fix and not the obvious alternatives**: <one concise paragraph>

---
Reply \`/proceed\` to authorize implementation, or ask questions first.`,
    messages: [
      {
        role: 'user',
        content: `Issue #${issueNumber}: ${issue.title}\n\n${issue.body ?? '(no body)'}`,
      },
    ],
    tools,
  });

  await postIssueComment(issueNumber, result);
  console.log(`Investigation posted to issue #${issueNumber}`);
}
