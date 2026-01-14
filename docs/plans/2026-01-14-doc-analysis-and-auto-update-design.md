# Documentation Analysis & Auto-Update Feature Design

**Date**: 2026-01-14
**Status**: Design Complete - Ready for Implementation
**Type**: Feature Enhancement

## Overview

### What We're Building

A documentation synchronization system that extends the existing state-manager plugin to keep project documentation accurate alongside code changes.

### Core Capabilities

1. **Smart Doc Detection** - Automatically identifies trackable documentation using conservative patterns:
   - Top-level: `README.md`, `API.md`
   - Documentation directories: `/docs/**/*.md`, `/api/**/*.md`
   - Exclusions: `/node_modules/`, `/vendor/`, `/.git/`, `**/drafts/**`, `**/notes/**`, `**/meeting-notes/**`

2. **Hybrid Update Strategy**:
   - **Structural sections** (dependency lists, API tables, config options) → Auto-update silently after user approval
   - **Explanatory sections** (architecture discussions, usage guides) → Suggest changes for review only
   - Classification handled by LLM with conservative bias (when uncertain, suggest rather than auto-update)

3. **On-Demand Workflow** - `/state-docs` command triggers analysis:
   - Analyzes commits since last doc sync (tracked via metadata in project_state.md)
   - Processes one document at a time for focused review
   - Optional prompt after `/state-management` completes: "Also update other documentation?"

4. **Centralized Tracking** - Extends project_state.md metadata:
   ```markdown
   <!-- STATE_METADATA
   {
     "last_sync_commit_sha": "abc123...",
     "last_sync_timestamp": "2026-01-13T10:30:00Z",
     "last_docs_sync_commit_sha": "abc123...",
     "last_docs_sync_timestamp": "2026-01-14T09:15:00Z",
     "schema_version": "1.0"
   }
   -->
   ```

## Detailed Workflow

### User Invokes `/state-docs` Command

#### Step 1: Pre-flight Checks
- Check if `.claude/project_state.md` exists (required for metadata)
  - If missing → suggest running `/state-init` first
- Extract `last_docs_sync_commit_sha` from metadata
  - If missing → treat as first run, analyze all commits
- Find commits since last sync: `git log <sha>..HEAD --oneline`
  - If none → "No commits since last docs sync. Documentation is up to date."
  - If found → Continue to analysis

#### Step 2: Detect Tracked Docs
- Scan repo for markdown files matching smart patterns
- Exclude CHANGELOG.md from tracking (user maintains manually)
- Check each file for uncommitted changes: `git diff <file>`
  - If uncommitted → Warn: "README.md has uncommitted changes. Proposed updates may conflict. Continue anyway?"
  - User can proceed, commit first, or cancel

#### Step 3: Analyze Changes (Extended analyze-changes Agent)
- Same agent that handles project_state.md, with extended capabilities:
  - Review commits and diffs since last sync
  - Identify code changes that affect documentation
  - For each tracked doc file:
    - Read current content
    - Classify sections as structural vs explanatory (AI-driven, conservative)
    - Map code changes to affected sections
    - Generate structural updates (dependencies, API lists, etc.)
    - Draft suggested narrative updates (architecture explanations, usage guides)

#### Step 4: Check for Missing Docs
- Agent detects if expected docs are missing:
  - API endpoints found but no `API.md` → Suggest creation
  - Complex architecture but sparse `/docs/` → Mention in summary
- Ask user: "Create API.md with detected endpoints?" (only if approved)

#### Step 5: Process One Doc at a Time
- Present findings for first doc (e.g., README.md):
  ```
  README.md - 3 sections need updates:

  AUTO-UPDATE (will apply silently):
  - Dependencies section (2 new packages detected)

  SUGGESTED CHANGES (need review):
  - Installation section (new build step required)
  - Architecture section (new module added)
  ```
- User approves/declines updates for this doc
- Move to next doc and repeat

#### Step 6: Apply Updates
- For auto-update sections: Use Edit tool to replace content
- For suggested sections: Show before/after, apply only if approved
- Update metadata in project_state.md with new `last_docs_sync_commit_sha`

