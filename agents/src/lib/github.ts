import { Octokit } from '@octokit/rest';

export const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN! });

export const OWNER = 'AdamKoziorz';
export const REPO = 'mealer';

export async function getIssue(issueNumber: number) {
  const { data } = await octokit.issues.get({ owner: OWNER, repo: REPO, issue_number: issueNumber });
  return data;
}

export async function getIssueComments(issueNumber: number) {
  const { data } = await octokit.issues.listComments({ owner: OWNER, repo: REPO, issue_number: issueNumber, per_page: 100 });
  return data;
}

export async function postIssueComment(issueNumber: number, body: string) {
  await octokit.issues.createComment({ owner: OWNER, repo: REPO, issue_number: issueNumber, body });
}

export async function createPR(params: { title: string; body: string; head: string; base: string; draft: boolean }) {
  const { data } = await octokit.pulls.create({ owner: OWNER, repo: REPO, ...params });
  return data;
}

export async function getPRDiff(prNumber: number): Promise<string> {
  const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner: OWNER,
    repo: REPO,
    pull_number: prNumber,
    headers: { accept: 'application/vnd.github.diff' },
  });
  return response.data as unknown as string;
}

export async function getPR(prNumber: number) {
  const { data } = await octokit.pulls.get({ owner: OWNER, repo: REPO, pull_number: prNumber });
  return data;
}

export async function markPRReady(prNumber: number) {
  await octokit.pulls.update({ owner: OWNER, repo: REPO, pull_number: prNumber, draft: false });
}

export async function postPRComment(prNumber: number, body: string) {
  await octokit.issues.createComment({ owner: OWNER, repo: REPO, issue_number: prNumber, body });
}

export async function getPRComments(prNumber: number) {
  const { data } = await octokit.issues.listComments({ owner: OWNER, repo: REPO, issue_number: prNumber, per_page: 100 });
  return data;
}
