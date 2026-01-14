# Documentation Analysis & Auto-Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add documentation synchronization to state-manager plugin, enabling automatic detection and updating of project docs based on code changes.

**Architecture:** Extends existing analyze-changes agent with doc analysis capabilities, adds new `/state-docs` command for on-demand doc sync, and integrates with state-management workflow via post-completion prompt.

**Tech Stack:** Markdown-based plugin architecture, YAML frontmatter, Haiku 4.5 agents, git-based change detection

---

## Task 1: Create `/state-docs` Command Definition

**Files:**
- Create: `commands/state-docs.md`

### Step 1: Write command definition file

Create `commands/state-docs.md` with the command definition and user documentation:

```markdown
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
```

### Step 2: Verify file structure

Run: `cat commands/state-docs.md | head -20`
Expected: File exists, has YAML frontmatter, readable content

### Step 3: Commit command definition

```bash
git add commands/state-docs.md
git commit -m "feat: add /state-docs command definition"
```

---

## Task 2: Extend Metadata Schema in project_state.md

**Files:**
- Documentation: Update metadata schema documentation

### Step 1: Document new metadata fields

The metadata schema needs two new fields:
- `last_docs_sync_commit_sha`: Commit SHA when docs were last analyzed
- `last_docs_sync_timestamp`: ISO 8601 timestamp of last docs sync

Example updated metadata:
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

### Step 2: Update README with metadata documentation

This will be done in Task 7 when we update all user-facing docs.

---

## Task 3: Create state-docs Skill Definition

**Files:**
- Create: `skills/state-docs/SKILL.md`

### Step 1: Create skills directory

```bash
mkdir -p skills/state-docs
```

### Step 2: Write state-docs skill file

Create `skills/state-docs/SKILL.md`:

```markdown
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

**Tools to use**: Bash (git commands, find), Glob (find docs), Read (load docs and state file), Edit (update sections), Write (create missing docs)
```

### Step 3: Verify skill file

Run: `cat skills/state-docs/SKILL.md | head -30`
Expected: YAML frontmatter, readable skill instructions

### Step 4: Commit skill definition

```bash
git add skills/state-docs/SKILL.md
git commit -m "feat: add state-docs skill for documentation synchronization"
```

---

## Task 4: Extend analyze-changes Agent for Doc Analysis

**Files:**
- Modify: `agents/analyze-changes.md` (append doc analysis section)

### Step 1: Read current analyze-changes agent

Already read in previous step - file is at `agents/analyze-changes.md`

### Step 2: Append documentation analysis section

Add this section to the end of `agents/analyze-changes.md` (before the final "Begin your analysis now!"):

```markdown

---

## Documentation Analysis Mode (Extended Capability)

When invoked with documentation analysis prompt, extend your analysis to cover how code changes affect project documentation.

### Doc Analysis Additional Steps

After completing standard change analysis (steps 1-7 above), add these steps:

#### 8. Load Tracked Documentation Files

You will be given a list of tracked doc files. For each file:

```bash
# Read the documentation file
cat <doc-file-path>
```

Parse the structure:
- Identify all H2 sections (`## Section Name`)
- Note content style of each section (lists, prose, tables, code blocks)
- Extract current factual data (dependencies mentioned, API endpoints listed, etc.)

#### 9. Classify Each Doc Section

For each H2 section in each doc file, classify as STRUCTURAL or EXPLANATORY:

**STRUCTURAL Classification:**
- Header contains: "dependencies", "requirements", "installation", "api", "endpoints", "configuration", "environment", "tech stack", "setup", "prerequisites"
- Content is primarily:
  - Bulleted or numbered lists
  - Tables (markdown tables)
  - Code blocks with configs/commands
  - Factual enumerations
- Can be reliably updated from code analysis

**EXPLANATORY Classification:**
- Header contains: "overview", "architecture", "how it works", "usage", "examples", "getting started", "introduction", "background", "guide", "tutorial"
- Content is primarily:
  - Prose paragraphs
  - Narrative explanations
  - Conceptual descriptions
  - Examples with explanation
- Requires human interpretation and voice

**Conservative Default:**
- Mixed content (prose + lists) → EXPLANATORY
- Uncertain → EXPLANATORY
- "Quick Start" with code and prose → EXPLANATORY
- When in doubt → EXPLANATORY

