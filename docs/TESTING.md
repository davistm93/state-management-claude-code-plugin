# Testing Your State Manager Plugin

## Quick Start

1. **Navigate to a test project** (not your plugin directory):
   ```bash
   cd ~/some-test-project
   ```

2. **Start Claude Code with your plugin**:
   ```bash
   claude --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin
   ```

3. **Verify plugin is loaded**:
   ```
   /plugin
   ```
   You should see "state-manager" in the list.

## Understanding Skills vs Commands

The plugin provides both skills and commands:

**Skills (Automatic)**:
- Auto-trigger based on context (session start, task completion)
- Think of skills as "instructions Claude follows automatically"
- Not invoked directly by users

**Commands (Manual)**:
- Invoked using slash syntax: `/state-init`, `/state-management`
- Give you explicit control over when to initialize or sync
- Show up in command list when you type `/`

## Known Issue: Skills Not in available_skills

There's a known bug ([#16575](https://github.com/anthropics/claude-code/issues/16575)) where user-defined plugin skills don't appear in Claude's system context. However, **they still work** if Claude is explicitly told about them.

## Testing Scenarios

### Scenario 1: Test Plugin is Loaded

```bash
# In any project
claude --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin

# Inside Claude session
/plugin
```

**Expected**: You see `state-manager v2.0.0` in the list

### Scenario 2: Test state-init Skill (Manual Trigger)

```bash
# In a test project without .claude/project_state.md
claude --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin
```

Then ask Claude:
```
I want to initialize project state management.
Please read the state-init skill from the state-manager plugin
and follow its instructions.
```

**Expected**: Claude reads `skills/state-init/SKILL.md` and creates `.claude/project_state.md`

### Scenario 3: Test state-management Skill (Manual Trigger)

```bash
# In a project WITH .claude/project_state.md
# Make some commits first
git commit -m "test: changes"

# Start Claude
claude --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin
```

Then ask Claude:
```
Please read the state-management skill from the state-manager plugin
and check if my project state needs syncing.
```

**Expected**: Claude reads `skills/state-management/SKILL.md` and checks for drift

### Scenario 4: Test /state-init Command

```bash
# In a test project without .claude/project_state.md
claude --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin

# Inside Claude session
/state-init
```

**Expected**: Claude invokes the state-init skill and creates `.claude/project_state.md`

### Scenario 5: Test /state-management Command

```bash
# In a project WITH .claude/project_state.md
# Make some commits first
git commit -m "test: changes"

# Start Claude
claude --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin

# Inside Claude session
/state-management
```

**Expected**: Claude invokes the state-management skill and syncs the state file

## Manual Skill Invocation

You have multiple ways to invoke the state management functionality:

### Option A: Use Commands (Recommended)
Invoke commands directly using slash syntax:
```
/state-init
/state-management
```

### Option B: Explicit References
Tell Claude to use the skill explicitly:
```
"Use the state-management skill to check for updates"
"Follow the state-init skill to set up my project"
```

### Option C: Direct Path
Have Claude read the skill file directly:
```
"Read skills/state-init/SKILL.md and follow those instructions"
```

## Testing Checklist

- [ ] Plugin loads without errors (`/plugin` shows it)
- [ ] `/state-init` command appears in command list
- [ ] `/state-management` command appears in command list
- [ ] `/state-init` command invokes skill and creates state file
- [ ] `/state-management` command invokes skill and syncs state
- [ ] Can manually invoke state-init skill by asking Claude
- [ ] state-init creates `.claude/project_state.md` correctly
- [ ] state-init adds section to `.claude.md`
- [ ] state-management detects commits and offers sync
- [ ] Metadata is updated in project_state.md footer
- [ ] Manual edits to state file are detected

## Debug Mode

For detailed logging:
```bash
claude --debug --plugin-dir /Users/tdavis/Documents/state-management-claude-code-plugin
```

This shows:
- Plugin loading status
- Skill registration
- Manifest parsing

## Automatic Skill Triggering

Skills are designed to auto-trigger at session start and task completion. However, there's a known bug ([#16575](https://github.com/anthropics/claude-code/issues/16575)) where this may not always work reliably.

For guaranteed invocation, use the `/state-init` and `/state-management` commands.

## Installation to ~/.claude/plugins

For permanent installation:
```bash
mkdir -p ~/.claude/plugins
cp -r /Users/tdavis/Documents/state-management-claude-code-plugin ~/.claude/plugins/state-manager

# Now loads automatically
claude
```
