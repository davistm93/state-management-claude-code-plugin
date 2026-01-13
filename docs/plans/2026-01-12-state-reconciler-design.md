# Claude State Reconciler - Design Document

**Date:** 2026-01-12
**Status:** Approved
**Version:** 1.0

## Overview

The Claude State Reconciler is a Terraform-inspired plugin for Claude Code that tracks architectural evolution through a "Plan & Apply" workflow. It reconciles code drift with a living `project_state.md` file, helping teams maintain up-to-date architectural documentation.

## Core Workflow

Developers can run state commands at multiple stages:
- **After making code changes but before committing** - Preview architectural impact
- **After committing code** - Update state to reflect committed changes
- **Periodically (batch mode)** - Review and sync multiple commits at once

The system detects **bidirectional drift**:
- Code changes not yet documented in state file
- Manual edits to state file that may no longer reflect reality

## System Architecture

### Core Components

1. **Command Layer** (`commands/`)
   - `state-plan.ts` - Analyzes changes and proposes state updates
   - `state-apply.ts` - Commits approved changes to state file
   - `state-status.ts` - Shows drift metrics (commits behind, manual edits detected)

2. **Agent Layer** (`agents/`)
   - `architect.md` - Specialized subagent for architectural analysis
   - Input: git diffs + optional full file context
   - Output: JSON-structured analysis + markdown patch proposals

3. **State Layer** (`.claude/project_state.md`)
   - Flat markdown with standard sections
   - Hidden metadata block: `<!-- STATE_METADATA: {...} -->`
   - Sections: System Architecture, Active Modules, Dependency Map, Tech Debt, Infrastructure

4. **Configuration Layer** (`.claude-plugin/config.json`)
   - Granularity settings (high/medium/fine)
   - Hook preferences (enabled/disabled)
   - Custom section templates
   - Ignore patterns

### Data Flow

```
Developer runs /state-plan
  |
Command scans git since last sync
  |
Calls architect agent with diffs
  |
Agent returns analysis + patches
  |
Preview shown to developer
  |
On approval: /state-apply writes changes and updates metadata
```

## Command Workflows

### `/state-plan` Workflow

1. **Detect baseline**: Read `project_state.md` metadata for last sync commit SHA
2. **Gather changes**:
   - Uncommitted changes: `git diff HEAD`
   - Committed changes: `git diff <last_sha>...HEAD`
   - No metadata: `git diff --stat` last 10 commits (initial setup)
3. **Smart context loading**:
   - Small changes (<50 lines): diff only
   - Complex changes (new files, >50 lines, package.json): fetch full file content
4. **Call architect agent**:
   - Pass: diffs, file contexts, current state content, config granularity
5. **Generate preview**:
   - Summary: "Analyzed X commits, Y files changed"
   - Agent's narrative explanation
   - Diff-style preview of proposed section changes
   - Prompt: "Run `/state-apply` to commit these changes"

### `/state-apply` Workflow

1. **Validation**: Ensure `/state-plan` was run in session
2. **Write changes**: Update `project_state.md` with approved patches
3. **Update metadata**: Set `last_sync` timestamp and current `commit_sha`
4. **Confirmation**: "State updated. Tracking X commits through <short_sha>"

### `/state-status` Workflow

1. **Calculate drift**: Commits between current HEAD and last sync SHA
2. **Detect manual edits**: Check if `project_state.md` modified after last sync
3. **Display**:
   - "State is X commits behind" (if drift exists)
   - "WARNING: State file manually edited - changes not validated" (if edited)
   - "SUCCESS: State is current" (if synced)

## Architect Agent Design

**Agent Definition** (`agents/architect.md`):

Specialized prompt focusing on high-level impact analysis:

### Analysis Focus
- New modules, services, or major components
- Database schema or data model changes
- API contract changes (new endpoints, modified signatures)
- Infrastructure changes (new dependencies, environment requirements)
- Cross-cutting concerns (auth, logging, caching)
- Tech debt introduced or resolved

### Output Format

```json
{
  "summary": "Natural language overview of architectural impact",
  "changes_by_category": {
    "system_architecture": ["item1", "item2"],
    "active_modules": ["item1"],
    "dependency_map": ["item1"],
    "tech_debt": ["item1"],
    "infrastructure": ["item1"]
  },
  "patches": {
    "system_architecture": "## System Architecture\n\n[Updated markdown content]",
    "active_modules": "## Active Modules\n\n[Updated markdown content]"
  },
  "confidence": "high|medium|low",
  "questions": ["Optional clarifying questions if analysis is uncertain"]
}
```

### Intelligence Layer
- Compares changes against existing state to avoid duplication
- Suggests removals when code is deleted
- Flags inconsistencies (module in state but not in codebase)
- Respects granularity setting to filter noise

## State File Structure

**Template for `.claude/project_state.md`:**

