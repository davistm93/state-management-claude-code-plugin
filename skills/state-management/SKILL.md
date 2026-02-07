---
name: state-management
description: Automatically maintain project_state.md by detecting code changes and updating architectural documentation. Triggers at session start and after task completion.
version: 2.0.0
---

# State Management Skill

## Purpose

Maintain a living `project_state.md` file that tracks your project's architectural evolution. This skill automatically detects when code changes and keeps the state file synchronized.

**Works with or without git**: When git is available, uses commit-based tracking for rich change context. When git is unavailable, falls back to filesystem snapshot tracking.

**Token Efficiency**: This skill uses haiku 4.5 agents for analysis tasks to minimize token usage.

## When This Skill Activates

1. **Session start**: Check for drift between code and documented state
2. **After task completion**: When user says they're done with a feature/fix

## How It Works

### 1. Activation Check

First, check if the project has a state file:

```bash
test -f .claude/project_state.md && echo "exists" || echo "missing"
```

- If **missing**: Suggest to user: "I notice you don't have a project_state.md file. Would you like me to create one? This helps me understand your project better."
- If **exists**: Proceed to drift detection

### 1.5. Detect Environment

```bash
git rev-parse --git-dir 2>/dev/null && echo "git-available" || echo "no-git"
```

Store this result for use in later steps. This determines whether to use git-based or snapshot-based tracking.

### 2. Drift Detection

Extract the last sync point from the state file metadata:

```bash
# Read the metadata comment at the end of .claude/project_state.md
tail -10 .claude/project_state.md
```

Look for the JSON in the HTML comment. Check `last_sync_method` and `last_sync_commit_sha`.

**If git is available and metadata has `last_sync_commit_sha` (git mode):**

Check for new commits since that SHA:

```bash
git log --oneline <last_sync_sha>..HEAD --no-merges
```

- If **no commits**: State is current. Silently continue - don't interrupt the user.
- If **commits found**: Proceed to analysis

**If git is NOT available or metadata has `last_sync_method: "snapshot"` (snapshot mode):**

Read the stored snapshot manifest:
```bash
# Check if snapshot exists
test -f .claude/state_snapshot.json && echo "exists" || echo "missing"
```

If snapshot exists, scan the current filesystem and compare against the stored manifest:
1. Find all trackable files (respecting `.gitignore` patterns if present, plus default ignore patterns)
2. Hash each file: `shasum -a 256 <file>`
3. Compare against stored manifest:
   - Files in current scan but not in manifest → **added**
   - Files in manifest but not in current scan → **deleted**
   - Files with different hashes → **modified**

- If **no changes detected**: State is current. Silently continue.
- If **changes detected**: Build a change summary and proceed to analysis

### 3. Change Analysis

**Use the analyze-changes agent for efficient analysis:**

Launch the custom analyze-changes agent (uses Haiku 4.5 for token efficiency):

**Git mode:**
```
Use Task tool with:
- subagent_type: "state-manager:analyze-changes"
- description: "Analyze code changes"
- prompt: "Analyze changes between commit <last_sync_sha> and HEAD. Read the current state file at .claude/project_state.md and recommend specific updates based on the git diff and commits."
```

**Snapshot mode:**

Pre-compute the change summary from the manifest comparison in Step 2, then pass it to the agent:

```
Use Task tool with:
- subagent_type: "state-manager:analyze-changes"
- description: "Analyze code changes"
- prompt: "Analyze the following code changes detected via filesystem snapshot comparison. Read the current state file at .claude/project_state.md and recommend specific updates.

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

[For each modified dependency file (package.json, requirements.txt, etc.), include its current content below:]

Contents of <dep-file>:
<file-contents>
"
```

The analyze-changes agent will provide:
- Summary of changes since last sync
- Categorized changes (dependencies, files, modules, infrastructure)
- Specific recommendations for which state file sections need updates
- Exact content to add/update/remove for each section
- Reasoning for each recommended change

### 4. Present Findings

Tell the user what you found:

"I found N changes since last sync. Here's what changed:

- [Summary of key changes from commits]

This affects these sections in your state file:
- **Section Name**: [what needs to change]
- **Section Name**: [what needs to change]

Would you like me to update the state file?"

### 5. Update Application

On user approval:

1. **Update each affected section** using the Edit tool:
   - Preserve existing formatting style (bullets vs prose)
   - Match the detail level of existing content
   - Use same conventions (bold, code blocks, etc.)

2. **Update metadata** at the bottom of file:

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

**Git mode:**

Get current commit SHA:
```bash
git rev-parse HEAD
```

Replace the metadata comment with updated values:

```markdown
<!-- STATE_METADATA
{
  "last_sync_commit_sha": "<new-sha>",
  "last_sync_timestamp": "<new-timestamp>",
  "schema_version": "1.0"
}
-->
```

**Snapshot mode:**

Generate a new snapshot manifest by scanning the filesystem and hashing all trackable files. Write the updated manifest to `.claude/state_snapshot.json`.

Replace the metadata comment with updated values:

```markdown
<!-- STATE_METADATA
{
  "last_sync_method": "snapshot",
  "last_sync_timestamp": "<new-timestamp>",
  "last_sync_snapshot": ".claude/state_snapshot.json",
  "schema_version": "1.0"
}
-->
```

3. **Confirm completion**:
   - Git mode: "Updated project_state.md. Now tracking through commit <short-sha>."
   - Snapshot mode: "Updated project_state.md. Filesystem snapshot updated."

## Edge Cases

### Manual State Edits Detected

**Git mode only:**

If the state file was modified but the metadata hasn't been updated:

```bash
git log -1 --format="%H" .claude/project_state.md
```

Compare this to `last_sync_commit_sha`. If they differ:

"I notice project_state.md was manually edited. Would you like me to:
1. Keep your edits and update metadata to current commit
2. Review and validate your edits against the codebase
3. Skip for now"

### Environment Transitions

**Git disappears (was git mode, now git is unavailable):**
- Metadata has `last_sync_commit_sha` but `git rev-parse --git-dir` fails
- Warn user: "Git is no longer available. Switching to snapshot-based tracking."
- Generate initial snapshot manifest from current filesystem state
- Update metadata to snapshot mode
- Next sync will use snapshot comparison

**Git appears (was snapshot mode, now git is available):**
- Metadata has `last_sync_method: "snapshot"` but git is now detected
- Inform user: "Git is now available. Switching to git-based tracking for richer change data."
- Get current commit SHA, update metadata to git mode
- Remove `.claude/state_snapshot.json` (no longer needed)

### Git Errors

If any git command fails in git mode:
- Check if git is still available (`git rev-parse --git-dir`)
- If git is gone: switch to snapshot mode (see Environment Transitions above)
- If git is available but command failed: report the error and gracefully skip for this session

### No H2 Sections Found

If the state file has no H2 headers:
- Warn user: "Your project_state.md doesn't have standard sections (## Headers). I can still update it, but structure might be inconsistent."
- Ask: "Would you like me to restructure it with standard sections?"

## Style Preservation Rules

When updating sections:

1. **Bullet points**: If section uses `- item` format, add new items as bullets
2. **Prose**: If section uses paragraphs, add new content as prose
3. **Code blocks**: If section shows code examples, include code blocks for relevant changes
4. **Links**: If section includes file:line references, use same format
5. **Bold/emphasis**: Match existing emphasis patterns for module names, etc.

## Silent Mode

When there's no drift (no commits since last sync, or no file changes in snapshot mode):
- Don't announce anything
- Don't interrupt the user
- Just continue silently

This keeps the skill invisible when there's nothing to do.

## Post-Completion Prompt

After successfully updating project_state.md, check if documentation might also need updating.

### Check for Docs Drift

After updating state file metadata, check if docs are also out of sync:

```bash
# Extract docs sync info from metadata
tail -10 .claude/project_state.md
```

**Git mode:**

If `last_docs_sync_commit_sha` is found:
```bash
# Check if there are commits since last docs sync
git log --oneline <last_docs_sync_sha>..HEAD --no-merges | wc -l
```

- If **no commits since docs sync**: Don't prompt, docs are current
- If **commits found**: Prompt user about doc updates

**Snapshot mode:**

If `last_docs_sync_timestamp` is found, compare against `last_sync_timestamp`. If the state file was just updated (timestamps differ), there may be doc-relevant changes too. Prompt user about doc updates.

**Either mode — if no docs sync metadata found:**
- This means docs have never been synced
- Prompt user about doc updates

### The Prompt

If docs might be out of sync, present this option to the user:

"✓ project_state.md updated successfully.

I notice there are changes since your documentation was last synced. Would you like to update project documentation (README, docs/, etc.) to reflect these changes?

I can run `/state-docs` to analyze and update your docs now, or you can run it manually later."

**On user approval:**
- Invoke the state-docs skill: Use Skill tool with skill="state-manager:state-docs"

**On user decline:**
- Continue normally

### Don't Over-Prompt

- Only prompt if there's actual drift (commits since last docs sync, or timestamp mismatch in snapshot mode)
- Keep it brief and actionable
- Make it easy to decline
- Don't prompt every time - only when state file was updated

---

**Tools to use**: Bash (git commands, shasum, file scanning), Read (load state file, snapshot manifest), Edit (update sections), Write (snapshot manifest)
