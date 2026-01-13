#!/usr/bin/env node
/**
 * Bridge script: Get state status and drift metrics
 * Returns JSON with drift information
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { getCurrentCommitSha, getDiffSinceCommit } from '../lib/git-utils';
import { parseStateFile } from '../lib/state-parser';

async function main() {
  try {
    const repoPath = process.cwd();
    const statePath = path.join(repoPath, '.claude', 'project_state.md');

    // Read state
    let stateContent = '';
    let exists = false;

    try {
      stateContent = await fs.readFile(statePath, 'utf-8');
      exists = true;
    } catch {
      // Doesn't exist
    }

    const currentSha = await getCurrentCommitSha(repoPath);

    if (!exists) {
      console.log(JSON.stringify({
        exists: false,
        message: 'No state file found. Run /state-plan to create one.',
        drift: 0,
        isCurrent: false,
        currentSha,
        lastSyncSha: 'none'
      }, null, 2));
      return;
    }

    const parsed = parseStateFile(stateContent);
    const lastSyncSha = parsed.metadata.commit_sha || '';

    const diff = await getDiffSinceCommit(repoPath, lastSyncSha);
    const commitsBehind = diff && diff.trim() ? 1 : 0;
    const isCurrent = currentSha === lastSyncSha && commitsBehind === 0;

    let message = '';
    if (isCurrent) {
      message = 'SUCCESS: State is current';
    } else if (commitsBehind > 0) {
      message = `State is ${commitsBehind} commit(s) behind`;
    }

    console.log(JSON.stringify({
      exists: true,
      drift: commitsBehind,
      isCurrent,
      message,
      currentSha,
      lastSyncSha: lastSyncSha || 'none'
    }, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message || String(error) }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
