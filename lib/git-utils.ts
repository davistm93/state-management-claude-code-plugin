import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function getCurrentCommitSha(repoPath: string): Promise<string> {
  const git: SimpleGit = simpleGit(repoPath);
  const log = await git.log(['-1']);
  return log.latest?.hash || '';
}

export function getLastSyncCommit(markdownContent: string): string | null {
  const metadataMatch = markdownContent.match(/<!-- STATE_METADATA: ({.*?}) -->/);
  if (!metadataMatch) return null;

  try {
    const metadata = JSON.parse(metadataMatch[1]);
    return metadata.commit_sha || null;
  } catch {
    return null;
  }
}

export async function getDiffSinceCommit(
  repoPath: string,
  commitSha: string | null
): Promise<string> {
  const git: SimpleGit = simpleGit(repoPath);

  if (!commitSha) {
    // Get uncommitted changes
    return await git.diff();
  }

  // Get diff between commit and HEAD
  return await git.diff([`${commitSha}...HEAD`]);
}

export async function getCommitsBetween(
  repoPath: string,
  fromCommit: string,
  toCommit: string = 'HEAD'
): Promise<number> {
  const git: SimpleGit = simpleGit(repoPath);
  const log = await git.log({ from: fromCommit, to: toCommit });
  return log.total;
}

export async function hasUncommittedChanges(repoPath: string): Promise<boolean> {
  const git: SimpleGit = simpleGit(repoPath);
  const status = await git.status();
  return status.files.length > 0;
}
