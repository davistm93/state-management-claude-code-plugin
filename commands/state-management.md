---
description: Sync project_state.md with recent code changes
---

# Sync Project State

Manually synchronize your `project_state.md` file with recent code changes by analyzing git commits and updating architectural documentation.

## What This Command Does

This command will:
1. Check for commits since last state sync
2. Analyze changes in those commits using Haiku 4.5 agent
3. Identify affected documentation sections
4. Propose updates to keep state file current
5. Update metadata with latest sync point

## When to Use

- After completing a feature or significant code changes
- When you want to ensure documentation is current
- Before creating pull requests to verify state is up-to-date
- Anytime you want to manually trigger a state sync (normally happens automatically at session start)

## Execution

You must invoke the `state-manager:state-management` skill to perform synchronization:

```
Use the Skill tool to invoke state-manager:state-management
```

After invocation, follow the skill's instructions to complete the synchronization process.

## Notes

The state-management skill normally triggers automatically at session start and after task completion. This command allows you to manually trigger it anytime.
