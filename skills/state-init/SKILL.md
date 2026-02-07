---
name: state-init
description: Initialize a new project_state.md file for a project. Creates standard sections based on project type and configures CLAUDE.md integration.
version: 2.0.0
---

# State Initialization Skill

## Purpose

Create a new `project_state.md` file by analyzing the current codebase and setting up automatic context loading for Claude.

**Works with or without git**: This skill automatically detects whether git is available. When git is present, it uses commit-based tracking. When git is unavailable, it falls back to filesystem snapshot tracking to detect changes between sessions.

**Token Efficiency**: This skill uses haiku 4.5 agents for analysis tasks to minimize token usage.

## When This Skill Activates

- User explicitly asks to initialize state management
- state-management skill suggests it when no state file exists

## How It Works

### 1. Check for Existing State

```bash
test -f .claude/project_state.md && echo "exists" || echo "missing"
```

- If **exists**: Warn user: "A project_state.md already exists. Do you want to reinitialize it? This will replace the current file."
  - If no: Exit gracefully
  - If yes: Continue (this is destructive)
- If **missing**: Continue

### 2. Ensure .claude Directory Exists

```bash
mkdir -p .claude
```

### 2.5. Detect Environment

```bash
git rev-parse --git-dir 2>/dev/null && echo "git-available" || echo "no-git"
```

Store this result for use in later steps.

**Note**: This detection determines whether to use git-based or snapshot-based tracking.

### 3. Analyze Project Structure

**Use the analyze-project agent for efficient analysis:**

Launch the custom analyze-project agent (uses Haiku 4.5 for token efficiency):

```
Use Task tool with:
- subagent_type: "state-manager:analyze-project"
- description: "Analyze project structure"
- prompt: "Analyze this project to determine its language, framework, project type, directory structure, dependencies, and purpose."
```

The analyze-project agent will provide a comprehensive analysis including:
- Language & framework detection
- Project type classification (API/CLI/Library/Plugin)
- Directory structure mapping
- Key dependencies list
- Project purpose from commit history or file structure analysis
- Recommended state file sections

**Note**: The analyze-project agent handles missing git gracefully. If git is unavailable, it will infer project purpose from file structure, directory organization, and dependency patterns instead of commit history.

### 4. Propose Section Structure

Based on project type, suggest sections:

**For Web APIs/Apps:**
```markdown
## System Architecture
## API Endpoints
## Active Modules
## Dependencies
## Tech Debt
## Infrastructure
```

**For CLI Tools:**
```markdown
## System Architecture
## Commands
## Active Modules
## Dependencies
## Tech Debt
## Build & Release
```

**For Libraries:**
```markdown
## System Architecture
## Public API
## Internal Modules
## Dependencies
## Tech Debt
## Build & Publishing
```

**For Generic/Unknown:**
```markdown
## System Architecture
## Active Modules
## Dependencies
## Tech Debt
## Infrastructure
```

Show the user: "I'll create a project_state.md with these sections based on your [project-type] project: [list sections]"

Ask: "Would you like to customize the sections?"

If user wants custom sections, ask what they'd like.

### 5. Generate Initial Content

For each section, write initial content based on analysis:

**System Architecture:**
- Identify framework (Express, FastAPI, Gin, etc.)
- Note patterns seen in code structure
- Example: "REST API built with Express.js and TypeScript"

**API Endpoints / Commands:**
- Scan for route definitions or CLI command files
- List discovered endpoints/commands
- Example: "- GET /api/users - List users"

**Active Modules:**
- List major directories in src/
- Describe their responsibility based on file names
- Example: "- auth/: Authentication and authorization middleware"

**Dependencies:**
- Extract from package.json, requirements.txt, etc.
- List key dependencies with brief purpose
- Example: "- express@4.18.0: Web server framework"

**Tech Debt:**
- Start with "None identified yet" or "Track issues here"

**Infrastructure:**
- Look for Docker, config files, env vars
- Example: "- Runtime: Node.js 18+"

### 6. Create State File

Use Write tool to create `.claude/project_state.md`.

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

**If git is available** (from Step 2.5):

Get current commit SHA:
```bash
git rev-parse HEAD
```

Write the state file with git-based metadata:

```markdown
# Project State

> Last updated: <current-date> | Commit: <short-sha>

## System Architecture

[Generated content]

## [Section 2]

[Generated content]

... (all proposed sections)

<!-- STATE_METADATA
{
  "last_sync_commit_sha": "<current-full-sha>",
  "last_sync_timestamp": "<current-timestamp-iso8601>",
  "schema_version": "1.0"
}
-->
```

**If git is NOT available** (from Step 2.5):

First, generate a filesystem snapshot manifest. Scan the project for all trackable files, excluding ignored patterns.

Default ignore patterns (used when no `.gitignore` exists):
```
node_modules/**, dist/**, build/**, .cache/**, vendor/**,
__pycache__/**, *.pyc, *.pyo, *.log, *.lock, .DS_Store,
*.swp, *.swo, .env, .env.*, *.sqlite, *.db, .claude/**
```

If `.gitignore` exists, parse and merge its patterns with the defaults above.

For each trackable file, compute its hash:
```bash
shasum -a 256 <file>
```

Write the manifest to `.claude/state_snapshot.json`:
```json
{
  "schema_version": "1.0",
  "created_at": "<timestamp>",
  "last_sync_at": "<timestamp>",
  "files": {
    "src/index.ts": {
      "hash": "sha256:<hash>",
      "size": 1234,
      "mtime": "<iso-timestamp>"
    }
  },
  "ignore_patterns": ["node_modules/**", "dist/**", "..."]
}
```

Cap at ~10,000 files. If exceeded, warn user: "Project has over 10,000 trackable files. Consider adding ignore patterns to reduce scope."

Write the state file with snapshot-based metadata:

```markdown
# Project State

> Last updated: <current-date> | Tracking: filesystem snapshots

## System Architecture

[Generated content]

## [Section 2]

[Generated content]

... (all proposed sections)

<!-- STATE_METADATA
{
  "last_sync_method": "snapshot",
  "last_sync_timestamp": "<current-timestamp-iso8601>",
  "last_sync_snapshot": ".claude/state_snapshot.json",
  "schema_version": "1.0"
}
-->
```

### 7. Configure CLAUDE.md Integration

Check if `CLAUDE.md` exists in project root:

```bash
test -f CLAUDE.md && echo "exists" || echo "missing"
```

**If exists:**

Read the file using Read tool.

Check if it already mentions `project_state.md`:

```bash
grep -q "project_state.md" CLAUDE.md && echo "found" || echo "missing"
```

- If **found**: Don't modify (already configured)
- If **missing**: Append the integration section

**If doesn't exist:**

Create `CLAUDE.md` with the integration section.

**Integration section to append/create:**

```markdown

## Project State

For current architecture and context, reference `.claude/project_state.md`. This file tracks:
- System architecture and design patterns
- Active modules and their responsibilities
- Current dependencies and their usage
- Known tech debt and planned improvements
- Infrastructure and deployment details

Always read this file at session start to understand the current project state.
```

Use Edit tool (if appending) or Write tool (if creating).

### 8. Confirm Completion

Tell the user:

"Created .claude/project_state.md with N sections:
- [List section names]

Also configured CLAUDE.md to automatically load state context on every session.

The state-management skill will keep this file updated as you make changes!"

## Edge Cases

### Git Repository Not Initialized

If git is not available (detected in Step 2.5):

"This doesn't appear to be a git repository. I'll use filesystem snapshot tracking instead. This tracks file changes between sessions but without commit message context. You can switch to git-based tracking later by initializing git."

Continue with snapshot-based initialization — generate the manifest and use snapshot metadata. Do not use a placeholder SHA.

### Empty Repository (No Commits)

**Git available but no commits:**

Use "0000000000000000000000000000000000000000" as placeholder SHA.

Tell user: "No commits yet. Make your first commit and the state file will start tracking properly."

**No git available:**

Use snapshot mode as described in Step 6. No placeholder SHA needed.

### No Dependencies Found

If no package.json, requirements.txt, etc. found:

Create Dependencies section with: "None detected - add dependencies here as needed"

### Very Large Projects

If codebase has 1000+ files:

Tell user: "This is a large codebase. Initial state file will be high-level. You can refine sections manually after initialization."

Focus on major directories only.

---

**Tools to use**: Bash (git, file checks, shasum), Glob (discover files), Read (dependency files), Write (create files, snapshot manifest), Edit (update .claude.md)
