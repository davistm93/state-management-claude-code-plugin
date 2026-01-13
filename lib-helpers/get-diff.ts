#!/usr/bin/env node
/**
 * Bridge script: Get git diff since last state sync
 * Returns JSON with diff information
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { getDiffSinceCommit, getCurrentCommitSha } from '../lib/git-utils';
import { parseStateFile } from '../lib/state-parser';

async function main() {
  try {
    const repoPath = process.cwd();
    const statePath = path.join(repoPath, '.claude', 'project_state.md');

    // Read current state to get last sync SHA
    let lastSyncSha: string | null = null;
    try {
      const stateContent = await fs.readFile(statePath, 'utf-8');
      const parsed = parseStateFile(stateContent);
      lastSyncSha = parsed.metadata.commit_sha || null;
    } catch (e) {
      // State file doesn't exist yet - that's okay
    }

    // Get diff and current commit
    const diff = await getDiffSinceCommit(repoPath, lastSyncSha);
    const currentSha = await getCurrentCommitSha(repoPath);

    // Calculate commits analyzed (simplified - just check if diff exists)
    const hasChanges = diff && diff.trim().length > 0;
    const commitsAnalyzed = hasChanges ? 1 : 0;

    // Output as JSON
    const result = {
      diff: diff || '',
      currentSha,
      lastSyncSha: lastSyncSha || 'none',
      commitsAnalyzed,
      hasChanges
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message || String(error) }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
