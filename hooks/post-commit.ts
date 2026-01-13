#!/usr/bin/env node

/**
 * Post-commit hook for State Manager plugin
 *
 * This hook runs after every git commit and suggests running /state-plan
 * to keep the project state file synchronized.
 *
 * Enable/disable via .claude-plugin/config.json: auto_hooks setting
 */

import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  try {
    // Get plugin directory (hooks -> plugin root)
    const pluginDir = path.join(__dirname, '..', '..');
    const configPath = path.join(pluginDir, '.claude-plugin', 'config.json');

    // Check if hooks are enabled
    let config: any = { auto_hooks: false };
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configContent);
    } catch {
      // Config not found or invalid - hooks disabled by default
      return;
    }

    if (!config.auto_hooks) {
      // Hooks are disabled
      return;
    }

    // Display suggestion to user
    console.log('\n📊 State Manager: Changes detected!');
    console.log('   Run `/state-plan` to review architectural impact');
    console.log('   or disable this message with auto_hooks: false\n');

  } catch (error) {
    // Silently fail - hooks should not block commits
    if (process.env.DEBUG) {
      console.error('State Manager hook error:', error);
    }
  }
}

if (require.main === module) {
  main();
}

export { main };
