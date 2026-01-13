# Migration Guide: v1.0 (Commands) → v2.0 (Skills)

## Overview

Version 2.0 transforms the State Manager from a command-based TypeScript plugin to a pure skill-based plugin with zero dependencies.

## What Changed

### Removed
- Old slash commands: `/state-plan`, `/state-apply`, `/state-status`
- TypeScript source code (commands/, lib/, agents/, hooks/)
- Build process (no more npm install, npm run build)
- Dependencies (no package.json, no node_modules)
- Test infrastructure (no jest)
- Configuration files (was .claude-plugin/config.json)

### Added
- Automatic skills that trigger on session start and task completion
- Pure markdown skill definitions (no code)
- Flexible section structure (adapt to any project)
- .claude.md integration for automatic context loading
- New slash commands: `/state-init`, `/state-management` (for manual control)

### Unchanged
- State file location: `.claude/project_state.md`
- Metadata format (fully compatible)
- Git-based diff tracking

## Migration Steps

### For End Users

If you have v1.0 installed:

```bash
# 1. Navigate to plugin directory
cd ~/.claude/plugins/state-manager

# 2. Pull v2.0 changes
git pull origin main

# 3. Restart Claude Code
# Skills will activate automatically!
```

**Your existing `.claude/project_state.md` files work as-is.** No data migration needed.

### For Developers/Contributors

If you were developing on v1.0:

```bash
# 1. Pull latest
git pull origin main

# 2. Clean old artifacts
rm -rf node_modules dist

# 3. Edit skills instead of code
# Skills are in: skills/*/SKILL.md

# 4. Test by installing locally
# No build step needed!
```

## Behavioral Changes

### Before (v1.0)

```
User: /state-plan
Claude: [Shows proposed changes]

User: /state-apply
Claude: [Applies changes]

User: /state-status
Claude: [Shows drift metrics]
```

**Manual workflow**: You had to remember to run multiple commands.

### After (v2.0)

**Automatic workflow (default)**:
```
[Session starts]

Claude: "I found 3 commits since last sync. Changes affect:
        - Dependencies: Added stripe
        - Active Modules: payment-service

        Update state?"

User: yes

Claude: "Updated!"
```

**Manual workflow (when you want control)**:
```
User: /state-management

Claude: [Checks for changes and syncs]
        "State synchronized with latest commits!"
```

**Key difference**: Skills detect drift automatically, but you can also trigger manually via commands.

## FAQ

### Will my old state files work?

Yes! The metadata format is identical. v2.0 reads the same `STATE_METADATA` comment.

### Can I still manually edit state files?

Yes! The skill detects manual edits and asks how to handle them.

### What if I preferred the command-based approach?

You can stay on v1.0 by not pulling updates. We recommend trying v2.0 - it's much more seamless.

### Do I need to reinstall?

No. Just `git pull` in the plugin directory and restart Claude Code.

### Can I customize sections?

Yes! v2.0 is more flexible. Use any H2 sections that make sense for your project.

## Troubleshooting

### Skills don't trigger

1. Verify plugin.json has skills array:
   ```bash
   cat ~/.claude/plugins/state-manager/.claude-plugin/plugin.json
   ```

2. Restart Claude Code completely

3. Check for errors in Claude Code logs

### State file not updating

1. Ensure you have commits:
   ```bash
   git log --oneline -5
   ```

2. Check metadata in state file has valid commit SHA

3. Verify .claude/project_state.md exists

### Getting skill errors

1. Verify skill frontmatter format (YAML)
2. Check skills/*/SKILL.md files exist
3. Report issue on GitHub with error details

## Rollback to v1.0

If you need to rollback:

```bash
cd ~/.claude/plugins/state-manager
git checkout v1.0.0
npm install
npm run build
```

Restart Claude Code.

## Support

Questions or issues? Open a GitHub issue or discussion!