#### 10. Map Code Changes to Doc Sections

For each code change identified in your analysis:

**Dependency Changes** → Doc sections about dependencies/requirements
- Extract current dependency list from doc
- Compare with actual dependencies from code
- Generate updated list

**New Files/Modules** → Doc sections about architecture/modules/components
- Note which docs mention module structure
- Suggest additions for new modules

**API Changes** (new routes, endpoints, commands) → API documentation sections
- Identify API-related doc sections
- Compare documented APIs with actual code
- Generate additions for new endpoints

**Config Changes** (.env, docker, CI/CD) → Configuration/infrastructure sections
- Extract current config documentation
- Compare with actual config files
- Generate updated config lists

**Code Examples in Docs** → Usage/example sections
- Check if code examples match current code syntax
- Flag outdated examples (suggest only, never auto-update)

#### 11. Generate Doc-Specific Recommendations

For each affected doc file, output:

```markdown
### Documentation File: <path>

#### Sections Classification:
- **STRUCTURAL**: [list section names]
- **EXPLANATORY**: [list section names]

#### Recommended Updates:

##### Section: <section name> [STRUCTURAL - AUTO-UPDATE]
**Current Content:**
```
[exact excerpt from doc]
```

**Proposed Update:**
```
[exact new content to replace with]
```

**Reasoning**: [why - reference commits/files changed]

---

##### Section: <section name> [EXPLANATORY - SUGGEST ONLY]
**Current Content:**
```
[excerpt]
```

**Suggested Addition/Change:**
```
[suggested new content]
```

**Reasoning**: [why - what code changes motivate this]

---

#### Missing Sections Detected:
- **Section Name**: [suggest adding this section because...]
```

#### 12. Detect Missing Documentation Files

Based on code analysis, check if documentation SHOULD exist but doesn't:

**API Endpoints Found:**
- If you detect route handlers, API endpoints, or command definitions
- But no `API.md` or `docs/api.md` exists
- → Recommend: "Create API.md documenting the N endpoints found"

**Complex Module Structure:**
- If project has multiple modules/packages
- But no architecture documentation in `/docs/`
- → Recommend: "Consider creating docs/architecture.md to document module structure"

**Configuration Files:**
- If project has .env.example, docker-compose.yml, complex config
- But no configuration documentation
- → Recommend: "Create docs/configuration.md documenting environment setup"

### Doc Analysis Output Format

When in documentation analysis mode, extend your standard output with:

```markdown
## Documentation Analysis Results

### Tracked Documentation Files
[List of files analyzed]

### Files with Updates Needed: [count]

---

#### File: README.md

**Section Classifications:**
- STRUCTURAL: Dependencies, Installation Steps, Configuration
- EXPLANATORY: Overview, Architecture, Usage Examples

**Updates Required:**

[Use format from step 11 above for each section]

---

#### File: docs/api.md

[Repeat structure]

---

### Files Not Affected: [count]
[List files that don't need updates]

### Missing Documentation Detected:
- API.md: Project has 12 API endpoints but no API documentation
- docs/configuration.md: Complex environment setup not documented

### Summary for User
[2-3 sentences summarizing doc changes needed]
```

### Notes for Doc Analysis

- Be conservative with classification - preserve human voice
- Provide exact content for STRUCTURAL sections (copy-pasteable)
- Provide suggestions with reasoning for EXPLANATORY sections
- Never recommend changes to CHANGELOG.md (explicitly excluded)
- Match existing formatting style in each doc
- When suggesting new docs, provide outline/starter content

```

### Step 3: Verify the extension

Run: `tail -50 agents/analyze-changes.md`
Expected: New documentation analysis section visible

### Step 4: Commit agent extension

```bash
git add agents/analyze-changes.md
git commit -m "feat: extend analyze-changes agent with documentation analysis capabilities"
```

---

## Task 5: Add Post-Completion Prompt to state-management Skill

**Files:**
- Modify: `skills/state-management/SKILL.md` (add post-completion section)

### Step 1: Locate completion section

The file currently ends at line 174. We need to add a new section before the final "Tools to use" line.

### Step 2: Add post-completion prompt section

Insert this new section after the "Silent Mode" section (after line 169) and before the final "Tools to use" line:

```markdown

## Post-Completion Prompt

After successfully updating project_state.md, check if documentation might also need updating.

