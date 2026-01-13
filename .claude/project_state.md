# Project State

> Last updated: 2026-01-12 | Commit: 1a43755

## System Architecture

**Plugin Architecture**: Claude Code plugin using TypeScript with three core commands (state-plan, state-apply, state-status) and one specialized agent (architect).

**Directory Structure**: Standard plugin layout with `.claude-plugin/` at root, ready for installation into `~/.claude/plugins/state-manager/`

**Data Flow**: Git operations → Architect analysis → State file reconciliation → Metadata tracking

**Key Patterns**:
- Plan & Apply workflow inspired by Terraform
- Bidirectional drift detection (code changes and manual edits)
- Configurable granularity levels
- Dynamic plugin directory resolution for portable installation

## Active Modules

- **commands/state-plan**: Analyzes git diffs and proposes state updates via architect agent (working, tested)
- **commands/state-apply**: Commits approved changes to project_state.md with metadata updates
- **commands/state-status**: Shows drift metrics (commits behind, manual edit detection)
- **agents/architect**: Specialized LLM agent for architectural impact analysis
- **lib/git-utils**: Git operations wrapper using simple-git (14 unit tests passing)
- **lib/state-parser**: Markdown parser for extracting/updating state file sections (tested)
- **tests/integration**: End-to-end workflow validation (status → plan → apply)

## Dependency Map

- **simple-git** (^3.20.0): Git operations for diff analysis and commit tracking
- **typescript** (^5.0.0): Type-safe development
- **jest** (^29.5.0): Testing framework
- **ts-jest** (^29.1.0): TypeScript support for Jest

## Tech Debt

- TODO: Architect agent currently returns mock data - needs integration with Claude API or Claude Code agent system
- TODO: Session state management for state-apply to read last plan result from state-plan
- TODO: Post-commit hook implementation for automated state-plan suggestions
- TODO: File context loading for complex changes (>50 lines)
- DONE: ~~Plugin directory structure (moved to root layout)~~
- DONE: ~~Config path resolution (now uses plugin directory dynamically)~~
- DONE: ~~Integration testing (tests/integration.test.ts added)~~

## Infrastructure

- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Build Tool**: TypeScript compiler
- **Plugin System**: Claude Code plugin manifest (.claude-plugin/plugin.json)

<!-- STATE_METADATA: {"last_sync": "2026-01-12T20:30:00Z", "commit_sha": "1a43755", "version": "1.0", "granularity": "medium"} -->