## Technical Implementation

### New Files to Create

1. **`commands/state-docs.md`** - Command definition
   ```yaml
   ---
   name: state-docs
   description: Analyze and update project documentation based on code changes
   ---
   ```
   - Triggers doc analysis workflow
   - Can be invoked independently or after `/state-management`

2. **`agents/analyze-docs.md`** - Extended instructions (or append to analyze-changes.md)
   - Section classification logic (structural vs explanatory)
   - Doc pattern detection rules
   - Missing doc detection heuristics
   - Update generation guidelines

### Modified Files

1. **`agents/analyze-changes.md`** - Extend existing agent
   - Add documentation analysis section
   - Instructions for classifying doc sections
   - Guidelines for generating doc updates
   - Conservative bias rules ("when uncertain, suggest")

2. **`skills/state-management/SKILL.md`** - Add post-completion prompt
   - After successful project_state.md update
   - Ask: "Also update other documentation? (run /state-docs)"
   - Only show if commits exist since last docs sync

3. **`.claude/project_state.md` metadata schema** - Add fields:
   ```json
   {
     "last_sync_commit_sha": "...",
     "last_sync_timestamp": "...",
     "last_docs_sync_commit_sha": "...",  // NEW
     "last_docs_sync_timestamp": "...",    // NEW
     "schema_version": "1.0"
   }
   ```

### Agent Classification Logic

The extended analyze-changes agent uses these heuristics to classify sections:

#### Structural (auto-update):
- Section headers containing: "dependencies", "requirements", "installation steps", "api reference", "endpoints", "configuration", "environment variables"
- Content is primarily lists, tables, or code blocks
- Factual data that can be extracted from code

#### Explanatory (suggest only):
- Section headers: "overview", "architecture", "how it works", "usage", "examples", "getting started"
- Content is primarily prose paragraphs
- Requires interpretation or editorial voice
- When classification uncertain → default to "suggest only"

#### Example Agent Instruction Snippet:
```markdown
For each documentation section, classify as STRUCTURAL or EXPLANATORY:

STRUCTURAL sections:
- Header keywords: dependencies, api, config, requirements
- Mostly lists/tables/code blocks
- Updates: Generate new content and apply directly

EXPLANATORY sections:
- Header keywords: overview, architecture, usage, how
- Mostly prose paragraphs
- Updates: Draft suggestions, never auto-apply

When uncertain, classify as EXPLANATORY (conservative default).
```

## Error Handling & Edge Cases

### Error Scenarios

1. **Git Errors**
   - Cannot determine commits: `git log` fails or repo in detached HEAD
   - Action: Show error, suggest running `git status` to check repo state
   - Graceful degradation: Offer to analyze all tracked docs without commit filtering

2. **Missing Metadata**
   - `last_docs_sync_commit_sha` not found in project_state.md
   - Action: Treat as first run, analyze from initial commit or last 30 days
   - Inform user: "First docs sync - analyzing recent commits"

3. **Conflicting Manual Edits**
   - User warned about uncommitted changes but proceeds
   - Action: Apply updates via Edit tool (relies on exact string matching)
   - If Edit fails due to conflict: Skip that section, report failure, continue with other sections

4. **Agent Failures**
   - analyze-changes agent errors or times out
   - Action: Show error message, offer to retry
   - Preserve state: Don't update metadata if analysis incomplete

5. **No Tracked Docs Found**
   - Smart detection finds no matching files
   - Action: "No documentation files found matching standard patterns. Detected only: [list]. Create README.md?"

### Edge Cases

1. **All Sections are Auto-Update**
   - Doc has only structural content (e.g., pure API reference)
   - Workflow: Show summary, apply all updates in one step, no section-by-section review needed

2. **All Sections are Explanatory**
   - Doc is purely narrative (e.g., architecture guide)
   - Workflow: Present all suggestions at once, user can accept/reject individually

3. **No Changes Detected**
   - Commits exist but don't affect any tracked docs
   - Action: "Analyzed 5 commits. No documentation updates needed."

