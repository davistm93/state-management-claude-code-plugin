---
description: Analyze code changes and propose state file updates
---

I'll analyze your code changes since the last state sync and propose updates to your project state.

## Step 1: Gather Context

First, let me gather the necessary information.

Use the Bash tool to run:
```bash
node dist/lib-helpers/get-diff.js
```

Store the output as `diffData`.

If `diffData.hasChanges` is false:
- Display: "No changes detected since last sync (commit: {diffData.lastSyncSha})"
- Display: "Your project state is current."
- EXIT (do not continue)

Use the Bash tool to run:
```bash
node dist/lib-helpers/parse-state.js .claude/project_state.md
```

Store the output as `stateData`.

Use the Read tool to read `.claude-plugin/config.json`.

Store the configuration, particularly the `granularity` setting.

## Step 2: Analyze as the State Architect

Now I'll act as the State Architect to analyze these changes.

**My role:** Analyze code changes and determine their architectural significance for maintaining the project state documentation.

**Analysis Focus based on Granularity:**

- **High**: Only major changes (new services, database schema changes, API contracts, infrastructure, major architectural patterns)
- **Medium**: Above + significant classes/components, new routes/endpoints, configuration changes, new dependencies, cross-cutting concerns
- **Fine**: Above + important function signatures, utility additions, structural changes, minor dependency additions

**Analysis Process:**

1. **Compare against existing state**: Check if changes are already documented in `stateData.sections`
2. **Identify impact**: Determine which state sections are affected (system_architecture, active_modules, dependency_map, tech_debt, infrastructure)
3. **Detect removals**: Note when code/modules are deleted
4. **Assess confidence**: Determine certainty level (high/medium/low)

**Important Guidelines:**
- Be conservative: Only flag changes that meet the granularity threshold
- Preserve existing content: When creating patches, include all relevant existing content
- Use consistent formatting: Match the existing markdown style
- Be specific: Avoid vague descriptions
- Question when uncertain: If confidence is low, include clarifying questions
- No duplication: Don't document the same change in multiple sections

**Given Context:**

Current state sections:
```
{stateData.sections formatted as readable text}
```

Git diff to analyze (showing {diffData.commitsAnalyzed} commit(s)):
```
{diffData.diff}
```

Granularity: {config.granularity}

**Perform the analysis and generate a JSON response with this exact structure:**

```json
{
  "summary": "2-4 sentence natural language overview of architectural impact",
  "changes_by_category": {
    "system_architecture": ["change descriptions"],
    "active_modules": ["module changes"],
    "dependency_map": ["dependency changes"],
    "tech_debt": ["tech debt items"],
    "infrastructure": ["infrastructure changes"]
  },
  "patches": {
    "section_name": "## Section Name\n\n[complete updated markdown content for this section]"
  },
  "confidence": "high|medium|low",
  "questions": ["optional clarifying questions"],
  "removals": ["components to remove from state"]
}
```

Only include categories/sections that have actual changes. The `patches` should contain complete section content (not just diffs).

## Step 3: Save the Analysis

After generating the analysis JSON, save it to a session file.

Use the Write tool to create `.claude/state-plan-last.json` with this structure:
```json
{
  "timestamp": "<current ISO timestamp>",
  "analysis": {<the analysis JSON you generated>},
  "diffSummary": {
    "commitsAnalyzed": {diffData.commitsAnalyzed},
    "currentSha": "{diffData.currentSha}"
  }
}
```

## Step 4: Display Results

Format and display the analysis results:

### Summary
{analysis.summary}

### Proposed Changes

For each section in `analysis.patches`:
```markdown
#### {section name}
{show a preview of the patch content - first few lines}
```

### Confidence: {analysis.confidence}

If there are questions:
### Questions
- {list each question}

---

**Next step:** Run `/state-apply` to commit these changes to `project_state.md`
