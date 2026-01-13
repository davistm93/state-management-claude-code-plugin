# Skill-Based Plugin Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform state-manager from TypeScript command-based plugin to pure skill-based plugin with zero code dependencies.

**Architecture:** Replace TypeScript commands with markdown skill definitions that instruct Claude to use built-in tools (Bash, Read, Edit, Write) for git operations and file management. Skills trigger automatically on session start and task completion.

**Tech Stack:** Markdown (skill definitions), Git (version control), JSON (plugin manifest)

---

## Phase 1: Create Skill-Based Structure

### Task 1: Update Plugin Manifest

**Files:**
- Modify: `.claude-plugin/plugin.json`

**Step 1: Read current manifest**

Run: `cat .claude-plugin/plugin.json`
Expected: See v1.0 manifest with commands

**Step 2: Replace with v2.0 skill-based manifest**

Create this content:

```json
{
  "name": "state-manager",
  "version": "2.0.0",
  "description": "Automatically maintains project_state.md to track architectural evolution and provide context to Claude",
  "author": "tdavis",

  "skills": [
    {
      "path": "skills/state-management"
    },
    {
      "path": "skills/state-init"
    }
  ],

  "metadata": {
    "license": "MIT",
    "repository": "https://github.com/yourusername/state-manager",
    "keywords": ["state", "documentation", "architecture", "context", "project-tracking"]
  }
}
```

**Step 3: Verify JSON is valid**

Run: `cat .claude-plugin/plugin.json | python3 -m json.tool`
Expected: Formatted JSON output without errors

**Step 4: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "refactor: update manifest for skill-based architecture (v2.0)"
```

---

### Task 2: Create State Management Skill Directory

**Files:**
- Create: `skills/state-management/`
- Create: `skills/state-management/SKILL.md`

**Step 1: Create directory structure**

Run: `mkdir -p skills/state-management`
Expected: Directory created

**Step 2: Verify directory exists**

Run: `ls -la skills/`
Expected: See state-management/ directory

**Step 3: Commit directory structure**

```bash
git add skills/
git commit -m "feat: create skills directory structure"
```

---

### Task 3: Write State Management Skill

**Files:**
- Create: `skills/state-management/SKILL.md`

**Step 1: Create the skill file**

Create file with this complete content:

```markdown
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
```

**Step 2: Verify file was created**

Run: `ls -la skills/state-management/`
Expected: See SKILL.md file

**Step 3: Validate frontmatter**

Run: `head -5 skills/state-management/SKILL.md`
Expected: See YAML frontmatter with name, description, version

**Step 4: Commit**

```bash
git add skills/state-management/SKILL.md
git commit -m "feat: add state-management skill with auto-drift detection"
```

---

### Task 4: Create State Init Skill Directory

**Files:**
- Create: `skills/state-init/`

**Step 1: Create directory**

Run: `mkdir -p skills/state-init`
Expected: Directory created

**Step 2: Verify**

Run: `ls -la skills/`
Expected: See both state-management/ and state-init/

**Step 3: Commit**

```bash
git add skills/state-init/
git commit -m "feat: create state-init skill directory"
```

---

### Task 5: Write State Init Skill

**Files:**
- Create: `skills/state-init/SKILL.md`

**Step 1: Create the skill file**

Create file with this complete content:

```markdown
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
```

**Step 2: Verify file created**

Run: `cat skills/state-init/SKILL.md | head -10`
Expected: See frontmatter and beginning of content

**Step 3: Commit**

```bash
git add skills/state-init/SKILL.md
git commit -m "feat: add state-init skill for project setup"
```

---

## Phase 2: Clean Up Old Code-Based Structure

### Task 6: Remove TypeScript Source Directories

**Files:**
- Delete: `commands/`
- Delete: `lib/`
- Delete: `lib-helpers/`
- Delete: `agents/`
- Delete: `hooks/`
- Delete: `tests/`

**Step 1: Remove directories**

Run: `rm -rf commands lib lib-helpers agents hooks tests`
Expected: Directories removed

**Step 2: Verify deletion**

Run: `ls -la | grep -E "(commands|lib|agents|hooks|tests)"`
Expected: No output (directories gone)

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove TypeScript source code (now skill-based)"
```

