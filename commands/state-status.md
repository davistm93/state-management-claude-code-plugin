---
description: Show current state drift metrics
---

I'll check the current state drift metrics for you.

Step 1: Get status data

Use the Bash tool to run:
```bash
node dist/lib-helpers/get-status.js
```

Step 2: Parse and display results

Parse the JSON output and display the status in a formatted way:
- Show the drift message
- If drift > 0, include current SHA and last sync SHA
- If drift > 0, suggest running `/state-plan` to analyze pending changes

Display the results in a clean, readable format.
