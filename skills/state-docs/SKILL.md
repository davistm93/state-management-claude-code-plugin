---
name: state-docs
description: Synchronize project documentation with code changes. Detects trackable docs, classifies sections, and applies hybrid update strategy (auto-update structural, suggest explanatory).
version: 1.0.0
---

# Documentation Synchronization Skill

## Purpose

Maintain accurate project documentation by detecting code changes and updating relevant doc sections. This skill processes documentation one file at a time, classifying sections as structural (auto-update) or explanatory (suggest only).

**Works with or without git**: When git is available, uses commit-based change detection. When git is unavailable, falls back to filesystem snapshot comparison.

**Token Efficiency**: This skill uses haiku 4.5 agents for analysis tasks to minimize token usage.

## When This Skill Activates

1. **Manual invocation**: User runs `/state-docs` command
2. **Post-state-management**: Optional prompt after successful project_state.md sync

## How It Works

### 1. Pre-flight Checks

First, verify project_state.md exists (required for metadata):

```bash
test -f .claude/project_state.md && echo "exists" || echo "missing"
```

- If **missing**: "You need a project_state.md file for doc tracking. Run `/state-init` first."
- If **exists**: Proceed to metadata extraction

### 2. Check and Organize Documentation Structure

Ensure a `docs/` folder exists for organized documentation:

```bash
test -d docs && echo "exists" || echo "missing"
```

- If **missing**: Create it: `mkdir -p docs`
- If **exists**: Continue

This ensures all documentation (except root README.md) can be organized in a standard location.

**Standard documentation structure**:
- `README.md` - Project overview (stays at root)
- `docs/API.md` - API reference and endpoints
- `docs/ARCHITECTURE.md` - System architecture and design decisions
- `docs/CONFIGURATION.md` - Configuration and environment variables
- `docs/DEPLOYMENT.md` - Deployment and infrastructure
- `docs/CONTRIBUTING.md` - Contribution guidelines
- `docs/*.md` - Other domain-specific documentation

### 2.5. Detect Environment

```bash
git rev-parse --git-dir 2>/dev/null && echo "git-available" || echo "no-git"
```

Store this result for use in later steps.

### 3. Extract Last Docs Sync Point

Read metadata from project_state.md:

```bash
tail -10 .claude/project_state.md
```

Extract docs sync info from the JSON metadata:
- In git mode: look for `last_docs_sync_commit_sha`
- In snapshot mode: look for `last_docs_sync_timestamp`

- If **missing**: Treat as first run
- If **exists**: Use as baseline for change detection

### 4. Check for Changes

**Git mode** (git available and `last_docs_sync_commit_sha` present):

Find commits since last docs sync:

```bash
git log --oneline <last_docs_sync_sha>..HEAD --no-merges
```

- If **no commits**: "No commits since last docs sync. Documentation is up to date."
- If **commits found**: Proceed to doc detection

**Snapshot mode** (no git or `last_sync_method: "snapshot"`):

Compare current filesystem against stored snapshot at `.claude/state_snapshot.json`:
1. Scan trackable files and hash them
2. Compare against stored manifest
3. Build change summary (added/modified/deleted files)

- If **no changes**: "No changes since last docs sync. Documentation is up to date."
- If **changes detected**: Build change summary and proceed to doc detection

### 5. Detect Trackable Documentation

Use glob patterns to find documentation files:

```bash
# Find all markdown files, then filter
find . -type f -name "*.md" \
  ! -path "*/node_modules/*" \
  ! -path "*/vendor/*" \
  ! -path "*/.git/*" \
  ! -path "*/drafts/*" \
  ! -path "*/notes/*" \
  ! -path "*/meeting-notes/*" \
  ! -name "CHANGELOG.md"
```

Keep only files matching trackable patterns:
- `README.md` (root)
- `API.md` (root)
- `docs/**/*.md`
- `/api/**/*.md`

Store list of tracked docs for processing.

### 6. Check for Uncommitted Changes

**Git mode only:**

For each tracked doc, check if it has uncommitted changes:

```bash
git diff --name-only <doc-path>
```

If uncommitted changes detected:
- **Warn user**: "README.md has uncommitted changes. Proposed updates may conflict with your edits. Continue anyway?"
- **Options**: Continue, commit first, or cancel

**Snapshot mode:** Skip this step (no concept of uncommitted changes without git).

### 7. Analyze Changes with Extended Agent