4. **New Doc Created**
   - User approves creation of missing doc (e.g., API.md)
   - Action: Generate initial content, write file, add to git staging area
   - Note: "API.md created. Review and commit when ready."

5. **Protected Sections** (Future enhancement)
   - User adds HTML comment: `<!-- MANUAL-ONLY -->` around section
   - Agent respects marker and never proposes updates to that section
   - Not in v1 but acknowledged in design for future

### User Experience Details

- **Progress indicators**: "Processing README.md (1 of 3)..."
- **Clear summaries**: Always show what will change before applying
- **Undo guidance**: Remind users they can use git to revert doc changes
- **Dry-run option** (future): `/state-docs --dry-run` to see analysis without applying changes

## Testing & Validation

### Test Scenarios

1. **First-Time Doc Sync**
   - Setup: Fresh repo with README.md, no prior docs sync metadata
   - Run: `/state-docs`
   - Expected: Analyzes all commits, classifies README sections, proposes updates, adds `last_docs_sync_commit_sha` to metadata

2. **Incremental Updates**
   - Setup: Add new dependency to package.json, commit, then run `/state-docs`
   - Expected: Detects dependency change, auto-updates Dependencies section in README.md, updates metadata

3. **Mixed Structural + Explanatory**
   - Setup: Modify API endpoint and architecture (both changes affect README.md)
   - Expected: Auto-update API section, suggest narrative update for Architecture section, process separately

4. **No Changes Needed**
   - Setup: Make commits that don't affect docs (e.g., fix typo in code comment)
   - Expected: "Analyzed 2 commits. No documentation updates needed."

5. **Missing Doc Creation**
   - Setup: Project with API endpoints but no API.md
   - Expected: Detect missing doc, prompt "Create API.md with detected endpoints?", generate if approved

6. **Uncommitted Doc Changes**
   - Setup: Edit README.md without committing
   - Expected: Warn "README.md has uncommitted changes. Continue anyway?", proceed if user approves

7. **Multiple Docs in One Run**
   - Setup: Changes affect both README.md and docs/architecture.md
   - Expected: Process README.md first (show changes, get approval), then docs/architecture.md

8. **Post-State-Management Prompt**
   - Setup: Run `/state-management`, complete successfully
   - Expected: Prompt "Also update other documentation? (run /state-docs)"

9. **CHANGELOG Exclusion**
   - Setup: Repo has CHANGELOG.md in root
   - Expected: Smart detection skips CHANGELOG.md, not included in tracked docs

10. **Classification Edge Cases**
    - Setup: README with unclear section (e.g., "## Quick Start" with both code and prose)
    - Expected: Conservative classification → suggest only, don't auto-update

### Validation Checklist

- [ ] Smart detection patterns correctly identify docs
- [ ] Exclusion patterns prevent tracking non-docs
- [ ] Section classification works for common doc structures
- [ ] Auto-updates apply cleanly without formatting loss
- [ ] Suggested updates preserve user's writing voice
- [ ] Metadata updates correctly after successful sync
- [ ] Error messages are clear and actionable
- [ ] Works with both `/state-docs` standalone and post-`/state-management` prompt
- [ ] Uncommitted changes warning prevents conflicts
- [ ] Missing doc creation generates useful initial content

### Testing Approach

Create test repository with:
- Typical project structure (src/, docs/, README.md, package.json)
- Various doc types (API reference, architecture guide, user guide)
- Mixed section types (structural lists + explanatory prose)
- CHANGELOG.md to verify exclusion

Then execute each scenario and validate behavior matches expectations.

## Success Criteria & Future Enhancements

### Success Criteria

The feature is successful if:

1. **Accuracy**: Structural sections update correctly 95%+ of the time without manual fixes needed
2. **Safety**: No unintended overwrites of user content (conservative classification prevents this)
3. **Usability**: Users can complete doc sync in <2 minutes for typical projects
4. **Discoverability**: Post-`/state-management` prompt drives adoption (users learn about `/state-docs`)
5. **Non-intrusive**: Only runs on-demand, never interrupts workflow
6. **Reliable**: Handles common edge cases (uncommitted changes, missing docs, no changes) gracefully

