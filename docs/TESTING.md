 1. Build Your Plugin

  cd /Users/tdavis/Documents/state-management-claude-code-plugin
  npm install
  npm run build

  2. Test It Locally with --plugin-dir

  # Navigate to any project you want to test with
  cd ~/some-other-project

  # Start Claude Code with your plugin loaded
  claude --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin

  3. Try Your Commands

  Once Claude Code starts, your plugin will be loaded and you can use:
  /state-plan
  /state-apply
  /state-status

  4. Iterating During Development

  After making changes to your plugin:
  1. Exit Claude Code
  2. Rebuild: npm run build
  3. Restart: claude --plugin-dir /path/to/your/plugin

  The documentation states:
  "As you make changes to your plugin, restart Claude Code to pick up the updates."

  Testing Multiple Plugins

  You can also load multiple plugins at once:

  claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two

  Debugging

  Add the --debug flag to see detailed plugin loading information:

  claude --debug --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin

  This shows which plugins are loaded, any manifest errors, and command/agent registration.