# State Manager - Marketplace Listing

## Name
Claude State Manager

## Tagline
Terraform-inspired state reconciliation for tracking architectural evolution

## Category
Documentation & Project Management

## Short Description (160 chars)
Plan & Apply workflow for maintaining living architecture documentation. Analyzes git changes to keep your project_state.md synchronized with reality.

## Long Description

Never let your architecture documentation fall out of sync again. The State Manager plugin brings Terraform's "Plan & Apply" philosophy to architecture documentation, automatically tracking how your codebase evolves.

**How It Works:**

1. **Plan**: Run `/state-plan` to analyze code changes since your last sync
2. **Review**: See exactly what architectural changes occurred with AI-powered analysis
3. **Apply**: Run `/state-apply` to commit updates to your living state file

**Key Features:**

[YES] **Bidirectional Drift Detection** - Catches both code changes and manual edits
[YES] **AI-Powered Analysis** - Specialized Architect agent understands architectural significance
[YES] **Configurable Granularity** - Track everything or just major changes
[YES] **Git-Integrated** - Works seamlessly with your existing workflow
[YES] **Zero Lock-In** - State file is readable markdown, works without the plugin

**Perfect For:**

- Teams wanting to maintain up-to-date architecture docs
- Projects with multiple contributors needing visibility into changes
- Anyone who's ever said "the docs are out of date"

**What You Get:**

A living `.claude/project_state.md` file tracking:
- System Architecture
- Active Modules
- Dependency Map
- Tech Debt
- Infrastructure

**Example Workflow:**

```bash
# After implementing a feature
/state-plan
# "Added JWT authentication service. Introduces auth-module..."

/state-apply
# State updated. Tracking 3 commits.

# Later...
/state-status
# SUCCESS: State is current
```

## Screenshots

1. State Plan Preview showing architectural analysis
2. State File Example with sections
3. State Status showing drift metrics

## Installation Instructions

```bash
# Via Claude Code marketplace
claude install @claude/state-manager

# Or manually
cd ~/.claude/plugins
git clone <repo-url> state-manager
cd state-manager
npm install && npm run build
```

## Quick Start

```bash
# Initialize your project state
/state-plan

# Review proposed changes
# (Shows architectural impact of recent commits)

# Apply to create/update state file
/state-apply

# Check status anytime
/state-status
```

## Configuration

Edit `.claude/plugins/state-manager/.claude-plugin/config.json`:

```json
{
  "granularity": "medium",
  "auto_hooks": false,
  "ignore_patterns": ["**/*.test.ts"]
}
```

## Support & Feedback

- BUG: **Issues**: [GitHub Issues]
- DOCS: **Docs**: [Full Documentation]
- CHAT: **Discussions**: [GitHub Discussions]

## Version History

### 1.0.0
- Initial release
- Three core commands (plan, apply, status)
- Architect agent for analysis
- Configurable granularity
- Bidirectional drift detection

## Author
Claude State Manager Team

## License
MIT