```markdown
# Project State

> Last updated: 2026-01-12 | Commit: abc123f

## System Architecture

High-level overview of system design, major patterns, and architectural decisions.

Example:
- **Pattern**: Microservices architecture with event-driven communication
- **Core Services**: API Gateway, Auth Service, Data Service
- **Communication**: REST for sync, RabbitMQ for async events

## Active Modules

List of major modules/packages and their responsibilities.

Example:
- **auth-module**: JWT-based authentication, role management
- **payment-processor**: Stripe integration, webhook handling

## Dependency Map

Key external dependencies and their usage context.

Example:
- **express** (4.18.2): Web framework for API layer
- **prisma** (5.2.0): ORM for PostgreSQL database

## Tech Debt

Known issues, workarounds, and planned improvements.

Example:
- TODO: Migrate authentication from session-based to JWT
- FIXME: Payment webhook handler lacks retry logic

## Infrastructure

Deployment, environment, and operational requirements.

Example:
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 14+
- **Hosting**: Docker containers on AWS ECS

<!-- STATE_METADATA: {"last_sync": "2026-01-12T19:45:00Z", "commit_sha": "abc123f", "version": "1.0", "granularity": "medium"} -->
```

### Design Decisions
- Metadata hidden in HTML comment (invisible to readers, parseable by commands)
- Sections marked with `##` headers for easy extraction/replacement
- Examples guide teams on appropriate detail level
- No rigid schema - teams can customize content

## Plugin Manifest & Package Structure

### `.claude-plugin/plugin.json`

```json
{
  "name": "state-manager",
  "version": "1.0.0",
  "description": "Terraform-inspired state reconciliation for tracking architectural evolution",
  "author": "Your Name",
  "claude_version": ">=0.5.0",

  "commands": {
    "state-plan": {
      "description": "Analyze code changes and propose state file updates",
      "script": "./commands/state-plan.ts",
      "category": "state"
    },
    "state-apply": {
      "description": "Apply proposed state changes to project_state.md",
      "script": "./commands/state-apply.ts",
      "category": "state"
    },
    "state-status": {
      "description": "Show current state drift metrics",
      "script": "./commands/state-status.ts",
      "category": "state"
    }
  },

  "agents": {
    "architect": {
      "path": "./agents/architect.md",
      "description": "Architectural impact analyzer"
    }
  },

  "hooks": {
    "post-commit": {
      "script": "./hooks/post-commit.ts",
      "description": "Suggest state-plan after commits",
      "enabled": false
    }
  },

  "config_schema": {
    "granularity": {
      "type": "enum",
      "values": ["high", "medium", "fine"],
      "default": "medium"
    },
    "auto_hooks": {
      "type": "boolean",
      "default": false
    },
    "ignore_patterns": {
      "type": "array",
      "default": ["**/*.test.ts", "**/*.spec.ts", "**/fixtures/**"]
    }
  }
}
```

### `package.json`

```json
{
  "name": "@claude/state-manager",
  "version": "1.0.0",
  "description": "Plan & Apply state management for Claude Code projects",
  "keywords": ["claude-plugin", "state-management", "architecture", "documentation"],
  "author": "Your Name",
  "license": "MIT",
  "main": "commands/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "simple-git": "^3.20.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

## Configuration System

Teams can customize behavior through `.claude-plugin/config.json`:

**Granularity Levels:**
- **high**: Only major architectural changes (new services, database changes)
- **medium**: Above + significant classes, routes, config changes
- **fine**: Above + function signatures, utility additions

**Hook Behavior:**
- Optional post-commit hook suggests `/state-plan` without blocking
- Teams enable/disable via `auto_hooks` config
- Respects developer workflow autonomy

**Ignore Patterns:**
- Skip test files, fixtures, generated code
- Customizable per-project needs

## Implementation Approach

**Hybrid Hook System (Recommended):**
- Optional hooks (configurable on/off) suggest running `/state-plan` without blocking
- Primary workflow is on-demand commands
- `/state-status` shows drift visibility ("X commits behind")
- Respects developer autonomy while providing helpful nudges

**Why This Works:**
- Teams wanting automation can enable hooks
- Others can run manually without interruption
- Visibility prevents state from becoming stale invisibly

## Success Criteria

1. Developers can run `/state-plan` at any stage (uncommitted, committed, batch)
2. Preview shows clear before/after diffs for state file changes
3. Architect agent provides narrative context + structured patches
4. State file remains human-readable and git-friendly
5. Configuration allows teams to tune sensitivity to their needs
6. Bidirectional drift detection catches both code and documentation staleness

## Future Enhancements

- Integration with PR workflows (comment state diff on PRs)
- Historical state snapshots (track architectural evolution over time)
- Visual dependency graphs generated from state file
- Team collaboration features (multiple approvers for state changes)