**Use the analyze-changes agent with doc analysis mode:**

**Git mode:**

Launch the analyze-changes agent (uses Haiku 4.5):

```
Use Task tool with:
- subagent_type: "state-manager:analyze-changes"
- description: "Analyze docs impact"
- prompt: "Analyze commits between <last_docs_sync_sha> and HEAD for documentation impact. For each tracked doc file: <list>, read current content, classify sections as STRUCTURAL or EXPLANATORY, map code changes to affected sections, and generate update recommendations. Use conservative classification: when uncertain, classify as EXPLANATORY."
```

**Snapshot mode:**

Pass the pre-computed change summary to the agent:

```
Use Task tool with:
- subagent_type: "state-manager:analyze-changes"
- description: "Analyze docs impact"
- prompt: "Analyze the following code changes for documentation impact. For each tracked doc file: <list>, read current content, classify sections as STRUCTURAL or EXPLANATORY, map code changes to affected sections, and generate update recommendations. Use conservative classification: when uncertain, classify as EXPLANATORY.

change_summary:

Added files:
- <file-path> (<size> bytes)
...

Modified files:
- <file-path> (was <old-size> bytes, now <new-size> bytes)
...

Deleted files:
- <file-path>
...

[For each modified dependency file, include its current content]
"
```

The agent will provide:
- Summary of changes
- List of affected documentation files
- Per-doc analysis with section classifications
- Specific update recommendations (auto-update vs suggest)
- Detection of missing docs that should exist

### 8. Check for Missing Documentation and Organize

Agent may detect missing docs based on code analysis. Create them in the appropriate location following the standard structure:

**Missing documentation detection**:
- API endpoints found but no API docs → Suggest `docs/API.md`
- Complex architecture but no architecture docs → Suggest `docs/ARCHITECTURE.md`
- Environment variables used but no config docs → Suggest `docs/CONFIGURATION.md`
- Deployment scripts found but no deployment docs → Suggest `docs/DEPLOYMENT.md`

**Placement rules**:
- `README.md` - Always at root (project overview)
- All other docs - Create in `docs/` folder for organization

**Example prompt**: "Detected 5 API endpoints but no API documentation found. Create docs/API.md with detected endpoints?"

If approved:
1. Ensure `docs/` folder exists (from step 2)
2. Generate initial content based on code analysis
3. Write file to appropriate location using Write tool
4. If git available: add to git staging: `git add <new-doc>`
5. Notify: "docs/API.md created with 5 endpoints. Review and commit when ready."

**If root-level docs exist without docs/ organization**:
- Note during analysis: "Found API.md at root. Standard location is docs/API.md."
- Don't automatically move files (user may have reasons)
- Track both locations in subsequent syncs

### 9. Process Documents One at a Time

For each affected doc (e.g., README.md, docs/api.md):

**Present findings**:
```
Processing README.md (1 of 3)...

Found 3 sections that need updates:

AUTO-UPDATE SECTIONS (will apply after approval):
• Dependencies - 2 new packages detected
  - Added: express@4.18.0, dotenv@16.0.3

SUGGESTED CHANGES (need review):
• Installation - New build step required
  Current: "Run npm install"
  Suggested: "Run npm install && npm run build"

• Architecture - New authentication module added
  Suggested addition: "Auth module handles JWT validation..."

Would you like to apply these updates to README.md?
```

**On approval**:
1. Apply auto-update sections using Edit tool
2. For suggested sections, show before/after and get approval for each
3. Move to next document

**On decline**:
- Skip this document, move to next

### 10. Update Metadata

After all docs processed, update project_state.md metadata:

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

**Git mode:**

Get current commit SHA:
```bash
git rev-parse HEAD
```

Update metadata section using Edit tool:

```markdown
<!-- STATE_METADATA
{
  "last_sync_commit_sha": "<existing-sha>",
  "last_sync_timestamp": "<existing-timestamp>",
  "last_docs_sync_commit_sha": "<new-sha>",
  "last_docs_sync_timestamp": "<new-timestamp>",
  "schema_version": "1.0"
}
-->
```

**Confirm completion**: "Documentation sync complete. Processed N docs, updated M sections. Now tracking through commit <short-sha>."

**Snapshot mode:**

Update the snapshot manifest by rescanning the filesystem. Then update metadata:

```markdown
<!-- STATE_METADATA
{
  "last_sync_method": "snapshot",
  "last_sync_timestamp": "<existing-timestamp>",
  "last_sync_snapshot": ".claude/state_snapshot.json",
  "last_docs_sync_timestamp": "<new-timestamp>",
  "schema_version": "1.0"
}
-->
```

**Confirm completion**: "Documentation sync complete. Processed N docs, updated M sections. Filesystem snapshot updated."

## Section Classification Logic

The analyze-changes agent uses these heuristics:

### STRUCTURAL (auto-update after approval):
- **Header keywords**: dependencies, requirements, installation steps, api reference, endpoints, configuration, environment variables, tech stack
- **Content style**: Primarily lists, tables, code blocks
- **Nature**: Factual data that can be extracted from code
- **Examples**:
  - "## Dependencies" with bulleted package list
  - "## API Endpoints" with route table
  - "## Configuration" with env var list

### EXPLANATORY (suggest only):
- **Header keywords**: overview, architecture, how it works, usage, examples, getting started, introduction, background
- **Content style**: Primarily prose paragraphs
- **Nature**: Requires interpretation, has authorial voice
- **Examples**:
  - "## Architecture" with prose explaining design decisions
  - "## Usage" with narrative examples
  - "## Getting Started" with tutorial-style content

### Conservative Default:
- When section has mixed content (prose + code) → EXPLANATORY
- When classification is uncertain → EXPLANATORY
- Better to suggest and preserve human voice than auto-overwrite

## Edge Cases

### All Sections are Structural
- Doc is pure API reference or dependency list
- Show summary, apply all at once, no section-by-section needed

### All Sections are Explanatory
- Doc is pure narrative (architecture guide)
- Present all suggestions, user accepts/rejects individually

### No Changes Detected
- Changes exist but don't affect tracked docs
- "Analyzed changes. No documentation updates needed."

### Git Errors / No Git Available
- If git commands fail in git mode, check if git is still available
- If git is gone: switch to snapshot mode for this and future syncs
- If git is available but command failed: report error, gracefully skip
- In snapshot mode: git errors don't apply

### No Tracked Docs Found
- Smart detection finds no matching files
- "No documentation files found. Would you like to create a standard documentation structure?"
- If approved, create:
  - `README.md` at root
  - `docs/` folder
  - Optionally suggest common docs based on codebase analysis

### Agent Failure
- If analyze-changes agent errors or times out
- Show error, offer to retry
- Don't update metadata if analysis incomplete

## Style Preservation Rules

When updating sections:

1. **Bullet points**: If section uses `- item` format, add items as bullets
2. **Numbered lists**: If section uses `1. item`, continue numbering
3. **Prose**: If section uses paragraphs, add content as prose
4. **Code blocks**: Include language tags matching existing style
5. **Tables**: Match existing table format (markdown tables, aligned, etc.)
6. **Links**: Use same link format (inline `[text](url)` vs reference `[text][ref]`)
7. **Emphasis**: Match bold/italic patterns for consistency

## Documentation Organization Benefits

Following the `docs/` folder structure provides:

1. **Clarity**: Clear separation between project root and documentation
2. **Scalability**: Easy to add new docs without cluttering root directory
3. **Convention**: Follows industry-standard patterns (Next.js, React, many OSS projects)
4. **Discoverability**: Developers know to look in `docs/` for detailed information
5. **Tool Support**: Many documentation tools (GitHub Pages, Docusaurus) expect `docs/` structure

**Standard structure recap**:
```
project-root/
├── README.md              # Project overview (root)
├── docs/                  # Organized documentation
│   ├── API.md            # API reference
│   ├── ARCHITECTURE.md   # System design
│   ├── CONFIGURATION.md  # Config & env vars
│   ├── DEPLOYMENT.md     # Deployment guide
│   └── *.md              # Other docs
└── ...
```

## Output Guidance

- **Progress indicators**: "Processing README.md (1 of 3)..."
- **Clear summaries**: Always show what will change before applying
- **Undo reminder**: Git mode: "You can use `git checkout` to revert doc changes if needed." Snapshot mode: omit this reminder.
- **Commit suggestion**: Git mode: After updates, suggest committing docs: "Ready to commit updated documentation?" Snapshot mode: omit.
- **Organization notes**: When creating new docs, mention: "Created docs/API.md (following standard documentation structure)"

---

**Tools to use**: Bash (git commands, find files, mkdir, shasum), Read (load docs, state file, snapshot manifest), Edit (update sections), Write (create missing docs, snapshot manifest)