### Check for Docs Drift

After updating state file metadata, check if docs are also out of sync:

```bash
# Extract last_docs_sync_commit_sha from metadata
tail -10 .claude/project_state.md | grep -o '"last_docs_sync_commit_sha": "[^"]*"' | cut -d'"' -f4
```

If `last_docs_sync_commit_sha` is found:
```bash
# Check if there are commits since last docs sync
git log --oneline <last_docs_sync_sha>..HEAD --no-merges | wc -l
```

- If **no commits since docs sync**: Don't prompt, docs are current
- If **commits found**: Prompt user about doc updates

If `last_docs_sync_commit_sha` is NOT found in metadata:
- This means docs have never been synced
- Prompt user about doc updates

### The Prompt

If docs might be out of sync, present this option to the user:

"✓ project_state.md updated successfully.

I notice there are N commits since your documentation was last synced. Would you like to update project documentation (README, docs/, etc.) to reflect these changes?

I can run `/state-docs` to analyze and update your docs now, or you can run it manually later."

**On user approval:**
- Invoke the state-docs skill: Use Skill tool with skill="state-manager:state-docs"

**On user decline:**
- Continue normally

### Don't Over-Prompt

- Only prompt if there's actual drift (commits since last docs sync)
- Keep it brief and actionable
- Make it easy to decline
- Don't prompt every time - only when state file was updated

```

### Step 3: Verify the addition

Run: `grep -A 10 "Post-Completion Prompt" skills/state-management/SKILL.md`
Expected: New section visible

### Step 4: Commit skill modification

```bash
git add skills/state-management/SKILL.md
git commit -m "feat: add post-completion prompt to state-management for doc updates"
```

---

## Task 6: Register state-docs Skill in Plugin Manifest

**Files:**
- Modify: `.claude-plugin/plugin.json` (if exists and required)

### Step 1: Check if plugin.json needs skill registration

```bash
cat .claude-plugin/plugin.json
```

Expected: Check if skills are explicitly registered or auto-discovered

### Step 2: Update plugin.json if needed

If skills need explicit registration, add `state-docs` to the skills array.

If skills are auto-discovered from `skills/` directory, no changes needed.

### Step 3: Commit if modified

```bash
git add .claude-plugin/plugin.json
git commit -m "chore: register state-docs skill in plugin manifest"
```

Note: This step may not be needed if skills are auto-discovered.

---

## Task 7: Update README with Documentation Sync Features

**Files:**
- Modify: `README.md`

### Step 1: Read current README

```bash
cat README.md | grep -n "## "
```

Identify section structure to determine where to add doc sync info.

### Step 2: Add documentation sync section

Add a new section "## Documentation Synchronization" after the main "How It Works" section.

Content to add:

```markdown
## Documentation Synchronization

In addition to tracking project architecture in `project_state.md`, the plugin can synchronize your project documentation (README.md, docs/, etc.) with code changes.

### How It Works

**Smart Detection**: Automatically identifies trackable documentation:
- Top-level: `README.md`, `API.md`
- Documentation directories: `/docs/**/*.md`, `/api/**/*.md`
- Excludes: `CHANGELOG.md`, `node_modules/`, `vendor/`, `drafts/`, `notes/`

**Hybrid Updates**: Balances automation with human control:
- **Structural sections** (dependencies, API lists, config) → Auto-update after approval
- **Explanatory sections** (architecture prose, guides) → Suggest changes only

**On-Demand Workflow**: Run `/state-docs` command when you want to sync docs:
1. Detects commits since last docs sync
2. Analyzes code changes for doc impact
3. Classifies doc sections as structural vs explanatory
4. Processes one doc at a time for review
5. Updates metadata to track sync point

### Using Documentation Sync

**Automatic Prompt**: After updating `project_state.md`, you'll be prompted if docs need updating:
```
✓ project_state.md updated successfully.

I notice there are 3 commits since your documentation was last synced.
Would you like to update project documentation?
```

**Manual Command**: Run anytime with `/state-docs`

**Example Workflow**:
```
You: /state-docs

Claude: Found 5 commits since last docs sync. Analyzing...

Processing README.md (1 of 2)...

AUTO-UPDATE SECTIONS:
• Dependencies - 2 new packages detected

SUGGESTED CHANGES:
• Architecture - New auth module added

Apply these updates? [approve/decline]
```

