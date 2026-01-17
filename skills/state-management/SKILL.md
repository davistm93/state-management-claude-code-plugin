---
name: state-management
description: Automatically maintain project_state.md by detecting code changes and updating architectural documentation. Triggers at session start and after task completion.
version: 2.0.0
---

# State Management Skill

## Purpose

Maintain a living `project_state.md` file that tracks your project's architectural evolution. This skill automatically detects when code changes and keeps the state file synchronized.

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

### 2. Drift Detection

Extract the last sync point from the state file metadata:

```bash
# Read the metadata comment at the end of .claude/project_state.md
tail -5 .claude/project_state.md
```

Look for the JSON in the HTML comment. Extract `last_sync_commit_sha`.

Check for new commits since that SHA:

```bash
git log --oneline <last_sync_sha>..HEAD --no-merges
```

- If **no commits**: State is current. Silently continue - don't interrupt the user.
- If **commits found**: Proceed to analysis

### 3. Change Analysis

**Use the analyze-changes agent for efficient analysis:**

Launch the custom analyze-changes agent (uses Haiku 4.5 for token efficiency):

```
Use Task tool with:
- subagent_type: "state-manager:analyze-changes"
- description: "Analyze code changes"
- prompt: "Analyze changes between commit <last_sync_sha> and HEAD. Read the current state file at .claude/project_state.md and recommend specific updates based on the git diff and commits."
```

The analyze-changes agent will provide:
- Summary of commits since last sync
- Categorized changes (dependencies, files, modules, infrastructure)
- Specific recommendations for which state file sections need updates
- Exact content to add/update/remove for each section
- Reasoning for each recommended change

### 4. Present Findings

Tell the user what you found:

"I found N commits since last sync (at <short-sha>). Here's what changed:

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

Get current commit SHA:
```bash
git rev-parse HEAD
```

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
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

3. **Confirm completion**: "Updated project_state.md. Now tracking through commit <short-sha>."

## Edge Cases

### Manual State Edits Detected

If the state file was modified but the metadata hasn't been updated:

```bash
git log -1 --format="%H" .claude/project_state.md
```

Compare this to `last_sync_commit_sha`. If they differ:

"I notice project_state.md was manually edited. Would you like me to:
1. Keep your edits and update metadata to current commit
2. Review and validate your edits against the codebase
3. Skip for now"

### Git Errors

If any git command fails:
- Report the error to the user
- Ask if this is a git repository
- Gracefully skip state management for this session

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

When there's no drift (no commits since last sync):
- Don't announce anything
- Don't interrupt the user
- Just continue silently

This keeps the skill invisible when there's nothing to do.

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

---

**Tools to use**: Bash (git commands), Read (load state file), Edit (update sections)
