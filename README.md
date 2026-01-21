# State Manager Plugin for Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/davistm93/state-management-claude-code-plugin/releases)

Automatically maintains a living `project_state.md` file that tracks your project's architectural evolution and provides rich context to Claude.

## What It Does

The State Manager plugin keeps a synchronized documentation file (`.claude/project_state.md`) that captures:
- System architecture and design patterns
- Active modules and their responsibilities
- Current dependencies and their usage
- Known tech debt and planned improvements
- Infrastructure and deployment details

Instead of manual documentation that goes stale, this plugin **automatically detects code changes** and updates the state file, giving Claude better context for suggestions and understanding your project.

## Why Use This Plugin?

**The Problem**: Claude Code sessions are stateless. Each time you start a new session, Claude has no memory of your project's architecture, recent changes, or design decisions unless you manually explain them.

**Standard Approach**: Use `CLAUDE.md` to document your project. This works for static information, but requires manual updates every time your codebase evolves. Documentation quickly becomes outdated as you add features, refactor code, or update dependencies.

**This Plugin's Solution**:
- **Git-Aware Synchronization**: Automatically detects commits since last sync and identifies what changed
- **Zero Configuration**: Adapts to any project structure, language, or framework without config files
- **Always Current**: State file stays synchronized with your actual codebase
- **Token Efficient**: Uses Haiku 4.5 agents for analysis, minimizing API costs and latency
- **Flexible Control**: Works automatically via skills or manually via commands - you choose the workflow
- **Documentation Sync**: Extends to README.md and other docs, keeping entire project documentation current

Instead of manually documenting "we added JWT auth" in your CLAUDE.md after every feature, this plugin automatically detects the auth changes from your commits and updates the state file with the new architecture, dependencies, and modules. Claude always has accurate, current context about your project.

## How It Works

The plugin provides two complementary approaches to state management:

### 1. Skills (Automatic)

**state-management skill** - Automatic state synchronization
- Triggers at session start and after task completion
- Checks if your code has changed since last state sync
- If changes found, uses efficient Haiku 4.5 agent to analyze git diff and commits
- Proposes updates to affected sections
- On your approval, updates the state file
- After updating state, optionally prompts to sync documentation
- If no changes, continues silently (no interruption)

**state-init skill** - Project initialization
- Triggers when no state file exists
- Uses efficient Haiku 4.5 agent to analyze your codebase (languages, frameworks, structure)
- Proposes section structure based on project type
- Generates initial content for each section
- Configures `CLAUDE.md` to automatically load state context
- Creates `.claude/project_state.md`

**state-docs skill** - Documentation synchronization
- Triggers manually via `/state-docs` command or post-state-management prompt
- Checks for/creates `docs/` folder to organize documentation
- Uses Haiku 4.5 agent to analyze commits for documentation impact
- Detects trackable docs (README.md, docs/*, api/*)
- Classifies doc sections as STRUCTURAL (auto-update) or EXPLANATORY (suggest-only)
- Processes documents one at a time with user approval
- Creates missing docs in standard locations (README.md at root, others in docs/)
- Updates metadata with last docs sync point
- Follows industry-standard documentation structure

### 2. Commands (Manual)

For manual control, you can invoke commands directly:

**`/state-init`** - Initialize state tracking
- Manually create `project_state.md` for a new project
- Useful when you want explicit control over initialization timing

**`/state-management`** - Sync state manually
- Force synchronization with recent code changes
- Useful before creating PRs or after completing major features
- Optionally prompts to sync documentation after state updates

**`/state-docs`** - Sync documentation manually
- Synchronize project documentation with recent code changes
- Ensures `docs/` folder exists for organized documentation
- Analyzes commits since last docs sync
- Updates README.md, docs/*, and other tracked files
- Creates missing docs in standard locations (docs/API.md, docs/ARCHITECTURE.md, etc.)
- Uses hybrid strategy: auto-updates factual sections, suggests changes for narrative sections

## Installation

### From Marketplace (Recommended)

Add the marketplace to Claude Code:
```bash
/plugin marketplace add davistm93/state-management-claude-code-plugin
```

Then install the plugin:
```bash
/plugin install state-manager@stuff-td-says
```

### Manual Installation (Local Development)

```bash
# Clone to your Claude plugins directory
cd ~/.claude/plugins
git clone https://github.com/davistm93/state-management-claude-code-plugin.git state-manager

# That's it! No build step required.
```

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

**Documentation Synchronization**
```bash
# After syncing state, keep docs current

You: "/state-docs"

Claude: "Checking documentation structure...
        Created docs/ folder for organized documentation.

        Analyzing 3 commits for documentation impact:
        - API endpoints (new auth routes)
        - Dependencies (jsonwebtoken added)
        - Configuration (new env vars)

        Detected API endpoints but no API documentation.
        Create docs/API.md with 5 detected endpoints?"

You: "yes"

Claude: "Created docs/API.md (following standard documentation structure).

        Processing README.md (1 of 2)...

        AUTO-UPDATE SECTIONS:
        • Dependencies - will add jsonwebtoken@9.0.0

        SUGGESTED CHANGES:
        • Installation - new build step recommended

        Apply these updates?"

You: "yes"

Claude: "Updated README.md! Processed 2 docs, created 1 new doc.
        Synced through commit a4f8c2b"
```

Or use the automatic prompt:
```bash
# State-management skill can prompt doc sync after state update

Claude: "✓ project_state.md updated successfully.

        I noticed 2 commits since your docs were last synced.
        Would you like to update documentation?"

You: "yes"

Claude: [Runs /state-docs sync process]
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

## CLAUDE.md Integration

During initialization, the plugin adds this to your `CLAUDE.md`:

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
3. **Organized Documentation**: Automatically organizes docs in industry-standard `docs/` folder structure
4. **Flexible Control**: Works automatically via skills, or manually via commands
5. **Project Adaptive**: Adapts to any project structure and language
6. **Convention Over Config**: No configuration files needed
7. **Simple**: Pure markdown, no build steps or dependencies
8. **Token Efficient**: Uses Haiku 4.5 agents for analysis tasks, minimizing costs and latency

## Migration from v1.0 (Existing Users Only)

If you're upgrading from the command-only version (v1.0):

```bash
# Update the plugin
cd ~/.claude/plugins/state-manager
git pull origin main

# Restart Claude Code - skills activate automatically
```

Your existing `.claude/project_state.md` file is fully compatible. No data migration needed.

## Development

### Plugin Structure

```
state-manager/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── agents/
│   ├── analyze-project.md   # Haiku agent for project analysis
│   └── analyze-changes.md   # Haiku agent for change detection with doc analysis
├── commands/
│   ├── state-init.md        # Manual initialization command
│   ├── state-management.md  # Manual sync command
│   └── state-docs.md        # Manual documentation sync command
├── skills/
│   ├── state-management/
│   │   └── SKILL.md         # Auto-sync skill with doc prompt
│   ├── state-init/
│   │   └── SKILL.md         # Setup skill
│   └── state-docs/
│       └── SKILL.md         # Documentation sync skill
├── docs/
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

