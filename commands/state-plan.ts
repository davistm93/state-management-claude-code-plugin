import * as fs from 'fs/promises';
import * as path from 'path';
import { getDiffSinceCommit, getCurrentCommitSha } from '../lib/git-utils';
import { parseStateFile } from '../lib/state-parser';
import { callArchitectAgent, ArchitectOutput } from '../lib/architect-client';

export interface PlanOptions {
  repoPath: string;
  statePath: string;
  configPath: string;
}

export interface PlanResult {
  analysis: ArchitectOutput;
  diff: string;
  commitsAnalyzed: number;
}

export async function runStatePlan(options: PlanOptions): Promise<PlanResult> {
  const { repoPath, statePath, configPath } = options;

  // 1. Load config
  const configContent = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configContent);

  // 2. Load current state
  let currentStateContent = '';
  try {
    currentStateContent = await fs.readFile(statePath, 'utf-8');
  } catch {
    // State file doesn't exist yet
    currentStateContent = '';
  }

  // 3. Get last sync commit
  const parsed = parseStateFile(currentStateContent);
  const lastSyncSha = parsed.metadata.commit_sha || null;

  // 4. Get diff
  const diff = await getDiffSinceCommit(repoPath, lastSyncSha);

  if (!diff || diff.trim().length === 0) {
    return {
      analysis: {
        summary: 'No changes detected since last sync',
        changes_by_category: {},
        patches: {},
        confidence: 'high'
      },
      diff: '',
      commitsAnalyzed: 0
    };
  }

  // 5. Call architect agent
  const analysis = await callArchitectAgent({
    diffs: diff,
    currentState: currentStateContent,
    granularity: config.granularity || 'medium'
  });

  // 6. Return results
  return {
    analysis,
    diff,
    commitsAnalyzed: 1 // TODO: Calculate actual commit count
  };
}

export async function main() {
  const repoPath = process.cwd(); // User's project directory
  const statePath = path.join(repoPath, '.claude', 'project_state.md');
  // Config is in the plugin directory (dist/commands -> dist -> plugin root)
  const pluginDir = path.join(__dirname, '..', '..');
  const configPath = path.join(pluginDir, '.claude-plugin', 'config.json');

  try {
    const result = await runStatePlan({ repoPath, statePath, configPath });

    console.log('\n=== State Plan ===\n');
    console.log(`Analyzed ${result.commitsAnalyzed} commit(s)\n`);
    console.log('Summary:', result.analysis.summary);
    console.log('\nProposed Changes:');

    for (const [section, content] of Object.entries(result.analysis.patches)) {
      console.log(`\n[${section}]`);
      console.log(content);
    }

    if (result.analysis.questions && result.analysis.questions.length > 0) {
      console.log('\nQuestions:');
      result.analysis.questions.forEach(q => console.log(`  - ${q}`));
    }

    console.log('\n\nRun `/state-apply` to commit these changes to project_state.md');
  } catch (error) {
    console.error('Error running state-plan:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
