---
description: Analyze code changes and propose state file updates
---

# State Plan

I will run the state plan script to analyze changes.

<CLAUDE_TOOL name="run_shell_command">
{
  "command": "SCRIPT=\"dist/commands/state-plan.js\"; if [ -f \"$SCRIPT\" ]; then node \"$SCRIPT\"; else node \"$HOME/.claude/plugins/state-manager/$SCRIPT\"; fi"
}
</CLAUDE_TOOL>