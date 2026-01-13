# Command Examples

This document shows example outputs from each State Manager command.

## `/state-status` - Check Drift

### When state is current

```bash
$ /state-status
SUCCESS: State is current
```

### When commits are behind

```bash
$ /state-status
State is 5 commits behind
```

### When state file was manually edited

```bash
$ /state-status
WARNING:  State file manually edited - changes not validated
```

### When both conditions exist

```bash
$ /state-status
State is 3 commits behind
WARNING:  State file manually edited - changes not validated
```

---

## `/state-plan` - Analyze Changes

### No changes detected

```bash
$ /state-plan

=== State Plan ===

Analyzed 0 commit(s)

Summary: No changes detected since last sync

Proposed Changes:


Run `/state-apply` to commit these changes to project_state.md
```

### Changes detected (with architect integration pending)

```bash
$ /state-plan

=== State Plan ===

Analyzed 3 commit(s)

Summary: Analysis not yet implemented - awaiting agent integration

Proposed Changes:

Questions:
  - Agent integration pending


Run `/state-apply` to commit these changes to project_state.md
```

### Future: With full architect integration

```bash
$ /state-plan

=== State Plan ===

Analyzed 3 commit(s)

Summary: Added JWT authentication service and Redis caching layer.
Introduces two new modules with external dependencies. Database schema
changes detected in migrations.

Proposed Changes:

[system_architecture]
## System Architecture

- **Pattern**: Microservices with JWT authentication
- **Caching**: Redis for session and API response caching
- **Auth Flow**: JWT tokens with 24h expiration

[active_modules]
## Active Modules

- **auth-service**: JWT-based authentication with token refresh
- **cache-service**: Redis wrapper for session and data caching

[dependency_map]
## Dependency Map

- **jsonwebtoken** (9.0.0): JWT token generation and verification
- **redis** (4.6.0): In-memory caching layer

[infrastructure]
## Infrastructure

- **Redis**: Required for caching layer (v6+)

Questions:
  - Should JWT secret be configurable via environment variable?

Confidence: high


Run `/state-apply` to commit these changes to project_state.md
```

---

## `/state-apply` - Apply Changes

### Current state (session integration pending)

```bash
$ /state-apply

WARNING:  state-apply: Session integration pending

This command should be run after /state-plan to apply proposed changes.

Current limitation:
  - Requires session state management to read plan results
  - This feature needs integration with Claude Code's session system

Workaround:
  - Review the output from /state-plan
  - Manually edit .claude/project_state.md if needed
  - Update the STATE_METADATA commit_sha and last_sync timestamp

See Tech Debt in project_state.md for implementation status.
```

### Future: With session integration

```bash
$ /state-apply

SUCCESS: Applied 4 section updates to project_state.md
SUCCESS:

State file synchronized with commit abc123f
```

---

## Error Messages

### Config file not found

```bash
$ /state-plan

ERROR: Error running state-plan

Config file not found. Make sure the plugin is properly installed.
Expected location: /Users/you/.claude/plugins/state-manager/.claude-plugin/config.json

For help, see: README.md or run with DEBUG=1 for full stack trace
```

### Not a git repository

```bash
$ /state-plan

ERROR: Error running state-plan

Current directory is not a git repository.
State Manager requires git to track changes.

For help, see: README.md or run with DEBUG=1 for full stack trace
```

### State file not found (first use)

```bash
$ /state-plan

ERROR: Error running state-plan

State file not found. This is normal for first-time use.
A new state file will be created when you run /state-apply

For help, see: README.md or run with DEBUG=1 for full stack trace
```

---

## Complete Workflow Example

```bash
# 1. Check current status
$ /state-status
State is 5 commits behind

# 2. Review what changed architecturally
$ /state-plan
=== State Plan ===
Analyzed 5 commit(s)
Summary: Added authentication module...
[Proposed changes shown]

# 3. Apply the changes (when session integration is ready)
$ /state-apply
SUCCESS: Applied 4 section updates to project_state.md

# 4. Verify state is current
$ /state-status
SUCCESS: State is current
```

---

## Integration Test Output

```bash
$ npm test -- tests/integration.test.ts

  console.log
    Last sync: 909e0f7
    Current HEAD: 1a43755

  console.log
    Status: State is 1 commit behind

  console.log
    Drift: 1 commits

  console.log
    Plan summary: Analysis not yet implemented - awaiting agent integration

  console.log
    Would apply changes here in real workflow

PASS tests/integration.test.ts
  State Management Integration
    SUCCESS: should complete full state management workflow (66 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```
