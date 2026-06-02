import { execFileSync } from 'child_process';

const WORKSPACE = process.env.GITHUB_WORKSPACE ?? process.cwd();

// execFileSync (shell: false) passes each argument literally, so untrusted
// values — e.g. an LLM-generated commit message containing quotes, backticks,
// or $(...) — cannot break argument parsing or inject shell commands.
function git(...args: string[]): string {
  return execFileSync('git', args, {
    cwd: WORKSPACE,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

export function createBranch(name: string): void {
  // -B resets the branch if a previous run already created it locally.
  git('checkout', '-B', name);
}

export function commitAll(message: string): void {
  git('add', '-A');
  git('commit', '-m', message);
}

export function pushBranch(branch: string): void {
  git('push', 'origin', branch);
}
