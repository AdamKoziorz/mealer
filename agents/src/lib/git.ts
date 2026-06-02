import { execSync } from 'child_process';

const WORKSPACE = process.env.GITHUB_WORKSPACE ?? process.cwd();

function exec(command: string): string {
  return execSync(command, {
    cwd: WORKSPACE,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

export function createBranch(name: string): void {
  exec(`git checkout -b ${name}`);
}

export function commitAll(message: string): void {
  exec('git add -A');
  exec(`git commit -m ${JSON.stringify(message)}`);
}

export function pushBranch(branch: string): void {
  exec(`git push origin ${branch}`);
}