### Metadata Tracking

Documentation sync state is tracked in `project_state.md` metadata:

```markdown
<!-- STATE_METADATA
{
  "last_sync_commit_sha": "abc123",
  "last_sync_timestamp": "2026-01-13T10:30:00Z",
  "last_docs_sync_commit_sha": "def456",
  "last_docs_sync_timestamp": "2026-01-14T09:15:00Z",
  "schema_version": "1.0"
}
-->
```

- `last_docs_sync_commit_sha`: Commit when docs were last analyzed
- `last_docs_sync_timestamp`: ISO 8601 timestamp of last docs sync
```

### Step 3: Update command reference section

Find the section listing commands and add `/state-docs`:

```markdown
### Commands

**`/state-init`**: Initialize project_state.md for a new project

**`/state-management`**: Manually sync project_state.md with code changes

**`/state-docs`**: Sync project documentation (README, docs/) with code changes
```

### Step 4: Commit README updates

```bash
git add README.md
git commit -m "docs: document documentation synchronization features in README"
```

---

## Task 8: Create Testing Documentation

**Files:**
- Modify: `docs/TESTING.md` (add doc sync test scenarios)

### Step 1: Read current TESTING.md

```bash
cat docs/TESTING.md | grep -n "## "
```

### Step 2: Add doc sync test scenarios section

Append this section to TESTING.md:

```markdown

---

## Documentation Sync Testing Scenarios

### Scenario 6: First-Time Doc Sync

**Setup:**
```bash
# Ensure project has README.md but no docs sync metadata
# Remove last_docs_sync_commit_sha from metadata if present
```

**Test:**
```
Run: /state-docs
```

**Expected:**
1. Detects this is first docs sync
2. Analyzes recent commits (last 30 days or all)
3. Classifies README sections
4. Proposes updates for affected sections
5. Adds `last_docs_sync_commit_sha` to metadata

**Validation:**
- Metadata contains both docs sync fields
- README updated appropriately
- No errors displayed

---

### Scenario 7: Incremental Doc Updates

**Setup:**
```bash
# Add new dependency to package.json
npm install axios
git add package.json package-lock.json
git commit -m "feat: add axios for HTTP requests"
```

**Test:**
```
Run: /state-docs
```

**Expected:**
1. Detects 1 commit since last sync
2. Identifies dependency change
3. Finds "Dependencies" section in README.md
4. Classifies as STRUCTURAL
5. Auto-updates with new dependency after approval
6. Updates metadata

**Validation:**
- README Dependencies section includes axios
- Metadata last_docs_sync_commit_sha updated to latest
- Formatting preserved

---

### Scenario 8: Mixed Structural and Explanatory Updates

**Setup:**
```bash
# Modify API endpoint and add feature
# Commit changes
git commit -m "feat: add authentication endpoint and update architecture"
```

**Test:**
```
Run: /state-docs
```

**Expected:**
1. Detects API change affects README
2. "API Endpoints" section → STRUCTURAL → auto-update
3. "Architecture" section → EXPLANATORY → suggest only
4. Processes separately with different workflows

**Validation:**
- API section auto-updated with new endpoint
- Architecture section shows suggested changes
- User can review narrative suggestion before applying

---

### Scenario 9: No Changes Needed

**Setup:**
```bash
# Make commits that don't affect docs (code comment fix)
git commit -m "fix: typo in code comment"
```

**Test:**
```
Run: /state-docs
```

**Expected:**
- "Analyzed 1 commit. No documentation updates needed."
- No updates proposed
- Metadata updated to latest commit

**Validation:**
- No doc changes
- Metadata reflects latest commit
- Fast execution

---

### Scenario 10: Uncommitted Doc Changes Warning

**Setup:**
```bash
# Edit README.md without committing
echo "\n## WIP Section" >> README.md
```

**Test:**
```
Run: /state-docs
```

**Expected:**
1. Detects README.md has uncommitted changes
2. Warns: "README.md has uncommitted changes. Continue anyway?"
3. User can proceed, commit first, or cancel

**Validation:**
- Warning displayed
- User has clear options
- If proceeding, updates apply via Edit tool

---

### Scenario 11: Missing Doc Creation

**Setup:**
```bash
# Project with API endpoints but no API.md
# Ensure src/ or routes/ has endpoint definitions
```