### Acceptance Tests

- Run on 3-5 real projects of varying types (Node.js, Python, Go)
- Verify classification accuracy across different doc styles
- Confirm no false positives (updates where none needed)
- Test all error scenarios produce helpful messages

### Future Enhancements (Not in V1)

1. **Protected Section Markers**
   ```markdown
   <!-- MANUAL-ONLY -->
   This section is maintained manually and should not be auto-updated.
   <!-- /MANUAL-ONLY -->
   ```
   - Agent respects markers and skips those sections entirely

2. **Per-Doc Configuration**
   - Optional `.claude/docs-config.json` for advanced users:
     ```json
     {
       "include_patterns": ["docs/**/*.md", "*.md"],
       "exclude_patterns": ["**/drafts/**", "meeting-notes/**"],
       "always_structural": ["docs/api/**/*.md"],
       "always_suggest": ["docs/guides/**/*.md"]
     }
     ```

3. **Dry-Run Mode**
   - `/state-docs --dry-run` shows what would change without applying
   - Useful for CI/CD validation (detect doc drift in PR checks)

4. **Doc Quality Checks**
   - Detect broken links in docs
   - Flag outdated code examples (syntax doesn't match current codebase)
   - Suggest improvements to stale sections

5. **Format-Specific Handlers**
   - Special handling for API docs (OpenAPI/Swagger integration)
   - Diagram updates (detect when Mermaid/PlantUML diagrams need refreshing)
   - Table of contents auto-generation

6. **Batch Mode**
   - `/state-all` command that runs both `/state-management` and `/state-docs` in sequence
   - For users who always want both

7. **Configurable Classification**
   - Allow users to train/tune classification with examples
   - "This section should always auto-update" or "Always suggest for this pattern"

### Non-Goals (Explicitly Out of Scope)

- CHANGELOG generation (too editorial, users prefer manual control)
- Non-markdown docs (HTML, PDF, etc. - too complex for V1)
- Real-time sync (on-demand only, no file watching)
- Multi-language support (English docs only initially)
- Doc generation from code comments (JSDoc, docstrings - separate feature)

## Design Summary

This feature extends state-manager to keep project documentation synchronized with code:

- **Smart detection** finds trackable docs automatically
- **Hybrid updates** balance automation (structural) with human review (explanatory)
- **On-demand workflow** via `/state-docs` command
- **Centralized tracking** in project_state.md metadata
- **Conservative defaults** prevent unintended overwrites
- **One-doc-at-a-time** review keeps it manageable

The implementation leverages existing infrastructure (analyze-changes agent, metadata system, skill patterns) for a natural extension of current functionality.

## Implementation Notes

### File Changes Summary

**New Files:**
- `commands/state-docs.md` - Command definition
- `agents/analyze-docs.md` - Documentation analysis instructions (or extend analyze-changes.md)

**Modified Files:**
- `agents/analyze-changes.md` - Add doc analysis capabilities
- `skills/state-management/SKILL.md` - Add post-completion prompt
- `.claude/project_state.md` - Extended metadata schema

### Integration Points

1. **Post-`/state-management` Hook**: After successful project_state.md sync, check if docs need updating
2. **Shared Agent**: analyze-changes handles both code state and documentation
3. **Metadata Extension**: Same metadata format, just additional fields
4. **Existing Tools**: Leverages Bash, Glob, Read, Edit tools already in use

### Implementation Phases

**Phase 1: Core Functionality**
- Smart doc detection
- Section classification
- Basic auto-update and suggest workflows
- Metadata tracking

**Phase 2: User Experience**
- Post-`/state-management` prompt
- Uncommitted changes warning
- Progress indicators
- One-doc-at-a-time processing

**Phase 3: Edge Cases**
- Missing doc creation
- Error handling
- No changes detected
- Git error recovery

**Phase 4: Testing & Refinement**
- Run all test scenarios
- Validate on real projects
- Tune classification heuristics
- Document usage patterns

## Open Questions

None - design is complete and ready for implementation.

## Sign-off

This design has been reviewed and approved. Ready to proceed with implementation planning.
