---
description: Initialize project_state.md file for tracking project architecture
---

# Initialize Project State

Initialize a new `project_state.md` file by analyzing your codebase and setting up automatic context loading for Claude.

## What This Command Does

This command will:
1. Analyze your project structure (languages, frameworks, dependencies) using Haiku 4.5 agent
2. Create `.claude/project_state.md` with appropriate sections
3. Configure `CLAUDE.md` to automatically load state context
4. Set up metadata tracking for future synchronization

## When to Use

- First time setting up state management in a project
- When you want to reinitialize state tracking (will warn before overwriting)
- When starting fresh documentation of your project architecture

## Execution

You must invoke the `state-manager:state-init` skill to perform initialization:

```
Use the Skill tool to invoke state-manager:state-init
```

After invocation, follow the skill's instructions to complete the initialization process.
