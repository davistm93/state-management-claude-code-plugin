---
name: state-docs
description: Synchronize project documentation with code changes. Detects trackable docs, classifies sections, and applies hybrid update strategy (auto-update structural, suggest explanatory).
version: 1.0.0
---

# Documentation Synchronization Skill

## Purpose

Maintain accurate project documentation by detecting code changes and updating relevant doc sections. This skill processes documentation one file at a time, classifying sections as structural (auto-update) or explanatory (suggest only).

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

### 2. Extract Last Docs Sync Point

Read metadata from project_state.md:

```bash
tail -10 .claude/project_state.md
```

Extract `last_docs_sync_commit_sha` from the JSON metadata.

- If **missing**: Treat as first run, use initial commit or last 30 days
- If **exists**: Use as baseline for change detection

### 3. Check for New Commits

Find commits since last docs sync:

```bash
git log --oneline <last_docs_sync_sha>..HEAD --no-merges
```

- If **no commits**: "No commits since last docs sync. Documentation is up to date."
- If **commits found**: Proceed to doc detection

### 4. Detect Trackable Documentation

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

### 5. Check for Uncommitted Changes

For each tracked doc, check if it has uncommitted changes:

```bash
git diff --name-only <doc-path>
```

If uncommitted changes detected:
- **Warn user**: "README.md has uncommitted changes. Proposed updates may conflict with your edits. Continue anyway?"
- **Options**: Continue, commit first, or cancel

### 6. Analyze Changes with Extended Agent

**Use the analyze-changes agent with doc analysis mode:**

Launch the analyze-changes agent (uses Haiku 4.5):

```
Use Task tool with:
- subagent_type: "state-manager:analyze-changes"
- description: "Analyze docs impact"
- prompt: "Analyze commits between <last_docs_sync_sha> and HEAD for documentation impact. For each tracked doc file: <list>, read current content, classify sections as STRUCTURAL or EXPLANATORY, map code changes to affected sections, and generate update recommendations. Use conservative classification: when uncertain, classify as EXPLANATORY."
```

The agent will provide:
- Summary of commits and code changes
- List of affected documentation files
- Per-doc analysis with section classifications
- Specific update recommendations (auto-update vs suggest)
- Detection of missing docs that should exist

### 7. Check for Missing Documentation

Agent may detect missing docs based on code analysis:
- API endpoints found but no `API.md` → Suggest creation
- Complex architecture but no `docs/architecture.md` → Suggest creation

**Ask user**: "Detected API endpoints but no API.md found. Create API.md with detected endpoints?"

If approved:
- Generate initial content based on code analysis
- Write file using Write tool
- Add to git staging: `git add <new-doc>`
- Notify: "API.md created. Review and commit when ready."

### 8. Process Documents One at a Time

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

### 9. Update Metadata

After all docs processed, update project_state.md metadata:

Get current commit and timestamp:
```bash
git rev-parse HEAD
date -u +"%Y-%m-%dT%H:%M:%SZ"
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
- Commits exist but don't affect tracked docs
- "Analyzed 5 commits. No documentation updates needed."

### Git Errors
- If git commands fail, report error
- Suggest checking repository state
- Gracefully skip doc sync for this session

### No Tracked Docs Found
- Smart detection finds no matching files
- "No documentation files found matching standard patterns. Create README.md?"

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

## Output Guidance

- **Progress indicators**: "Processing README.md (1 of 3)..."
- **Clear summaries**: Always show what will change before applying
- **Undo reminder**: "You can use `git checkout` to revert doc changes if needed"
- **Commit suggestion**: After updates, suggest committing docs: "Ready to commit updated documentation?"

---

**Tools to use**: Bash (git commands, find files), Read (load docs and state file), Edit (update sections), Write (create missing docs)
