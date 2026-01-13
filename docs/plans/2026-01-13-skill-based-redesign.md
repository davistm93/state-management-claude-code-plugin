# State Manager Plugin: Skill-Based Redesign

**Date**: 2026-01-13
**Status**: Implementation Complete
**Version**: 2.0.0

## Overview

Redesign the State Manager plugin from a command-driven TypeScript tool into a pure skill-based plugin that automatically maintains `project_state.md` files. The new design eliminates all code, using only markdown skill definitions that leverage Claude's built-in tools.

## Philosophy

The plugin maintains a living documentation file (`.claude/project_state.md`) that tracks architectural evolution. Like how Terraform tracks infrastructure state, this tracks software architecture state - but with automatic detection and seamless integration into Claude's natural workflow.

**Core principle**: State management should be invisible infrastructure. Users work normally; Claude keeps documentation current.

## Current vs New Architecture

### Current (v1.0)
- **Commands**: `/state-plan`, `/state-apply`, `/state-status` (explicit invocation required)
- **Implementation**: TypeScript code with git utilities, state parsers, build steps
- **Workflow**: Three-step plan → review → apply cycle
- **Agent**: Separate Architect agent for analysis
- **Structure**: Rigid five-section format
- **Config**: JSON configuration files

### New (v2.0)
- **Skills**: Automatic triggering on session start and task completion
- **Implementation**: Pure markdown skill definitions (no code)
- **Workflow**: One-step detect → show → apply on approval
- **Agent**: Claude analyzes directly using native capabilities
- **Structure**: Flexible sections that adapt to project needs
- **Config**: Convention over configuration (zero config)

## Benefits of Skill-Based Approach

1. **No build step**: No TypeScript compilation, no dependencies to install
2. **Simpler maintenance**: Edit markdown files vs maintaining code
3. **Better integration**: Triggers automatically vs manual command invocation
4. **Less intrusive**: Silent when nothing to update vs requiring explicit checks
5. **More flexible**: Adapts to any project structure vs rigid templates
6. **Easier to understand**: Read skill instructions vs code logic

## Directory Structure

```
state-manager/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── skills/
│   ├── state-management/
│   │   └── SKILL.md            # Main state sync skill
│   └── state-init/
│       └── SKILL.md            # Initialize project state
└── README.md                    # User documentation
```

**What's removed:**
- `commands/` directory (no slash commands)
- `agents/` directory (no separate agent)
- `lib/` directory (no utility code)
- `tests/` directory (no unit tests needed)
- `hooks/` directory (skills trigger naturally)
- `dist/`, `node_modules/`, build artifacts
- `package.json`, `tsconfig.json`, `jest.config.js`

## Plugin Manifest

`.claude-plugin/plugin.json`:

