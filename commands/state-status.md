---
description: Show current state drift metrics
---

# State Status

I will run the state status script to check for drift.

<CLAUDE_TOOL name="run_shell_command">
{
  "command": "SCRIPT=\"dist/commands/state-status.js\"; if [ -f \"$SCRIPT\" ]; then node \"$SCRIPT\"; else node \"$HOME/.claude/plugins/state-manager/$SCRIPT\"; fi"
}
</CLAUDE_TOOL>