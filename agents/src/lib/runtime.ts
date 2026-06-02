import * as fs from 'fs';
import * as path from 'path';

export const WORKSPACE = path.resolve(process.env.GITHUB_WORKSPACE ?? process.cwd());

export function guardPath(filePath: string): string {
  const resolved = path.resolve(WORKSPACE, filePath);
  if (resolved !== WORKSPACE && !resolved.startsWith(WORKSPACE + path.sep)) {
    throw new Error('Path traversal not allowed');
  }
  return resolved;
}

export function truncate(text: string, maxChars = 20_000): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[truncated ${text.length - maxChars} chars]`;
}

export function setGitHubOutput(name: string, value: string): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  fs.appendFileSync(outputPath, `${name}=${value.replace(/\r?\n/g, ' ')}\n`, 'utf-8');
}

export function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw new Error(`Expected JSON object, got: ${truncate(trimmed, 500)}`);
    return JSON.parse(trimmed.slice(start, end + 1)) as T;
  }
}
