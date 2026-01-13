# Testing the State Manager Plugin

This guide shows how to test the State Manager plugin with Claude Code.

## Quick Test: Install for Another Project

### Step 1: Build the Plugin

```bash
# In the state-manager directory
npm install
npm run build
```

### Step 2: Create a Symlink (Recommended for Development)

```bash
# Create Claude plugins directory if it doesn't exist
mkdir -p ~/.claude/plugins

# Create symlink to your plugin
ln -s /Users/tdavis/Documents/state-management-claude-code-plugin ~/.claude/plugins/state-manager

# Verify the symlink
ls -la ~/.claude/plugins/state-manager
```

**Why symlink?** Changes you make to the plugin code will immediately be available after rebuilding.

### Step 3: Test on a Different Project

```bash
# Navigate to any git repository
cd ~/your-other-project

# Start Claude Code
claude

# In Claude Code, try the commands:
/state-status
/state-plan
/state-apply
```

---

## Option 2: Manual Installation (Production Style)

### Step 1: Build and Package

```bash
cd /Users/tdavis/Documents/state-management-claude-code-plugin
npm run build
```

### Step 2: Copy to Plugins Directory

```bash
# Create plugins directory
mkdir -p ~/.claude/plugins

# Copy the entire plugin
cp -r /Users/tdavis/Documents/state-management-claude-code-plugin ~/.claude/plugins/state-manager

# Verify files are there
ls -la ~/.claude/plugins/state-manager/.claude-plugin/
```

### Step 3: Test the Installation

```bash
# Check if plugin manifest is readable
cat ~/.claude/plugins/state-manager/.claude-plugin/plugin.json

# Navigate to a test project
cd ~/test-project

# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Test the commands
claude
```

---

## Option 3: In-Place Testing (This Repository)

You can test the plugin right here in this repository:

```bash
# 1. Make sure you're in the plugin directory
cd /Users/tdavis/Documents/state-management-claude-code-plugin

# 2. Test commands directly
node dist/commands/state-status.js
node dist/commands/state-plan.js
node dist/commands/state-apply.js

# 3. Run tests
npm test

# 4. Run integration test
npm test -- tests/integration.test.ts
```

---

## Verification Checklist

### ✓ Plugin is Installed

```bash
# Check directory exists
ls -la ~/.claude/plugins/state-manager/.claude-plugin/

# Should show:
# - plugin.json
# - config.json
```

### ✓ Commands are Registered

In Claude Code, type `/state` and press TAB. You should see:
- `/state-plan`
- `/state-apply`
- `/state-status`

### ✓ State File is Created

```bash
# After running commands, check for state file
ls -la .claude/project_state.md

# View the state file
cat .claude/project_state.md
```

### ✓ Commands Execute Without Errors

```bash
# Status should work immediately
/state-status

# Plan should analyze changes
/state-plan

# Apply will show session integration message
/state-apply
```

---

## Test Scenarios

### Scenario 1: Fresh Project

```bash
# Create a new test project
mkdir ~/test-state-manager
cd ~/test-state-manager

# Initialize git
git init
echo "# Test Project" > README.md
git add .
git commit -m "Initial commit"

# Start Claude Code and test
claude

# In Claude Code:
/state-plan
# Should say "No changes detected" since no state file exists yet
```

### Scenario 2: Existing Project with Changes

```bash
# Make some changes
echo "console.log('test');" > index.js
git add .
git commit -m "Add index file"

# Run plan
/state-plan
# Should detect 1 commit and propose state changes
```

### Scenario 3: State Drift Detection

```bash
# Create state file manually
mkdir -p .claude
cat > .claude/project_state.md << 'EOF'
# Project State

## System Architecture

Test architecture

<!-- STATE_METADATA: {"last_sync": "2026-01-12T10:00:00Z", "commit_sha": "abc123", "version": "1.0"} -->
EOF

# Make new commits
echo "new file" > test.js
git add .
git commit -m "Add test file"

# Check status
/state-status
# Should show "State is X commits behind"

# Run plan
/state-plan
# Should analyze changes since abc123
```

---

## Debugging

### Enable Debug Mode

```bash
# Set environment variable before running commands
export DEBUG=1

# Run command
node dist/commands/state-plan.js

# Or in Claude Code, you might need to check Claude's debug settings
```

### Common Issues

#### "Config file not found"

```bash
# Check plugin structure
ls -la ~/.claude/plugins/state-manager/.claude-plugin/config.json

# If missing, reinstall the plugin
```

#### "Not a git repository"

```bash
# Make sure you're in a git repo
git status

# Initialize if needed
git init
```

#### "Command not found"

```bash
# Check if dist/ directory exists
ls -la ~/.claude/plugins/state-manager/dist/

# Rebuild if needed
cd ~/.claude/plugins/state-manager
npm run build
```

#### TypeScript/Build Errors

```bash
# Clean and rebuild
npm run clean
npm run build

# Check for errors
npx tsc --noEmit
```

---

## Advanced: Testing with Multiple Projects

```bash
# Create a test script
cat > ~/test-state-manager.sh << 'EOF'
#!/bin/bash

# Test on multiple projects
PROJECTS=(
  "$HOME/project1"
  "$HOME/project2"
  "$HOME/project3"
)

for project in "${PROJECTS[@]}"; do
  echo "Testing in $project"
  cd "$project"

  # Run state-status
  echo "Status:"
  node ~/.claude/plugins/state-manager/dist/commands/state-status.js

  # Run state-plan
  echo "Plan:"
  node ~/.claude/plugins/state-manager/dist/commands/state-plan.js

  echo "---"
done
EOF

chmod +x ~/test-state-manager.sh
~/test-state-manager.sh
```

---

## Performance Testing

```bash
# Test with large repository
cd ~/large-repo

# Time the state-plan command
time node ~/.claude/plugins/state-manager/dist/commands/state-plan.js

# Check memory usage
/usr/bin/time -l node ~/.claude/plugins/state-manager/dist/commands/state-plan.js
```

---

## Uninstalling

```bash
# Remove symlink
rm ~/.claude/plugins/state-manager

# Or remove copied directory
rm -rf ~/.claude/plugins/state-manager
```

---

## Next Steps

After verifying the plugin works:

1. **Configure**: Edit `~/.claude/plugins/state-manager/.claude-plugin/config.json`
2. **Use**: Run `/state-plan` after making changes to track architecture
3. **Integrate**: Set up post-commit hooks for automatic prompts
4. **Extend**: Implement the architect agent integration (see Tech Debt)

See [EXAMPLES.md](./EXAMPLES.md) for expected command outputs.
