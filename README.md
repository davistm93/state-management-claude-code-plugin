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

The plugin uses two skills that work behind the scenes:

### 1. Automatic State Sync (state-management skill)

**Triggers when:**
- You start a Claude Code session
- You finish implementing a feature

**What it does:**
1. Checks if your code has changed since last state sync
2. If changes found, analyzes git diff and commits
3. Proposes updates to affected sections
4. On your approval, updates the state file
5. If no changes, continues silently (no interruption)

### 2. Project Setup (state-init skill)

**Triggers when:**
- You don't have a state file yet
- You explicitly ask to initialize state management

**What it does:**
1. Analyzes your codebase (languages, frameworks, structure)
2. Proposes section structure based on project type
3. Generates initial content for each section
4. Configures `.claude.md` to automatically load state context
5. Creates `.claude/project_state.md`

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

### Daily Usage

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
3. **Zero Friction**: Works automatically, no manual commands
4. **Flexible**: Adapts to any project structure
5. **Convention Over Config**: No configuration files needed
6. **Simple**: Pure markdown skills, no build steps

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
│   └── plugin.json       # Plugin manifest
├── skills/
│   ├── state-management/
│   │   └── SKILL.md     # Auto-sync skill
│   └── state-init/
│       └── SKILL.md     # Setup skill
└── README.md
```

### Contributing

This is a pure skill-based plugin. To contribute:

1. Fork the repo
2. Edit skill markdown files in `skills/*/SKILL.md`
3. Test by installing locally in `~/.claude/plugins/`
4. Submit PR with description of changes

No build step, no tests - just markdown!

### Skill Editing Tips

Skills are instructions for Claude. When editing:
- Be explicit about commands to run
- Show expected outputs
- Include error handling steps
- Use code blocks for examples
- Test by triggering the skill in a real project

## License

MIT

## Questions?

Open an issue or discussion on GitHub!
