---
description: Analyze and update project documentation based on code changes
---

# Sync Project Documentation

Manually synchronize your project documentation (README.md, docs/, etc.) with recent code changes by analyzing git commits and updating relevant doc sections.

## What This Command Does

This command will:
1. Detect all trackable documentation files using smart patterns
2. Check for commits since last docs sync
3. Analyze changes in those commits using Haiku 4.5 agent
4. Classify doc sections as structural (auto-update) or explanatory (suggest only)
5. Process one document at a time for focused review
6. Update metadata with latest docs sync point

## Smart Doc Detection

Automatically identifies trackable docs:
- Top-level: `README.md`, `API.md`
- Documentation directories: `/docs/**/*.md`, `/api/**/*.md`
- Exclusions: `CHANGELOG.md`, `/node_modules/`, `/vendor/`, `**/drafts/**`, `**/notes/**`

## Hybrid Update Strategy

**Structural sections** (auto-update after approval):
- Dependency lists, API reference tables, configuration options
- Content is primarily lists, tables, or code blocks
- Factual data extracted from code

**Explanatory sections** (suggest only):
- Architecture discussions, usage guides, examples
- Content is primarily prose paragraphs
- Requires human review to preserve voice

## When to Use

- After completing features that change APIs or architecture
- When dependencies have been updated
- Before creating pull requests to ensure docs are current
- Anytime you want to manually trigger doc synchronization

## Execution

You must invoke the `state-manager:state-docs` skill to perform synchronization:

```
Use the Skill tool to invoke state-manager:state-docs
```

After invocation, follow the skill's instructions to complete the synchronization process.

## Notes

- Processes one doc at a time for manageable review
- Warns if docs have uncommitted changes
- Can suggest creating missing documentation files
- Metadata tracked centrally in `.claude/project_state.md`
