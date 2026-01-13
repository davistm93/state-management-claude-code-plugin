import * as fs from 'fs/promises';
import * as path from 'path';
import { getCurrentCommitSha } from '../lib/git-utils';
import { parseStateFile, updateSection, updateMetadata } from '../lib/state-parser';

export interface ApplyOptions {
  repoPath: string;
  statePath: string;
  patches: Record<string, string>;
}

export async function runStateApply(options: ApplyOptions): Promise<void> {
  const { repoPath, statePath, patches } = options;

  // 1. Load current state
  let currentContent = '';
  try {
    currentContent = await fs.readFile(statePath, 'utf-8');
  } catch {
    // State file doesn't exist - create from template
    currentContent = await createInitialStateFile();
  }

  // 2. Apply patches
  let updatedContent = currentContent;
  for (const [sectionName, patchContent] of Object.entries(patches)) {
    updatedContent = updateSection(updatedContent, sectionName, patchContent);
  }

  // 3. Update metadata
  const currentSha = await getCurrentCommitSha(repoPath);
  const timestamp = new Date().toISOString();

  updatedContent = updateMetadata(updatedContent, {
    commit_sha: currentSha,
    last_sync: timestamp,
    version: '1.0'
  });

  // 4. Write to file
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, updatedContent, 'utf-8');
}

async function createInitialStateFile(): Promise<string> {
  return `# Project State

> Last updated: ${new Date().toISOString().split('T')[0]} | Commit: pending

## System Architecture

High-level overview of the system design, major patterns, and architectural decisions.

## Active Modules

List of major modules/packages and their responsibilities.

## Dependency Map

Key external dependencies and their usage context.

## Tech Debt

Known issues, workarounds, and planned improvements.

## Infrastructure

Deployment, environment, and operational requirements.

<!-- STATE_METADATA: {"last_sync": "", "commit_sha": "", "version": "1.0"} -->
`;
}

export async function main() {
  try {
    console.log('\n⚠️  state-apply: Session integration pending\n');
    console.log('This command should be run after /state-plan to apply proposed changes.');
    console.log('\nCurrent limitation:');
    console.log('  - Requires session state management to read plan results');
    console.log('  - This feature needs integration with Claude Code\'s session system');
    console.log('\nWorkaround:');
    console.log('  - Review the output from /state-plan');
    console.log('  - Manually edit .claude/project_state.md if needed');
    console.log('  - Update the STATE_METADATA commit_sha and last_sync timestamp');
    console.log('\nSee Tech Debt in project_state.md for implementation status.\n');

    // For now, just demonstrate the structure
    const repoPath = process.cwd();
    const statePath = path.join(repoPath, '.claude', 'project_state.md');

    // Example of what would happen with session state:
    // const patches = getFromSession('last_state_plan_patches');
    // await runStateApply({ repoPath, statePath, patches });
    // console.log('✓ State file updated successfully');

  } catch (error: any) {
    console.error('\n❌ Error running state-apply\n');
    console.error('Details:', error.message || error);

    if (process.env.DEBUG) {
      console.error('\nFull error:', error);
    }

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