```json
{
  "name": "state-manager",
  "version": "2.0.0",
  "description": "Automatically maintains project_state.md to track architectural evolution and provide context to Claude",
  "author": "Your Name",

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

## Skill Definitions

### State Management Skill

`skills/state-management/SKILL.md`:

**Purpose**: Automatically detect code changes and update project_state.md

**Trigger conditions**:
- Session start (check for drift immediately)
- After task completion (when user finishes implementing features)

**Workflow**:

1. **Activation Check**
   - Check if `.claude/project_state.md` exists
   - If not, suggest running state-init skill
   - If exists, proceed to drift detection

2. **Drift Detection**
   - Read metadata comment from bottom of project_state.md
   - Extract `last_sync_commit_sha` from JSON
   - Run: `git log --oneline <sha>..HEAD --no-merges`
   - If no commits: state is current, silently continue
   - If commits found: proceed to analysis

3. **Change Analysis**
   - Read current project_state.md to understand existing documentation
   - Run: `git diff <sha>..HEAD` to see code changes
   - Analyze which sections need updates based on changes:
     - New files/modules → architectural sections
     - Dependency changes → dependency sections
     - Config changes → infrastructure sections
     - TODOs/bugs → tech debt sections
   - Present findings with proposed changes

4. **Update Application**
   - Show user what will change
   - On approval, use Edit tool to update affected sections
   - Update metadata comment with current timestamp and HEAD commit SHA
   - Confirm completion

**Tools used**: Bash (git commands), Read (load state file), Edit (update sections), Write (metadata)

---

### State Initialization Skill

`skills/state-init/SKILL.md`:

**Purpose**: Create a new project_state.md file and configure Claude context

**Trigger condition**: Explicit user request or suggestion from state-management skill

**Workflow**:

1. **Check for Existing State**
   - Check if `.claude/project_state.md` already exists
   - If exists, warn and ask about reinitialization
   - If doesn't exist, proceed

2. **Analyze Project Structure**
   - Use Glob to discover file types and structure
   - Run: `git log --oneline -20` for recent history
   - Read dependency files (package.json, requirements.txt, go.mod, etc.)
   - Infer project type (web app, CLI, library, etc.)

3. **Propose Sections**
   - Suggest section structure based on project type:
     - **Web apps**: System Architecture, API Endpoints, Active Modules, Dependencies, Tech Debt, Infrastructure
     - **CLI tools**: System Architecture, Commands, Dependencies, Tech Debt, Build/Release
     - **Libraries**: Public API, Internal Modules, Dependencies, Tech Debt, Build
   - Allow user to customize section names

4. **Create State File**
   - Generate initial content for each section based on codebase analysis
   - Use Write tool to create `.claude/project_state.md`
   - Add metadata comment with current timestamp and HEAD commit SHA

5. **Configure Claude Context**
   - Check if `.claude.md` exists in project root
   - If exists, read and check for project_state.md reference
   - If no reference, append section instructing Claude to read state file
   - If `.claude.md` doesn't exist, create it with state reference
   - Confirm completion

**Tools used**: Glob (discover files), Bash (git), Read (dependency files), Write (create files)

---

## State File Format

### Location
`.claude/project_state.md` (inside `.claude/` directory for organization)

### Structure
Flexible markdown with any sections the project needs. Sections identified by H2 headers (`## Section Name`).

**Common patterns**:
- System Architecture
- Active Modules / Components
- Dependencies / Dependency Map
- API Endpoints / Routes
- Tech Debt / Known Issues
- Infrastructure / Deployment

Projects can use any sections that make sense for their domain.

### Metadata Format
At the bottom of every state file:

```markdown
<!-- STATE_METADATA
{
  "last_sync_commit_sha": "abc123def456",
  "last_sync_timestamp": "2026-01-13T10:30:00Z",
  "schema_version": "1.0"
}
-->
```

- **HTML comment**: Invisible when rendered in markdown viewers
- **JSON**: Easy to parse with regex or manual reading
- **last_sync_commit_sha**: Git reference point for calculating diffs
- **last_sync_timestamp**: Human-readable tracking
- **schema_version**: Future-proofing for format changes

### Style Preservation
The skill maintains existing formatting conventions:
- If section uses bullet points, add bullet points
- If section uses prose paragraphs, use prose
- Match existing detail level (high-level vs granular)
- Preserve formatting (bold, code blocks, links, etc.)

## Claude.md Integration

When `state-init` creates a state file, it ensures `.claude.md` contains:

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

**Effect**: Every Claude Code session automatically loads project context, enabling better suggestions and understanding without user intervention.

## Workflow Examples

### Example 1: Session Start with Drift

```
[User opens Claude Code]

Claude: I notice your project_state.md is 3 commits behind. Let me check what changed...

I found these changes since last sync:
- Added authentication middleware (src/middleware/auth.ts)
- Updated user model with roles field (src/models/user.ts)
- Added JWT dependency (package.json)

This affects:
- Active Modules: Should add auth middleware
- Dependencies: Should add jsonwebtoken@9.0.0
- System Architecture: Role-based access control introduced

Would you like me to update the state file?

[User approves]

Updated project_state.md. Now tracking through commit def789.
```

### Example 2: After Task Completion

```
User: done with the payment integration

Claude: Great! Let me update the project state...

I'll add the payment integration to your state:

Active Modules - Adding:
- payment-service: Stripe integration for subscription billing

Dependencies - Adding:
- stripe@14.10.0: Payment processing

System Architecture - Noting:
- Webhook handling for payment events at /api/webhooks/stripe

Updating state file... Done.
```

### Example 3: No Drift (Silent)

```
[User opens Claude Code]
[Skill checks git log, finds no new commits]
[No interruption - continues silently]

User: how do I add error handling to the login endpoint?

Claude: [Proceeds with request]
```

### Example 4: First Time Setup

