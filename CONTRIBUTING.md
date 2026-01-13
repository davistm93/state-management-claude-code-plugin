# Contributing to State Manager

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone <repo-url> state-manager
cd state-manager

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Watch mode for development
npm run test:watch
```

## Project Structure

```
state-manager/
├── .claude-plugin/         # Plugin manifest and configuration
│   ├── plugin.json        # Defines commands, agents, hooks
│   └── config.json        # Default user configuration
├── commands/              # Command implementations
│   ├── state-plan.ts      # Analyze git changes
│   ├── state-apply.ts     # Apply state updates
│   ├── state-status.ts    # Show drift metrics
│   └── index.ts           # Public API exports
├── agents/                # AI agent definitions
│   └── architect.md       # Architectural analysis prompt
├── hooks/                 # Git hook implementations
│   └── post-commit.ts     # Optional commit notification
├── lib/                   # Shared utilities
│   ├── git-utils.ts       # Git operations wrapper
│   ├── state-parser.ts    # State file CRUD operations
│   └── architect-client.ts # Agent communication
├── tests/                 # Integration tests
│   └── integration.test.ts
└── docs/                  # Documentation
    ├── plans/             # Design and implementation plans
    ├── EXAMPLES.md        # Command output examples
    └── MARKETPLACE.md     # Marketplace listing
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Write Tests First (TDD)

We follow Test-Driven Development:

```typescript
// 1. Write a failing test
describe('myNewFeature', () => {
  it('should do something', () => {
    const result = myNewFeature();
    expect(result).toBe(expected);
  });
});

// 2. Run tests (should fail)
npm test

// 3. Implement the feature
export function myNewFeature() {
  return expected;
}

// 4. Run tests (should pass)
npm test
```

### 3. Follow Code Style

- **TypeScript**: Use strict type checking
- **Error Handling**: Always handle errors with helpful messages
- **Comments**: Explain "why" not "what"
- **Naming**: Use descriptive names (e.g., `getCurrentCommitSha` not `getSha`)

### 4. Update Documentation

When adding features:
- Update README.md with usage examples
- Add examples to docs/EXAMPLES.md
- Update project_state.md if architecture changes

### 5. Run Quality Checks

```bash
# Build must succeed
npm run build

# All tests must pass
npm test

# No TypeScript errors
npx tsc --noEmit
```

### 6. Commit with Conventional Commits

Use meaningful commit messages:

```bash
feat: add file context loading for large changes
fix: correct path resolution in state-apply
docs: update examples with error messages
test: add integration test for status command
refactor: extract common git operations
chore: upgrade dependencies
```

## Testing Guidelines

### Unit Tests

Test individual functions in isolation:

```typescript
// lib/state-parser.test.ts
import { extractSection } from './state-parser';

describe('extractSection', () => {
  it('should extract content between headers', () => {
    const markdown = '## Section\n\nContent here\n\n## Next';
    const result = extractSection(markdown, 'section');
    expect(result).toBe('Content here');
  });
});
```

### Integration Tests

Test complete workflows:

```typescript
// tests/integration.test.ts
it('should complete full workflow', async () => {
  const status = await getStateStatus(...);
  const plan = await runStatePlan(...);
  // Verify end-to-end behavior
});
```

### Test File Locations

- Unit tests: `lib/*.test.ts` and `commands/*.test.ts`
- Integration tests: `tests/*.test.ts`

## Common Development Tasks

### Adding a New Command

1. Create `commands/my-command.ts`:

```typescript
export async function runMyCommand(options: MyOptions): Promise<MyResult> {
  // Implementation
}

export async function main() {
  try {
    const result = await runMyCommand({ ... });
    console.log('Success:', result);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

2. Register in `.claude-plugin/plugin.json`:

```json
{
  "commands": {
    "my-command": {
      "description": "Brief description",
      "script": "./commands/my-command.ts",
      "category": "state"
    }
  }
}
```

3. Export from `commands/index.ts`:

```typescript
export { runMyCommand } from './my-command';
```

4. Add tests:

```typescript
// commands/my-command.test.ts
import { runMyCommand } from './my-command';

describe('my-command', () => {
  it('should work correctly', async () => {
    const result = await runMyCommand({ ... });
    expect(result).toBeDefined();
  });
});
```

### Adding a New Utility

1. Create `lib/my-util.ts` with implementation
2. Create `lib/my-util.test.ts` with tests
3. Export from `lib/index.ts` (if needed publicly)

### Updating the Architect Agent

Edit `agents/architect.md` - this is the prompt that defines how the AI analyzes code changes.

Key sections:
- **Analysis Focus**: What the agent should look for
- **Output Format**: JSON structure for responses
- **Examples**: Sample inputs and outputs

## Architecture Decisions

### Why TypeScript?

- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Easier refactoring

### Why simple-git?

- Clean API for git operations
- Handles complex git commands
- Well-maintained and tested

### Why Jest?

- Fast and reliable
- Great TypeScript support
- Snapshot testing capabilities

### Why Flat Markdown for State File?

- Human-readable and git-friendly
- No lock-in (works without plugin)
- Easy to manually edit and review
- Familiar format for developers

## Known Limitations

See "Tech Debt" in `.claude/project_state.md` for current limitations:

1. **Architect Agent**: Returns mock data (needs Claude API integration)
2. **Session State**: state-apply can't read plan results (needs Claude Code integration)
3. **Post-Commit Hook**: Implemented but needs testing with actual git hooks
4. **File Context**: Large changes (>50 lines) don't load full file context yet

## Pull Request Process

1. **Create PR** with clear title and description
2. **Link issues** if fixing bugs
3. **Add examples** showing the new feature in action
4. **Wait for review** - maintainers will provide feedback
5. **Address feedback** and push updates
6. **Merge** when approved

## Getting Help

- **Issues**: Found a bug? Open an issue with reproduction steps
- **Questions**: Not sure how something works? Open a discussion
- **Slack**: Join our community channel (if available)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help newcomers learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to State Manager! 🎉
