---
name: state-management
description: Automatically maintain project_state.md by detecting code changes and updating architectural documentation. Triggers at session start and after task completion.
version: 2.0.0
---

# State Management Skill

## Purpose

Maintain a living `project_state.md` file that tracks your project's architectural evolution. This skill automatically detects when code changes and keeps the state file synchronized.

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

Understand what changed:

```bash
# Get the diff since last sync
git diff <last_sync_sha>..HEAD

# Get commit messages for context
git log <last_sync_sha>..HEAD --oneline --no-merges
```

Read the current state file to understand existing documentation:

Use the Read tool on `.claude/project_state.md`

Analyze the changes and categorize by impact:

- **New files/modules** → Update architectural or module sections
- **Dependency changes** (package.json, requirements.txt, go.mod, etc.) → Update dependencies section
- **Config changes** (.env, config files, docker) → Update infrastructure section
- **TODOs/FIXMEs added** → Update tech debt section
- **Removed files** → Remove from relevant sections

Identify which H2 sections in the state file need updates. Match semantically:
- "Dependencies", "Dependency Map", "External Libraries" all mean dependencies
- "Modules", "Components", "Active Modules" all mean modules
- "Infrastructure", "Deployment", "Configuration" all mean infra

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

---

**Tools to use**: Bash (git commands), Read (load state file), Edit (update sections)
