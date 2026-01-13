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
    message = '✓ State is current';
  } else {
    const parts: string[] = [];

    if (drift > 0) {
      parts.push(`State is ${drift} commit${drift === 1 ? '' : 's'} behind`);
    }

    if (stateFileModified) {
      parts.push('⚠️  State file manually edited - changes not validated');
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
  // CLI entry point - to be implemented
  console.log('state-status command');
}

if (require.main === module) {
  main();
}