---

### Task 7: Remove Build Artifacts and Config

**Files:**
- Delete: `dist/`
- Delete: `node_modules/`
- Delete: `package.json`
- Delete: `package-lock.json`
- Delete: `tsconfig.json`
- Delete: `jest.config.js`
- Delete: `test-plugin.sh`

**Step 1: Remove files and directories**

Run: `rm -rf dist node_modules package.json package-lock.json tsconfig.json jest.config.js test-plugin.sh`
Expected: Files removed

**Step 2: Verify deletion**

Run: `ls -la | grep -E "(dist|node_modules|package|tsconfig|jest|test-plugin)"`
Expected: No output

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove build config and dependencies"
```

---

### Task 8: Update .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Read current .gitignore**

Run: `cat .gitignore`
Expected: See node_modules, dist, etc.

**Step 2: Replace with minimal version**

Since we have no build artifacts now:

```
# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Local testing
.test-*
```

**Step 3: Verify**

Run: `cat .gitignore`
Expected: See new minimal content

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "refactor: simplify .gitignore for skill-based plugin"
```

---

### Task 9: Remove/Archive Old Documentation

**Files:**
- Delete: `CONTRIBUTING.md` (was for TypeScript development)

**Step 1: Remove file**

Run: `rm CONTRIBUTING.md`
Expected: File removed

**Step 2: Verify**

Run: `ls -la | grep CONTRIBUTING`
Expected: No output

**Step 3: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: remove TypeScript development guide"
```

---

## Phase 3: Update Documentation

### Task 10: Rewrite README for Skill-Based Plugin

**Files:**
- Modify: `README.md`

**Step 1: Read current README**

Run: `cat README.md | head -30`
Expected: See v1.0 command-based docs

**Step 2: Replace with v2.0 skill-based content**

```markdown
# State Manager Plugin for Claude Code

Automatically maintains a living `project_state.md` file that tracks your project's architectural evolution and provides rich context to Claude.

## What It Does

The State Manager plugin keeps a synchronized documentation file (`.claude/project_state.md`) that captures:
- System architecture and design patterns
- Active modules and their responsibilities
- Current dependencies and their usage
- Known tech debt and planned improvements
- Infrastructure and deployment details

Instead of manual documentation that goes stale, this plugin **automatically detects code changes** and updates the state file, giving Claude better context for suggestions and understanding your project.

## How It Works

The plugin uses two skills that work behind the scenes:

### 1. Automatic State Sync (state-management skill)

**Triggers when:**
- You start a Claude Code session
- You finish implementing a feature

**What it does:**
1. Checks if your code has changed since last state sync
2. If changes found, analyzes git diff and commits
3. Proposes updates to affected sections
4. On your approval, updates the state file
5. If no changes, continues silently (no interruption)

### 2. Project Setup (state-init skill)

**Triggers when:**
- You don't have a state file yet
- You explicitly ask to initialize state management

**What it does:**
1. Analyzes your codebase (languages, frameworks, structure)
2. Proposes section structure based on project type
3. Generates initial content for each section
4. Configures `.claude.md` to automatically load state context
5. Creates `.claude/project_state.md`

## Installation

### For Personal Use (Local Development)

```bash
# Clone to your Claude plugins directory
cd ~/.claude/plugins
git clone <this-repo> state-manager

# That's it! No build step required.
```

### From Marketplace (Future)

Once published:
1. Open Claude Code
2. Go to Plugin Marketplace
3. Search for "State Manager"
4. Click Install

## Quick Start

### First Time Setup

