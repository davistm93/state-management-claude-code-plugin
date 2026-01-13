# Claude State Manager Plugin

A Terraform-inspired "Plan & Apply" state management plugin for Claude Code that helps teams track architectural evolution through automatic drift detection and reconciliation.

## Overview

The State Manager plugin maintains a living `project_state.md` file that documents your system architecture, active modules, dependencies, tech debt, and infrastructure. It analyzes git changes to propose updates, giving you visibility into architectural impact before committing to the state file.

## Philosophy

Inspired by Terraform's workflow:
- **Plan**: See what architectural changes have occurred
- **Review**: Understand the impact before applying
- **Apply**: Commit changes to the state file with metadata tracking

## Installation

```bash
# Clone into your Claude plugins directory
cd ~/.claude/plugins
git clone <this-repo> state-manager

# Install dependencies
cd state-manager
npm install

# Build
npm run build
```

## Commands

### `/state-plan`

Analyzes code changes since the last state sync and proposes updates.

**Usage:**
```
/state-plan
```

**What it does:**
1. Finds the last sync point from `project_state.md` metadata
2. Generates git diff since that point
3. Calls the Architect agent to analyze architectural impact
4. Shows a preview of proposed changes

**When to use:**
- After making code changes (committed or uncommitted)
- Before committing to review architectural impact
- Periodically to batch-review multiple commits

### `/state-apply`

Applies the proposed changes from the last `/state-plan` to your state file.

**Usage:**
```
/state-apply
```

**What it does:**
1. Validates that `/state-plan` was run
2. Updates `project_state.md` with approved changes
3. Updates metadata (timestamp, commit SHA)
4. Confirms sync completion

### `/state-status`

Shows current state drift metrics.

**Usage:**
```
/state-status
```

**Output examples:**
```
SUCCESS: State is current

State is 5 commits behind
WARNING: State file manually edited - changes not validated
```

## Configuration

Edit `.claude/plugins/state-manager/.claude-plugin/config.json`:

```json
{
  "granularity": "medium",
  "auto_hooks": false,
  "ignore_patterns": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/fixtures/**"
  ]
}
```

### Granularity Levels

- **high**: Only major changes (new services, database changes, API contracts)
- **medium**: Above + significant classes, routes, config changes
- **fine**: Above + function signatures, utility additions

## State File Structure

`.claude/project_state.md` contains five standardized sections:

```markdown
## System Architecture
High-level patterns and architectural decisions

## Active Modules
Major modules/packages and their responsibilities

## Dependency Map
External dependencies with usage context

## Tech Debt
Known issues and planned improvements

## Infrastructure
Deployment and operational requirements
```

Metadata is tracked in a hidden HTML comment:
```html
<!-- STATE_METADATA: {"last_sync": "2026-01-12T10:30:00Z", "commit_sha": "abc123", "version": "1.0"} -->
```

## The Architect Agent

The Architect agent (`agents/architect.md`) is a specialized LLM agent that:
- Analyzes git diffs for architectural significance
- Compares against existing state to avoid duplication
- Suggests additions, updates, and removals
- Provides confidence scores and clarifying questions

**Output format:**
```json
{
  "summary": "Natural language overview",
  "changes_by_category": { ... },
  "patches": { "section_name": "## Section\n\nContent" },
  "confidence": "high|medium|low",
  "questions": ["..."]
}
```

## Workflow Examples

### Example 1: After Feature Development
```bash
# You've been working on a new authentication module
git add .
git commit -m "feat: add JWT authentication"

# Review architectural impact
/state-plan
# Output: "Added JWT authentication service. Introduces auth-module..."

# Apply changes to state
/state-apply
# Output: "State updated. Tracking 1 commit through a4f8c2b"
```

### Example 2: Batch Review
```bash
# After a week of development with 12 commits

/state-status
# Output: "State is 12 commits behind"

/state-plan
# Output: "Analyzed 12 commits. Major changes: new payment module, Redis caching..."

/state-apply
```

### Example 3: Drift Detection
```bash
# Someone manually edited project_state.md

/state-status
# Output: "WARNING: State file manually edited - changes not validated"

/state-plan
# Architect validates manual changes against actual code
```

## Bidirectional Drift Detection

The plugin detects two types of drift:

1. **Code drift**: Changes in codebase not yet documented
2. **State drift**: Manual edits to state file that may not reflect reality

This ensures your state file stays synchronized with both automated analysis and manual curation.

## Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Build
npm run build

# Clean
npm run clean
```

## Architecture

```
.claude/plugins/state-manager/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── config.json          # User configuration
├── commands/
│   ├── state-plan.ts        # Plan command
│   ├── state-apply.ts       # Apply command
│   └── state-status.ts      # Status command
├── agents/
│   └── architect.md         # Architect agent prompt
├── lib/
│   ├── git-utils.ts         # Git operations
│   ├── state-parser.ts      # State file parsing
│   └── architect-client.ts  # Agent communication
└── hooks/
    └── post-commit.ts       # Optional git hook
```

## Future Enhancements

- [ ] PR integration (comment state diffs on pull requests)
- [ ] Historical snapshots (track evolution over time)
- [ ] Visual dependency graphs
- [ ] Team collaboration features
- [ ] Custom section templates
- [ ] Integration with issue trackers

## Contributing

Contributions welcome! Please ensure:
- Tests pass (`npm test`)
- Code follows TypeScript best practices
- README updated for new features

## License

MIT