```
[User opens Claude Code in new project]

Claude: I notice you don't have a project_state.md file yet. This helps me understand your project architecture better.

Would you like me to create one by analyzing your current codebase?

[User approves]

I can see this is a Node.js/Express API project. I'll create a state file with these sections:
- System Architecture
- API Endpoints
- Active Modules
- Dependencies
- Tech Debt
- Infrastructure

Created project_state.md and configured .claude.md to reference it automatically!
```

## Flexible Section Handling

### Section Detection
1. Read entire project_state.md file
2. Identify sections by markdown H2 headers
3. Parse section names and current content
4. Preserve user's chosen structure

### Smart Section Matching
When analyzing git changes, categorize updates by impact:
- New dependencies → match to "Dependencies", "Dependency Map", "External Libraries", etc.
- New files/modules → match to "Modules", "Components", "Architecture", etc.
- Config changes → match to "Infrastructure", "Configuration", "Deployment", etc.
- Bugs/TODOs → match to "Tech Debt", "Known Issues", "Backlog", etc.

Use semantic similarity, not exact string matching.

### Section Creation
If changes don't fit existing sections:
- Ask user: "Should I create a new section for X, or update existing section Y?"
- Follow existing formatting style
- Match the document's tone and detail level

### Style Matching
- Analyze existing section formatting
- Use same structure (bullets vs prose, code blocks, etc.)
- Match detail level (architectural overview vs implementation details)
- Preserve conventions (bold for module names, code formatting, etc.)

## Migration from v1.0

### For Users

**If you have existing v1.0 installation:**

1. Uninstall old version:
   ```bash
   cd ~/.claude/plugins/state-manager
   npm run clean
   cd ..
   rm -rf state-manager
   ```

2. Install v2.0:
   ```bash
   git clone <repo> state-manager
   cd state-manager
   git checkout v2.0
   ```

3. Your existing `.claude/project_state.md` will work as-is! The metadata format is compatible.

4. The skill will trigger automatically on next session start.

**No data migration needed** - existing state files work with new version.

### For Developers

**What to archive:**
- All TypeScript source code (commands/, lib/, agents/)
- Test files and jest configuration
- Build configuration (tsconfig.json, package.json)
- Documentation referencing slash commands

**What to keep:**
- Existing project_state.md files (fully compatible)
- Metadata format (unchanged)
- README concept (update for skill-based approach)

## Future Enhancements

### Potential Additions

1. **State diff visualization**: Show visual diff of state changes before applying
2. **Multi-repo tracking**: Support monorepos with multiple state files
3. **State history**: Track state evolution over time (snapshots)
4. **Custom triggers**: Allow users to configure when drift checks happen
5. **State validation**: Verify documented state matches actual codebase
6. **Team sync**: Detect when other team members update state
7. **Export formats**: Generate architecture diagrams from state

### Not Planned
- Slash commands (defeats purpose of automatic approach)
- Configuration files (convention over config)
- Code-based implementation (skills-only philosophy)

## Success Criteria

The redesign is successful if:

1. **Zero friction**: Users never think about state management
2. **Always current**: State file stays synchronized with codebase
3. **Better context**: Claude gives more relevant suggestions
4. **Simple to understand**: New users grasp concept in <5 minutes
5. **Easy to maintain**: Contributors can modify skills without learning codebase
6. **Portable**: Works across all project types without configuration

## Risks and Mitigations

### Risk: Skill triggers too often (annoying)
**Mitigation**: Silent continuation when no drift detected. Only interrupt when changes found.

### Risk: Git commands fail in certain repos
**Mitigation**: Skill includes error handling instructions. If git fails, degrade gracefully and ask user.

### Risk: Users don't understand flexible sections
**Mitigation**: state-init provides sensible defaults. README shows examples.

### Risk: Metadata parsing breaks
**Mitigation**: Use simple JSON in HTML comment. Regex fallback if JSON parse fails.

### Risk: Skill doesn't trigger when expected
**Mitigation**: Clear trigger conditions in skill definition. Document expected behavior.

## Implementation Plan

See companion document: `2026-01-13-skill-based-implementation-plan.md`

## References

- [Claude Code Plugin Structure](https://claude-plugins.dev/skills/@anthropics/claude-plugins-official/plugin-structure)
- [Agent Skills Documentation](https://code.claude.com/docs/en/skills)
- [Superpowers Plugin](https://github.com/obra/superpowers) - Reference implementation
- [Claude Code Plugins README](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)

---

**Next Steps**: Review and approve this design, then proceed to implementation planning.