```bash
# Open Claude Code in your project
# Claude will notice you don't have a state file

Claude: "I notice you don't have a project_state.md file.
        Would you like me to create one?"

You: "yes"

Claude: [Analyzes project]
        "I can see this is a Node.js/Express API project.
        I'll create a state file with these sections:
        - System Architecture
        - API Endpoints
        - Active Modules
        - Dependencies
        - Tech Debt
        - Infrastructure

        [Creates files]

        Created project_state.md and configured .claude.md!"
```

### Daily Usage

```bash
# You work on features normally
git add .
git commit -m "feat: add user authentication"

# Next time you open Claude Code

Claude: "I found 3 commits since last sync. Changes affect:
        - Active Modules: Added auth middleware
        - Dependencies: Added jsonwebtoken
        - System Architecture: Role-based access control

        Update state file?"

You: "yes"

Claude: "Updated! Now tracking through commit a4f8c2b"
```

## State File Structure

`.claude/project_state.md` contains flexible sections. Common patterns:

```markdown
## System Architecture
High-level patterns, frameworks, architectural decisions

## Active Modules
Major modules/packages and their responsibilities

## Dependencies
External dependencies with usage context

## Tech Debt
Known issues, TODOs, planned improvements

## Infrastructure
Deployment, runtime requirements, configuration
```

**Your project can use any sections that make sense!** The skill adapts to your structure.

## Metadata Tracking

At the bottom of every state file:

```markdown
<!-- STATE_METADATA
{
  "last_sync_commit_sha": "abc123...",
  "last_sync_timestamp": "2026-01-13T10:30:00Z",
  "schema_version": "1.0"
}
-->
```

This tracks when state was last synced and which commit it reflects.

## Claude.md Integration

During initialization, the plugin adds this to your `.claude.md`:

```markdown
## Project State

For current architecture and context, reference `.claude/project_state.md`.
Always read this file at session start to understand the current project state.
```

This ensures Claude automatically loads your project context every session.

## Workflow Examples

### Example: After Feature Development

```
[You implement authentication]
git commit -m "feat: add JWT auth"

[Open Claude Code]

Claude: "I found 1 commit since last sync. Added JWT authentication.

        This affects:
        - Active Modules: auth-service with JWT middleware
        - Dependencies: jsonwebtoken@9.0.0

        Update state?"

You: yes

Claude: "Updated! State now reflects JWT authentication."
```

### Example: Manual State Edit

```
[You manually edit project_state.md to add a note]

[Open Claude Code]

Claude: "I notice project_state.md was manually edited.

        Options:
        1. Keep your edits and update metadata
        2. Review edits against codebase
        3. Skip for now"

You: 1

Claude: "Metadata updated. Your edits are now source of truth."
```

### Example: No Changes (Silent)

```
[You open Claude Code, no commits since last sync]

[Nothing happens - skill is silent]

You: "how do I add validation to the login endpoint?"

Claude: [Proceeds normally with your question]
```

## Benefits

1. **Always Current**: Documentation stays synchronized with code
2. **Better Context**: Claude understands your project architecture
3. **Zero Friction**: Works automatically, no manual commands
4. **Flexible**: Adapts to any project structure
5. **Convention Over Config**: No configuration files needed
6. **Simple**: Pure markdown skills, no build steps

## Migration from v1.0

If you used the old command-based version:

```bash
# Your existing .claude/project_state.md works as-is!
# Just update the plugin:

cd ~/.claude/plugins/state-manager
git pull origin main

# Restart Claude Code - skills activate automatically
```

Your state file format is compatible. No data migration needed.

## Development

### Plugin Structure

```
state-manager/
├── .claude-plugin/
│   └── plugin.json       # Plugin manifest
├── skills/
│   ├── state-management/
│   │   └── SKILL.md     # Auto-sync skill
│   └── state-init/
│       └── SKILL.md     # Setup skill
└── README.md
```

