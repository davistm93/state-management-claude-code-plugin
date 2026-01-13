#!/usr/bin/env node
/**
 * Bridge script: Parse state file
 * Returns JSON with metadata and sections
 */

import * as fs from 'fs/promises';
import { parseStateFile } from '../lib/state-parser';

async function main() {
  try {
    const statePath = process.argv[2] || '.claude/project_state.md';

    let content = '';
    let exists = false;

    try {
      content = await fs.readFile(statePath, 'utf-8');
      exists = true;
    } catch (e) {
      // Return empty structure if file doesn't exist
      console.log(JSON.stringify({
        metadata: { last_sync: '', commit_sha: '', version: '1.0' },
        sections: {},
        rawContent: '',
        exists: false
      }, null, 2));
      return;
    }

    const parsed = parseStateFile(content);
    const result = {
      ...parsed,
      exists
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
