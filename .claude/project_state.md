# Project State

> Last updated: 2026-01-12 | Commit: 909e0f7

## System Architecture

**Plugin Architecture**: Claude Code plugin using TypeScript with three core commands (state-plan, state-apply, state-status) and one specialized agent (architect).

**Data Flow**: Git operations → Architect analysis → State file reconciliation → Metadata tracking

**Key Patterns**:
- Plan & Apply workflow inspired by Terraform
- Bidirectional drift detection (code changes and manual edits)
- Configurable granularity levels

## Active Modules

- **commands/state-plan**: Analyzes git diffs and proposes state updates via architect agent
- **commands/state-apply**: Commits approved changes to project_state.md with metadata updates
- **commands/state-status**: Shows drift metrics (commits behind, manual edit detection)
- **agents/architect**: Specialized LLM agent for architectural impact analysis
- **lib/git-utils**: Git operations wrapper using simple-git
- **lib/state-parser**: Markdown parser for extracting/updating state file sections

## Dependency Map

- **simple-git** (^3.20.0): Git operations for diff analysis and commit tracking
- **typescript** (^5.0.0): Type-safe development
- **jest** (^29.5.0): Testing framework
- **ts-jest** (^29.1.0): TypeScript support for Jest

## Tech Debt

- TODO: Architect agent currently returns mock data - needs integration with Claude API or Claude Code agent system
- TODO: Session state management for state-apply to read last plan result
- TODO: Post-commit hook implementation for automated state-plan suggestions
- TODO: File context loading for complex changes (>50 lines)

## Infrastructure

- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Build Tool**: TypeScript compiler
- **Plugin System**: Claude Code plugin manifest (.claude-plugin/plugin.json)

<!-- STATE_METADATA: {"last_sync": "2026-01-12T20:00:00Z", "commit_sha": "909e0f7", "version": "1.0", "granularity": "medium"} -->