### Contributing

This is a pure skill-based plugin. To contribute:

1. Fork the repo
2. Edit skill markdown files in `skills/*/SKILL.md`
3. Test by installing locally in `~/.claude/plugins/`
4. Submit PR with description of changes

No build step, no tests - just markdown!

### Skill Editing Tips

Skills are instructions for Claude. When editing:
- Be explicit about commands to run
- Show expected outputs
- Include error handling steps
- Use code blocks for examples
- Test by triggering the skill in a real project

## License

MIT

## Questions?

Open an issue or discussion on GitHub!
```

**Step 3: Verify README**

Run: `cat README.md | head -20`
Expected: See new v2.0 content

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for skill-based v2.0"
```

---

### Task 11: Update Project State File

**Files:**
- Modify: `.claude/project_state.md`

**Step 1: Read current project state**

Run: `cat .claude/project_state.md | head -40`
Expected: See v1.0 state with TypeScript implementation

**Step 2: Update to reflect v2.0 architecture**

Replace **System Architecture** section:

```markdown
## System Architecture

**Plugin Architecture**: Pure skill-based Claude Code plugin using markdown skill definitions (no code).

**Directory Structure**: Minimal structure with `.claude-plugin/` for manifest and `skills/` for skill definitions.

**Data Flow**: Git operations → Skill instructions → Claude's built-in tools (Bash, Read, Edit, Write) → State file updates

**Key Patterns**:
- Automatic drift detection via skills
- Convention over configuration
- Zero build dependencies
- Flexible section structure
```

Replace **Active Modules** section:

```markdown
## Active Modules

- **skills/state-management**: Auto-triggers on session start and task completion to detect and update state drift
- **skills/state-init**: Initializes new project state files and configures .claude.md integration
```

Replace **Dependency Map** section:

```markdown
## Dependency Map

None - pure markdown plugin with zero dependencies.
```

Update **Tech Debt** section:

```markdown
## Tech Debt

- TODO: Test skills in various project types (Node.js, Python, Go, Rust)
- TODO: Handle edge cases (very large repos, monorepos, submodules)
- TODO: Add examples of state files for different project types
```

Update **Infrastructure** section:

```markdown
## Infrastructure

- **Runtime**: Claude Code (any version with skill support)
- **Installation**: Manual clone to ~/.claude/plugins/ or marketplace (future)
- **No Build**: No compilation, no package manager, no dependencies
```

**Step 3: Update metadata**

Get current commit:
```bash
git rev-parse HEAD
```

Get timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Update the metadata comment at bottom with new values.

**Step 4: Commit**

```bash
git add .claude/project_state.md
git commit -m "docs: update project_state.md to reflect v2.0 skill-based architecture"
```

---

## Phase 4: Verification and Testing

### Task 12: Manual Skill Verification

**Files:**
- Test: `skills/state-management/SKILL.md`
- Test: `skills/state-init/SKILL.md`

**Step 1: Verify skill frontmatter format**

Check state-management:
```bash
head -6 skills/state-management/SKILL.md
```

Expected:
```yaml
---
name: state-management
description: Automatically maintain project_state.md...
version: 2.0.0
---
```

Check state-init:
```bash
head -6 skills/state-init/SKILL.md
```

Expected:
```yaml
---
name: state-init
description: Initialize a new project_state.md...
version: 2.0.0
---
```

**Step 2: Verify plugin manifest references skills**

```bash
cat .claude-plugin/plugin.json | grep -A 10 "skills"
```

Expected: See both skill paths listed

**Step 3: Check directory structure**

```bash
find . -type f -name "*.md" -o -name "plugin.json" | grep -v node_modules | grep -v ".git"
```

Expected:
```
./.claude-plugin/plugin.json
./README.md
./skills/state-management/SKILL.md
./skills/state-init/SKILL.md
./.claude/project_state.md
./docs/plans/...
```

