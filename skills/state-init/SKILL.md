---
name: state-init
description: Initialize a new project_state.md file for a project. Creates standard sections based on project type and configures .claude.md integration.
version: 2.0.0
---

# State Initialization Skill

## Purpose

Create a new `project_state.md` file by analyzing the current codebase and setting up automatic context loading for Claude.

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

### 3. Analyze Project Structure

Discover what kind of project this is:

**Check for language/framework indicators:**

Use Glob tool to find:
- `package.json` → Node.js/JavaScript project
- `requirements.txt` or `pyproject.toml` → Python project
- `go.mod` → Go project
- `Cargo.toml` → Rust project
- `pom.xml` or `build.gradle` → Java project
- `Gemfile` → Ruby project

**Check project type:**
- API/web app: Look for routes/, api/, server.ts, app.py
- CLI tool: Look for cli/, cmd/, bin/
- Library: Look for lib/, src/ without server files

**Get recent history:**

```bash
git log --oneline -20
```

This gives context on what the project does.

**Read dependency files** using Read tool:
- package.json → extract dependencies
- requirements.txt → extract Python packages
- go.mod → extract Go modules
- etc.

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

Use Write tool to create `.claude/project_state.md` with:

```markdown
# Project State

> Last updated: <current-date> | Commit: <short-sha>

## System Architecture

[Generated content]

## [Section 2]

[Generated content]

## [Section 3]

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

Get current commit SHA:
```bash
git rev-parse HEAD
```

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

### 7. Configure .claude.md Integration

Check if `.claude.md` exists in project root:

```bash
test -f .claude.md && echo "exists" || echo "missing"
```

**If exists:**

Read the file using Read tool.

Check if it already mentions `project_state.md`:

```bash
grep -q "project_state.md" .claude.md && echo "found" || echo "missing"
```

- If **found**: Don't modify (already configured)
- If **missing**: Append the integration section

**If doesn't exist:**

Create `.claude.md` with the integration section.

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

Also configured .claude.md to automatically load state context on every session.

The state-management skill will keep this file updated as you make changes!"

## Edge Cases

### Git Repository Not Initialized

If `git rev-parse HEAD` fails:

"This doesn't appear to be a git repository. I can create the state file, but won't be able to track commit history. Initialize git first with `git init` for full functionality."

Offer to continue anyway with placeholder SHA.

### Empty Repository (No Commits)

If no commits exist yet:

Use "0000000000000000000000000000000000000000" as placeholder SHA.

Tell user: "No commits yet. Make your first commit and the state file will start tracking properly."

### No Dependencies Found

If no package.json, requirements.txt, etc. found:

Create Dependencies section with: "None detected - add dependencies here as needed"

### Very Large Projects

If codebase has 1000+ files:

Tell user: "This is a large codebase. Initial state file will be high-level. You can refine sections manually after initialization."

Focus on major directories only.

---

**Tools to use**: Bash (git, file checks), Glob (discover files), Read (dependency files), Write (create files), Edit (update .claude.md)
