export interface StateStatusOptions {
  repoPath: string;
  statePath: string;
  currentCommitSha: string;
  lastSyncSha: string;
  stateFileModified: boolean;
  commitsBehind?: number;
}

export interface StateStatusResult {
  drift: number;
  message: string;
  isCurrent: boolean;
  manuallyEdited: boolean;
}

export async function getStateStatus(options: StateStatusOptions): Promise<StateStatusResult> {
  const {
    currentCommitSha,
    lastSyncSha,
    stateFileModified,
    commitsBehind = 0
  } = options;

  const drift = commitsBehind;
  const isCurrent = currentCommitSha === lastSyncSha && !stateFileModified;

  let message = '';

    if (isCurrent) {
        message = 'SUCCESS: State is current';
    } else {
        const parts: string[] = [];

        if (drift > 0) {
        parts.push(`State is ${drift} commit${drift === 1 ? '' : 's'} behind`);
        }

        if (stateFileModified) {
        parts.push('WARNING: State file manually edited - changes not validated');
        }

        message = parts.join('\n');
    }

  return {
    drift,
    message,
    isCurrent,
    manuallyEdited: stateFileModified
  };
}

export async function main() {
  const repoPath = process.cwd();
  const path = require('path');
  const fs = require('fs/promises');
  const statePath = path.join(repoPath, '.claude', 'project_state.md');
  const { getCurrentCommitSha, getDiffSinceCommit } = require('../lib/git-utils');
  const { parseStateFile } = require('../lib/state-parser');

  try {
    let currentStateContent = '';
    try {
      currentStateContent = await fs.readFile(statePath, 'utf-8');
    } catch {
      // File missing
    }

    const currentSha = await getCurrentCommitSha(repoPath);
    let lastSyncSha = '';
    
    if (currentStateContent) {
        const parsed = parseStateFile(currentStateContent);
        lastSyncSha = parsed.metadata.commit_sha || '';
    }

    const diff = await getDiffSinceCommit(repoPath, lastSyncSha);
    // Simple heuristic for "commits behind" - just checking if diff exists for now
    // In a real implementation, we'd count commits
    const commitsBehind = diff ? 1 : 0; 
    const stateFileModified = false; // TODO: Implement check for dirty state file

    const result = await getStateStatus({
        repoPath,
        statePath,
        currentCommitSha: currentSha,
        lastSyncSha,
        stateFileModified,
        commitsBehind
    });

    console.log('# State Status\n');
    console.log(result.message);

    if (result.drift > 0) {
        console.log(`\n> **Tip:** Run \`/state-plan\` to analyze the ${result.drift} pending change(s).`);
    }

  } catch (error: any) {
     console.error('\nERROR: **Error running state-status**\n');
     console.error(error.message);
  }
}

if (require.main === module) {
  main();
}
