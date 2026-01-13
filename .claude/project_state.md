# Project State

> Last updated: 2026-01-13 | Commit: c587444

## System Architecture

**Plugin Architecture**: Pure skill-based Claude Code plugin using markdown skill definitions (no code).

**Directory Structure**: Minimal structure with `.claude-plugin/` for manifest and `skills/` for skill definitions.

**Data Flow**: Git operations → Skill instructions → Claude's built-in tools (Bash, Read, Edit, Write) → State file updates

**Key Patterns**:
- Automatic drift detection via skills
- Convention over configuration
- Zero build dependencies
- Flexible section structure

## Active Modules

- **skills/state-management**: Auto-triggers on session start and task completion to detect and update state drift
- **skills/state-init**: Initializes new project state files and configures .claude.md integration

## Dependency Map

None - pure markdown plugin with zero dependencies.

## Tech Debt

- TODO: Test skills in various project types (Node.js, Python, Go, Rust)
- TODO: Handle edge cases (very large repos, monorepos, submodules)
- TODO: Add examples of state files for different project types
- TODO: Create comprehensive testing documentation

## Infrastructure

- **Runtime**: Claude Code (any version with skill support)
- **Installation**: Manual clone to ~/.claude/plugins/ or marketplace (future)
- **No Build**: No compilation, no package manager, no dependencies

<!-- STATE_METADATA
{
  "last_sync_commit_sha": "c587444aed86a003379a24575d66c81fee1dc089",
  "last_sync_timestamp": "2026-01-13T06:37:34Z",
  "schema_version": "1.0"
}
-->
