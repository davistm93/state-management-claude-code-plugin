# State Manager Plugin for Claude Code

Automatically maintains a living `project_state.md` file that tracks your project's architectural evolution and provides rich context to Claude.

## What It Does

The State Manager plugin keeps a synchronized documentation file (`.claude/project_state.md`) that captures:
- System architecture and design patterns
- Active modules and their responsibilities
- Current dependencies and their usage
- Known tech debt and planned improvements
- Infrastructure and deployment details

Instead of manual documentation that goes stale, this plugin **automatically detects code changes** and updates the state file, giving Claude better context for suggestions and understanding your project.

## How It Works

The plugin provides two complementary approaches to state management:

### 1. Skills (Automatic)

**state-management skill** - Automatic state synchronization
- Triggers at session start and after task completion
- Checks if your code has changed since last state sync
- If changes found, analyzes git diff and commits
- Proposes updates to affected sections
- On your approval, updates the state file
- If no changes, continues silently (no interruption)

**state-init skill** - Project initialization
- Triggers when no state file exists
- Analyzes your codebase (languages, frameworks, structure)
- Proposes section structure based on project type
- Generates initial content for each section
- Configures `.claude.md` to automatically load state context
- Creates `.claude/project_state.md`

### 2. Commands (Manual)

For manual control, you can invoke commands directly:

**`/state-init`** - Initialize state tracking
- Manually create `project_state.md` for a new project
- Useful when you want explicit control over initialization timing

**`/state-management`** - Sync state manually
- Force synchronization with recent code changes
- Useful before creating PRs or after completing major features

## Installation

### For Personal Use (Local Development)

```bash
# Clone to your Claude plugins directory
cd ~/.claude/plugins
git clone <this-repo> state-manager

# That's it! No build step required.
```

### From Marketplace (Future)

Once published:
1. Open Claude Code
2. Go to Plugin Marketplace
3. Search for "State Manager"
4. Click Install

## Quick Start

### First Time Setup

**Option 1: Automatic (Skill-based)**
```bash
# Open Claude Code in your project
# Claude will notice you don't have a state file

Claude: "I notice you don't have a project_state.md file.
        Would you like me to create one?"

You: "yes"

Claude: [Analyzes project]
        "I can see this is a Node.js/Express API project.
        I'll create a state file with these sections:
        - System Architecture
        - API Endpoints
        - Active Modules
        - Dependencies
        - Tech Debt
        - Infrastructure

        [Creates files]

        Created project_state.md and configured .claude.md!"
```

**Option 2: Manual (Command-based)**
```bash
# Open Claude Code in your project
# Run the initialization command

You: "/state-init"

Claude: [Analyzes project and creates state file]
        "Initialized state tracking for your project!"
```

### Daily Usage

**Automatic Syncing**
```bash
# You work on features normally
git add .
git commit -m "feat: add user authentication"

# Next time you open Claude Code

Claude: "I found 3 commits since last sync. Changes affect:
        - Active Modules: Added auth middleware
        - Dependencies: Added jsonwebtoken
        - System Architecture: Role-based access control

        Update state file?"

You: "yes"

Claude: "Updated! Now tracking through commit a4f8c2b"
```

**Manual Syncing**
```bash
# After completing a feature, sync manually

You: "/state-management"

Claude: [Checks for changes and syncs state file]
        "State synchronized with latest commits!"
```

## State File Structure

`.claude/project_state.md` contains flexible sections. Common patterns:

```markdown
## System Architecture
High-level patterns, frameworks, architectural decisions

## Active Modules
Major modules/packages and their responsibilities

## Dependencies
External dependencies with usage context

## Tech Debt
Known issues, TODOs, planned improvements

## Infrastructure
Deployment, runtime requirements, configuration
```

**Your project can use any sections that make sense!** The skill adapts to your structure.

## Metadata Tracking

At the bottom of every state file:

```markdown
<!-- STATE_METADATA
{
  "last_sync_commit_sha": "abc123...",
  "last_sync_timestamp": "2026-01-13T10:30:00Z",
  "schema_version": "1.0"
}
-->
```

This tracks when state was last synced and which commit it reflects.

## Claude.md Integration

During initialization, the plugin adds this to your `.claude.md`:

```markdown
## Project State

For current architecture and context, reference `.claude/project_state.md`.
Always read this file at session start to understand the current project state.
```

This ensures Claude automatically loads your project context every session.

## Workflow Examples

### Example: After Feature Development

```
[You implement authentication]
git commit -m "feat: add JWT auth"

[Open Claude Code]

Claude: "I found 1 commit since last sync. Added JWT authentication.

        This affects:
        - Active Modules: auth-service with JWT middleware
        - Dependencies: jsonwebtoken@9.0.0

        Update state?"

You: yes

Claude: "Updated! State now reflects JWT authentication."
```

### Example: Manual State Edit

```
[You manually edit project_state.md to add a note]

[Open Claude Code]

Claude: "I notice project_state.md was manually edited.

        Options:
        1. Keep your edits and update metadata
        2. Review edits against codebase
        3. Skip for now"

You: 1

Claude: "Metadata updated. Your edits are now source of truth."
```

### Example: No Changes (Silent)

```
[You open Claude Code, no commits since last sync]

[Nothing happens - skill is silent]

You: "how do I add validation to the login endpoint?"

Claude: [Proceeds normally with your question]
```

## Benefits

1. **Always Current**: Documentation stays synchronized with code
2. **Better Context**: Claude understands your project architecture
3. **Flexible Control**: Works automatically via skills, or manually via commands
4. **Project Adaptive**: Adapts to any project structure and language
5. **Convention Over Config**: No configuration files needed
6. **Simple**: Pure markdown, no build steps or dependencies

## Migration from v1.0

If you used the old command-based version:

```bash
# Your existing .claude/project_state.md works as-is!
# Just update the plugin:

cd ~/.claude/plugins/state-manager
git pull origin main

# Restart Claude Code - skills activate automatically
```

Your state file format is compatible. No data migration needed.

## Development

### Plugin Structure

```
state-manager/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── commands/
│   ├── state-init.md        # Manual initialization command
│   └── state-management.md  # Manual sync command
├── skills/
│   ├── state-management/
│   │   └── SKILL.md         # Auto-sync skill
│   └── state-init/
│       └── SKILL.md         # Setup skill
├── docs/
│   ├── MIGRATION-v1-to-v2.md
│   └── TESTING.md
└── README.md
```

### Contributing

This is a pure markdown-based plugin. To contribute:

1. Fork the repo
2. Edit files as needed:
   - `skills/*/SKILL.md` - Automatic behavior
   - `commands/*.md` - Manual commands
3. Test by installing locally in `~/.claude/plugins/`
4. Submit PR with description of changes

No build step, no tests - just markdown!

### Editing Tips

**For Skills** (automatic behavior):
- Be explicit about commands to run
- Show expected outputs
- Include error handling steps
- Use code blocks for examples
- Test by triggering the skill in a real project

**For Commands** (manual invocation):
- Include clear frontmatter with description
- Explain what the command does and when to use it
- Typically invoke the corresponding skill using the Skill tool
- Test using the `/command-name` syntax in Claude Code

## License

MIT

## Questions?

Open an issue or discussion on GitHub!
