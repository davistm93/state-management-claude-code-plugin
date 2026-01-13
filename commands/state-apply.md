---
description: Apply proposed state changes to project_state.md
---

# State Apply

I will run the state apply script to update the state file.

<CLAUDE_TOOL name="run_shell_command">
{
  "command": "SCRIPT=\"dist/commands/state-apply.js\"; if [ -f \"$SCRIPT\" ]; then node \"$SCRIPT\"; else node \"$HOME/.claude/plugins/state-manager/$SCRIPT\"; fi"
}
</CLAUDE_TOOL>