**Step 4: Verify no TypeScript remains**

```bash
find . -type f \( -name "*.ts" -o -name "*.js" \) ! -path "./node_modules/*" ! -path "./.git/*"
```

Expected: No output (all TypeScript removed)

**Step 5: Document verification**

Create a test checklist in commit message.

**Step 6: Commit**

```bash
git add .
git commit -m "test: verify skill-based structure complete

Verified:
- ✓ Skill frontmatter format correct
- ✓ Plugin manifest references both skills
- ✓ Directory structure minimal (no src code)
- ✓ No TypeScript files remaining
- ✓ All dependencies removed"
```

---

### Task 13: Create Migration Guide

**Files:**
- Create: `docs/MIGRATION-v1-to-v2.md`

**Step 1: Create migration guide**

```markdown
# Migration Guide: v1.0 (Commands) → v2.0 (Skills)

## Overview

Version 2.0 transforms the State Manager from a command-based TypeScript plugin to a pure skill-based plugin with zero dependencies.

## What Changed

### Removed
- ❌ Slash commands: `/state-plan`, `/state-apply`, `/state-status`
- ❌ TypeScript source code (commands/, lib/, agents/, hooks/)
- ❌ Build process (no more npm install, npm run build)
- ❌ Dependencies (no package.json, no node_modules)
- ❌ Test infrastructure (no jest)
- ❌ Configuration files (was .claude-plugin/config.json)

### Added
- ✅ Automatic skills that trigger on session start and task completion
- ✅ Pure markdown skill definitions (no code)
- ✅ Flexible section structure (adapt to any project)
- ✅ .claude.md integration for automatic context loading

### Unchanged
- ✅ State file location: `.claude/project_state.md`
- ✅ Metadata format (fully compatible)
- ✅ Git-based diff tracking

## Migration Steps

### For End Users

If you have v1.0 installed:

```bash
# 1. Navigate to plugin directory
cd ~/.claude/plugins/state-manager

# 2. Pull v2.0 changes
git pull origin main

# 3. Restart Claude Code
# Skills will activate automatically!
```

**Your existing `.claude/project_state.md` files work as-is.** No data migration needed.

### For Developers/Contributors

If you were developing on v1.0:

```bash
# 1. Pull latest
git pull origin main

# 2. Clean old artifacts
rm -rf node_modules dist

# 3. Edit skills instead of code
# Skills are in: skills/*/SKILL.md

# 4. Test by installing locally
# No build step needed!
```

## Behavioral Changes

### Before (v1.0)

```
User: /state-plan
Claude: [Shows proposed changes]

User: /state-apply
Claude: [Applies changes]

User: /state-status
Claude: [Shows drift metrics]
```

**Manual**: You had to remember to run commands.

### After (v2.0)

```
[Session starts]

Claude: "I found 3 commits since last sync. Changes affect:
        - Dependencies: Added stripe
        - Active Modules: payment-service

        Update state?"

User: yes

Claude: "Updated!"
```

**Automatic**: Skills detect drift and offer to update.

## FAQ

### Will my old state files work?

Yes! The metadata format is identical. v2.0 reads the same `STATE_METADATA` comment.

### Can I still manually edit state files?

Yes! The skill detects manual edits and asks how to handle them.

### What if I preferred the command-based approach?

You can stay on v1.0 by not pulling updates. We recommend trying v2.0 - it's much more seamless.

### Do I need to reinstall?

No. Just `git pull` in the plugin directory and restart Claude Code.

### Can I customize sections?

Yes! v2.0 is more flexible. Use any H2 sections that make sense for your project.

## Troubleshooting

### Skills don't trigger

1. Verify plugin.json has skills array:
   ```bash
   cat ~/.claude/plugins/state-manager/.claude-plugin/plugin.json
   ```

2. Restart Claude Code completely

3. Check for errors in Claude Code logs

### State file not updating

1. Ensure you have commits:
   ```bash
   git log --oneline -5
   ```

2. Check metadata in state file has valid commit SHA

3. Verify .claude/project_state.md exists

### Getting skill errors

1. Verify skill frontmatter format (YAML)
2. Check skills/*/SKILL.md files exist
3. Report issue on GitHub with error details

## Rollback to v1.0

If you need to rollback:

```bash
cd ~/.claude/plugins/state-manager
git checkout v1.0.0
npm install
npm run build
```

Restart Claude Code.

## Support

Questions or issues? Open a GitHub issue or discussion!
```

