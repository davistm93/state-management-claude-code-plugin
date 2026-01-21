# Changelog

All notable changes to the State Manager plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-21

### Added
- Initial release of State Manager plugin
- Automatic state synchronization via `state-management` skill
- Project initialization via `state-init` skill
- Documentation synchronization via `state-docs` skill
- Git-aware change detection and analysis
- Haiku 4.5 agent integration for efficient token usage
- Automatic `CLAUDE.md` configuration
- Metadata tracking (last sync commit SHA and timestamp)
- Support for manual state syncing via commands
- Commands: `/state-init`, `/state-management`, `/state-docs`
- Skills that auto-trigger at session start and task completion
- Zero configuration setup - adapts to any project structure
- Documentation organization in `docs/` folder
- Hybrid update strategy (auto-update for structural sections, suggestions for explanatory)
- MIT License
- Comprehensive README with usage examples
- Testing documentation

### Features
- Automatic detection of commits since last sync
- Section-by-section state file updates
- Style-preserving edits (maintains existing formatting)
- Silent mode when no changes detected
- Post-state-update documentation sync prompts
- Error handling for git operations
- Support for manual state file edits
- Token-efficient analysis using Haiku 4.5 agents

[1.0.0]: https://github.com/davistm93/state-management-claude-code-plugin/releases/tag/v1.0.0