**Test:**
```
Run: /state-docs
```

**Expected:**
1. Agent detects API endpoints in code
2. No API.md exists
3. Prompts: "Create API.md with detected endpoints?"
4. If approved, generates file with initial content
5. Adds to git staging

**Validation:**
- API.md created with detected endpoints
- File added to git staging area
- Content is reasonable starter documentation

---

### Scenario 12: Post-State-Management Prompt

**Setup:**
```bash
# Make code changes and commit
git commit -m "feat: add new module"
# Ensure docs are behind code
```

**Test:**
```
Run: /state-management
```

**Expected:**
1. project_state.md updates successfully
2. Checks for docs drift
3. Finds commits since last docs sync
4. Prompts: "Would you like to update project documentation?"
5. If approved, launches /state-docs

**Validation:**
- Prompt appears after state update
- Option to decline without issues
- If approved, docs sync workflow starts

---

### Scenario 13: CHANGELOG Exclusion

**Setup:**
```bash
# Ensure repo has CHANGELOG.md in root
touch CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs: add changelog"
```

**Test:**
```
Run: /state-docs
```

**Expected:**
- CHANGELOG.md NOT included in tracked docs
- Not analyzed or updated
- Excluded from processing

**Validation:**
- CHANGELOG.md unchanged
- Not mentioned in doc sync output
- Other docs processed normally

---

### Scenario 14: Multiple Docs in One Run

**Setup:**
```bash
# Changes affect both README.md and docs/architecture.md
# Commit changes to code
```

**Test:**
```
Run: /state-docs
```

**Expected:**
1. Detects 2 affected docs
2. Processes README.md first
3. Shows: "Processing README.md (1 of 2)..."
4. Gets approval, applies updates
5. Then processes docs/architecture.md
6. Shows: "Processing docs/architecture.md (2 of 2)..."

**Validation:**
- One doc at a time
- Progress indicators shown
- Both docs updated appropriately

---

### Doc Sync Testing Checklist

- [ ] First-time sync adds metadata correctly
- [ ] Incremental updates work for dependencies
- [ ] Structural sections auto-update properly
- [ ] Explanatory sections show suggestions only
- [ ] No changes detected works correctly
- [ ] Uncommitted changes warning appears
- [ ] Missing doc creation works
- [ ] Post-state-management prompt appears
- [ ] CHANGELOG.md is excluded
- [ ] Multiple docs processed sequentially
- [ ] Classification logic is conservative
- [ ] Formatting preserved in updates
- [ ] Metadata updates after successful sync
```

### Step 3: Commit testing documentation

```bash
git add docs/TESTING.md
git commit -m "docs: add documentation sync testing scenarios"
```

---

## Task 9: Integration Testing

**Files:**
- Test all components together

### Step 1: Create test project scenario

```bash
# In a separate test directory (not this plugin repo)
# This is manual testing to verify the plugin works
```

Test project should have:
- README.md with Dependencies and Architecture sections
- package.json or requirements.txt
- Some source files
- .claude/project_state.md with metadata

### Step 2: Test /state-docs command

1. Make code changes (add dependency)
2. Commit changes
3. Invoke /state-docs command
4. Verify detection, classification, and updates work

### Step 3: Test post-state-management prompt

1. Make code changes
2. Run /state-management
3. Verify prompt appears asking about docs
4. Test both approval and decline paths

### Step 4: Test edge cases

- Uncommitted doc changes
- No changes scenario
- Missing doc creation
- CHANGELOG exclusion

### Step 5: Document results

Create notes about what works and what needs fixing.

---

## Task 10: Update Migration Guide (if needed)

**Files:**
- Modify: `docs/MIGRATION-v1-to-v2.md` (or create new version guide)

### Step 1: Determine if migration doc needed

Since this is a new feature (not breaking changes), migration may not be needed.

If users upgrading from earlier version:
- No breaking changes
- New optional feature
- Existing workflows unchanged

### Step 2: Add note about new feature to migration guide

If migration guide exists for current version, add brief note:

```markdown
### New in v1.1: Documentation Synchronization

The `/state-docs` command enables synchronization of project documentation with code changes. This is an optional feature that extends the existing state management capabilities.

**What's new:**
- `/state-docs` command for doc sync
- Post-state-management prompt for doc updates
- Metadata tracking for docs sync state