**Step 2: Verify file created**

Run: `cat docs/MIGRATION-v1-to-v2.md | head -20`
Expected: See migration guide content

**Step 3: Commit**

```bash
git add docs/MIGRATION-v1-to-v2.md
git commit -m "docs: add v1 to v2 migration guide"
```

---

### Task 14: Final Cleanup and Release Preparation

**Files:**
- Modify: `docs/plans/2026-01-13-skill-based-redesign.md`

**Step 1: Update design doc status**

Change line 4 from:
```markdown
**Status**: Design Complete
```

to:
```markdown
**Status**: Implementation Complete
```

**Step 2: Verify**

Run: `grep "Status:" docs/plans/2026-01-13-skill-based-redesign.md`
Expected: See "Implementation Complete"

**Step 3: Create version tag**

```bash
git tag -a v2.0.0 -m "Release v2.0.0: Skill-based architecture

- Pure markdown skills (no TypeScript code)
- Automatic drift detection and updates
- Flexible section structure
- .claude.md integration
- Zero dependencies, no build step"
```

**Step 4: Verify tag**

Run: `git tag -l`
Expected: See v2.0.0 tag

**Step 5: Final commit**

```bash
git add docs/plans/2026-01-13-skill-based-redesign.md
git commit -m "docs: mark redesign implementation complete"
```

---

## Summary

After completing all tasks:

**Created:**
- 2 skill definitions (state-management, state-init)
- Updated plugin manifest for skills
- Rewritten README for v2.0
- Migration guide
- Updated project state file

**Removed:**
- All TypeScript source code
- Build configuration
- Dependencies and node_modules
- Test infrastructure
- Old documentation

**Result:**
- Pure skill-based plugin
- Zero dependencies
- No build step
- Automatic state management
- Compatible with v1.0 state files

**Directory structure after completion:**

```
state-manager/
├── .claude/
│   └── project_state.md
├── .claude-plugin/
│   └── plugin.json
├── docs/
│   ├── plans/
│   │   ├── 2026-01-13-skill-based-redesign.md
│   │   └── 2026-01-13-skill-based-implementation-plan.md
│   └── MIGRATION-v1-to-v2.md
├── skills/
│   ├── state-management/
│   │   └── SKILL.md
│   └── state-init/
│       └── SKILL.md
├── .gitignore
└── README.md
```

**Total lines of code:** ~0 (pure markdown)

**Dependencies:** 0

**Build time:** 0 seconds

---

## Testing the Plugin

After implementation, test manually:

1. **Install plugin:**
   ```bash
   ln -s /Users/tdavis/Documents/state-management-claude-code-plugin ~/.claude/plugins/state-manager
   ```

2. **Test state-init in a sample project:**
   - Open Claude Code in a different project
   - Confirm skill suggests creating state file
   - Verify state file created with appropriate sections
   - Verify .claude.md updated

3. **Test state-management drift detection:**
   - Make commits in the test project
   - Restart Claude Code session
   - Confirm skill detects drift
   - Verify proposed changes are accurate
   - Apply changes and verify state file updated

4. **Test silent mode:**
   - Restart Claude Code with no new commits
   - Confirm skill doesn't interrupt

5. **Test manual edit detection:**
   - Manually edit project_state.md
   - Restart session
   - Confirm skill detects manual change

If all tests pass, plugin is ready!
