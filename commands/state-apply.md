---
description: Apply proposed state changes to project_state.md
---

I'll apply the proposed changes from your last state plan to `project_state.md`.

Step 1: Load the last plan

Use the Read tool to read `.claude/state-plan-last.json`.

If the file doesn't exist:
- Display an error message: "No state plan found. Please run `/state-plan` first to analyze changes before applying."
- EXIT (do not continue)

Step 2: Parse the plan

Parse the JSON and extract:
- `analysis.patches` - the state file patches to apply
- `timestamp` - when the plan was created

Optional: If the timestamp is more than 24 hours old, display a warning but continue.

Step 3: Apply the patches

Use the Bash tool to run:
```bash
node dist/lib-helpers/apply-patches.js .claude/project_state.md '<patches-json>'
```

Where `<patches-json>` is the JSON-stringified patches object from the plan.

Step 4: Display results

Parse the JSON response and display:
- Success message
- Current commit SHA that was recorded
- Timestamp
- Confirmation that `project_state.md` is now synchronized

Example output format:
```
✓ State file updated successfully

Synchronized to commit: abc1234
Updated at: 2026-01-13T00:20:00.000Z

Your project_state.md is now current.
```