**Action required:** None. This is an additive feature that doesn't affect existing workflows.
```

### Step 3: Commit if modified

```bash
git add docs/MIGRATION-v1-to-v2.md
git commit -m "docs: note documentation sync feature in migration guide"
```

---

## Task 11: Final Review and Polish

### Step 1: Review all created/modified files

```bash
git log --oneline --since="1 day ago"
git diff HEAD~11..HEAD --stat
```

Verify all expected files changed.

### Step 2: Check for consistency

- Command names consistent (state-docs everywhere)
- Skill names match (state-manager:state-docs)
- Metadata field names consistent
- Documentation cross-references accurate

### Step 3: Spell check and grammar

Review markdown files for typos:
- README.md
- commands/state-docs.md
- skills/state-docs/SKILL.md
- docs/TESTING.md

### Step 4: Test markdown rendering

```bash
# Use a markdown viewer to check formatting
# Verify code blocks, lists, headers render correctly
```

### Step 5: Create final commit if needed

If polish changes were made:

```bash
git add -u
git commit -m "polish: fix typos and improve documentation clarity"
```

---

## Task 12: Create Implementation Summary

### Step 1: Write summary document

Create `docs/plans/2026-01-14-doc-sync-implementation-summary.md`:

```markdown
# Documentation Sync Implementation Summary

**Date**: 2026-01-14
**Status**: Complete
**Feature**: Documentation analysis and auto-update

## What Was Implemented

### New Files Created:
1. `commands/state-docs.md` - Command definition for /state-docs
2. `skills/state-docs/SKILL.md` - Skill implementation for doc synchronization

### Modified Files:
1. `agents/analyze-changes.md` - Extended with doc analysis capabilities
2. `skills/state-management/SKILL.md` - Added post-completion prompt
3. `README.md` - Documented documentation sync features
4. `docs/TESTING.md` - Added doc sync test scenarios

### Metadata Schema Extension:
Added to project_state.md metadata:
- `last_docs_sync_commit_sha`
- `last_docs_sync_timestamp`

## Features Delivered

1. **Smart Doc Detection**: Auto-identifies trackable docs with exclusion patterns
2. **Hybrid Update Strategy**: Auto-update structural, suggest explanatory
3. **Section Classification**: AI-driven conservative classification
4. **On-Demand Workflow**: `/state-docs` command for manual sync
5. **Post-Completion Prompt**: Optional doc sync after state update
6. **Missing Doc Detection**: Suggests creating missing documentation
7. **Uncommitted Changes Warning**: Prevents conflicts
8. **One-Doc-at-a-Time**: Focused review workflow
9. **Centralized Metadata**: Tracks docs sync state in project_state.md

## Testing

Comprehensive test scenarios documented in `docs/TESTING.md`:
- First-time sync
- Incremental updates
- Mixed structural/explanatory
- No changes needed
- Uncommitted changes warning
- Missing doc creation
- Post-state-management prompt
- CHANGELOG exclusion
- Multiple docs processing

## Architecture

Leverages existing infrastructure:
- Reuses analyze-changes agent (extended capabilities)
- Same metadata format as state management
- Follows plugin's markdown-based convention
- Uses Haiku 4.5 for token efficiency

## Next Steps

1. Manual testing in real projects
2. Gather user feedback on classification accuracy
3. Consider future enhancements (protected sections, dry-run mode)

## Commit History

```
git log --oneline --grep="state-docs\|doc sync\|documentation"
```

View all commits related to this feature.
```

### Step 2: Commit summary

```bash
git add docs/plans/2026-01-14-doc-sync-implementation-summary.md
git commit -m "docs: add implementation summary for documentation sync feature"
```

---

## Completion Criteria

- [ ] `/state-docs` command defined and documented
- [ ] `state-docs` skill created with complete workflow
- [ ] `analyze-changes` agent extended with doc analysis
- [ ] `state-management` skill has post-completion prompt
- [ ] README documents new features
- [ ] TESTING.md has comprehensive test scenarios
- [ ] All files committed with clear commit messages
- [ ] Metadata schema extended and documented
- [ ] Integration between components verified
- [ ] Implementation summary created

## Notes

- This is a markdown-based plugin, so no code compilation/testing
- Manual testing required in real project environment
- Classification accuracy will improve with user feedback
- Conservative classification bias prevents unwanted overwrites
