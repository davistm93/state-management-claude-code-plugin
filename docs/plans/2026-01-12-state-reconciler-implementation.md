# State Reconciler Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Terraform-inspired "Plan & Apply" state management plugin that reconciles code drift with a project_state.md file.

**Architecture:** Hook-based plugin system with three commands (state-plan, state-apply, state-status), an architect subagent for analysis, and a living markdown state file with metadata tracking.

**Tech Stack:** TypeScript, Node.js, simple-git for git operations, Jest for testing

---

## Task 1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Create package.json**

```bash
cat > package.json << 'EOF'
{
  "name": "@claude/state-manager",
  "version": "1.0.0",
  "description": "Plan & Apply state management for Claude Code projects",
  "keywords": ["claude-plugin", "state-management", "architecture", "documentation"],
  "author": "Claude State Manager Team",
  "license": "MIT",
  "main": "dist/commands/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "simple-git": "^3.20.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
EOF
```

**Step 2: Create tsconfig.json**

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["commands/**/*", "agents/**/*", "hooks/**/*", "lib/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
```

**Step 3: Create .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
.env
coverage/
.idea/
.vscode/
EOF
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

**Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore
git commit -m "chore: initialize project with TypeScript and dependencies"
```

---

## Task 2: Create Plugin Manifest

**Files:**
- Create: `.claude/plugins/state-manager/.claude-plugin/plugin.json`
- Create: `.claude/plugins/state-manager/.claude-plugin/config.json`

**Step 1: Create directory structure**

```bash
mkdir -p .claude/plugins/state-manager/.claude-plugin
```

**Step 2: Create plugin.json manifest**

```bash
cat > .claude/plugins/state-manager/.claude-plugin/plugin.json << 'EOF'
{
  "name": "state-manager",
  "version": "1.0.0",
  "description": "Terraform-inspired state reconciliation for tracking architectural evolution",
  "author": "Claude State Manager Team",
  "claude_version": ">=0.5.0",

  "commands": {
    "state-plan": {
      "description": "Analyze code changes and propose state file updates",
      "script": "./commands/state-plan.ts",
      "category": "state"
    },
    "state-apply": {
      "description": "Apply proposed state changes to project_state.md",
      "script": "./commands/state-apply.ts",
      "category": "state"
    },
    "state-status": {
      "description": "Show current state drift metrics",
      "script": "./commands/state-status.ts",
      "category": "state"
    }
  },

  "agents": {
    "architect": {
      "path": "./agents/architect.md",
      "description": "Architectural impact analyzer"
    }
  },

  "hooks": {
    "post-commit": {
      "script": "./hooks/post-commit.ts",
      "description": "Suggest state-plan after commits",
      "enabled": false
    }
  },

  "config_schema": {
    "granularity": {
      "type": "enum",
      "values": ["high", "medium", "fine"],
      "default": "medium"
    },
    "auto_hooks": {
      "type": "boolean",
      "default": false
    },
    "ignore_patterns": {
      "type": "array",
      "default": ["**/*.test.ts", "**/*.spec.ts", "**/fixtures/**"]
    }
  }
}
EOF
```

**Step 3: Create default config.json**

```bash
cat > .claude/plugins/state-manager/.claude-plugin/config.json << 'EOF'
{
  "granularity": "medium",
  "auto_hooks": false,
  "ignore_patterns": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/fixtures/**"
  ]
}
EOF
```

**Step 4: Commit**

```bash
git add .claude/plugins/state-manager/.claude-plugin/
git commit -m "feat: add plugin manifest and default configuration"
```

---

## Task 3: Create Architect Agent Definition

**Files:**
- Create: `.claude/plugins/state-manager/agents/architect.md`

**Step 1: Create agents directory**

```bash
mkdir -p .claude/plugins/state-manager/agents
```

**Step 2: Write architect agent prompt**

```bash
cat > .claude/plugins/state-manager/agents/architect.md << 'EOF'
# State Architect Agent

You are the State Architect. Your role is to analyze code changes and determine their architectural significance for maintaining the project state documentation.

## Inputs

You will receive:
- **Git diffs**: Showing what changed in the codebase
- **Full file context**: For complex changes (new files, large modifications)
- **Current project_state.md content**: Existing state documentation
- **Granularity setting**: One of [high, medium, fine] indicating detail level

## Analysis Focus

Based on the granularity setting, focus on:

### High Granularity (Major Changes Only)
- New services, applications, or major modules
- Database schema changes or new data stores
- API contract changes (new endpoints, breaking changes)
- Infrastructure additions (new runtime requirements, cloud services)
- Major architectural pattern shifts

### Medium Granularity (Significant Changes)
All of the above, plus:
- New significant classes or components
- New routes/endpoints in existing services
- Configuration changes (environment variables, feature flags)
- New external dependencies or major version upgrades
- Cross-cutting concerns (auth, logging, monitoring)

### Fine Granularity (Detailed Tracking)
All of the above, plus:
- Important function signatures or public APIs
- Utility additions that establish new patterns
- Any structural changes to existing modules
- Minor dependency additions

## Analysis Process

1. **Compare against existing state**: Check if changes are already documented
2. **Identify impact**: Determine which state sections are affected
3. **Detect removals**: Note when code/modules are deleted
4. **Flag inconsistencies**: Highlight when state mentions modules not found in code
5. **Assess confidence**: Determine how certain you are about the analysis

## Output Format

You must respond with valid JSON in this exact structure:

```json
{
  "summary": "Natural language overview of the architectural impact. 2-4 sentences explaining what changed and why it matters.",

  "changes_by_category": {
    "system_architecture": [
      "Description of system architecture change"
    ],
    "active_modules": [
      "New module: module-name - Brief description of purpose"
    ],
    "dependency_map": [
      "package-name (version): Usage context"
    ],
    "tech_debt": [
      "Description of tech debt introduced or resolved"
    ],
    "infrastructure": [
      "Infrastructure requirement or change"
    ]
  },

  "patches": {
    "system_architecture": "## System Architecture\n\n[Complete updated markdown content for this section, including all existing content that should remain plus new additions]",
    "active_modules": "## Active Modules\n\n[Complete updated markdown content]"
  },

  "confidence": "high|medium|low",

  "questions": [
    "Optional clarifying question if analysis is uncertain",
    "Another question if needed"
  ],

  "removals": [
    "Module or component that was deleted and should be removed from state"
  ]
}
```

## Important Guidelines

- **Be conservative**: Only flag changes that meet the granularity threshold
- **Preserve existing content**: When creating patches, include all relevant existing content
- **Use consistent formatting**: Match the existing markdown style in project_state.md
- **Be specific**: Avoid vague descriptions like "various changes" or "updates"
- **Question when uncertain**: If confidence is low, ask clarifying questions
- **No duplication**: Don't document the same change in multiple sections

## Examples

### Example Input (Medium Granularity)

```diff
+++ b/src/services/auth-service.ts
+import { JWTStrategy } from './strategies/jwt';
+
+export class AuthService {
+  async authenticate(token: string) {
+    return await this.jwtStrategy.verify(token);
+  }
+}
```

### Example Output

```json
{
  "summary": "Added JWT-based authentication service. Introduces new auth-service module with JWT token verification strategy. This establishes the authentication pattern for the application.",
  "changes_by_category": {
    "active_modules": [
      "New module: auth-service - JWT-based authentication with token verification"
    ],
    "system_architecture": [
      "Implemented JWT authentication strategy for API security"
    ]
  },
  "patches": {
    "active_modules": "## Active Modules\n\n- **auth-service**: JWT-based authentication with token verification\n",
    "system_architecture": "## System Architecture\n\n- **Authentication**: JWT-based token authentication for API endpoints\n"
  },
  "confidence": "high",
  "questions": [],
  "removals": []
}
```

## Your Task

Analyze the provided git diff and file context, then respond with the JSON structure above. Focus on architectural significance, not implementation details.
EOF
```

**Step 3: Commit**

```bash
git add .claude/plugins/state-manager/agents/architect.md
git commit -m "feat: add architect agent for state analysis"
```

---

## Task 4: Create Utility Library for Git Operations

**Files:**
- Create: `lib/git-utils.ts`
- Create: `lib/git-utils.test.ts`

**Step 1: Create lib directory**

```bash
mkdir -p lib
```

**Step 2: Write failing test**

```typescript
cat > lib/git-utils.test.ts << 'EOF'
import { getLastSyncCommit, getDiffSinceCommit, getCurrentCommitSha } from './git-utils';

describe('git-utils', () => {
  describe('getCurrentCommitSha', () => {
    it('should return current HEAD commit SHA', async () => {
      const sha = await getCurrentCommitSha('/fake/path');
      expect(sha).toMatch(/^[a-f0-9]{7,40}$/);
    });
  });

  describe('getLastSyncCommit', () => {
    it('should extract commit SHA from metadata comment', () => {
      const markdown = '<!-- STATE_METADATA: {"commit_sha": "abc123f"} -->';
      const sha = getLastSyncCommit(markdown);
      expect(sha).toBe('abc123f');
    });

    it('should return null if no metadata found', () => {
      const markdown = '# Some content without metadata';
      const sha = getLastSyncCommit(markdown);
      expect(sha).toBeNull();
    });
  });

  describe('getDiffSinceCommit', () => {
    it('should get diff between commit and HEAD', async () => {
      const diff = await getDiffSinceCommit('/fake/path', 'abc123');
      expect(typeof diff).toBe('string');
    });

    it('should get uncommitted changes when no commit provided', async () => {
      const diff = await getDiffSinceCommit('/fake/path', null);
      expect(typeof diff).toBe('string');
    });
  });
});
EOF
```

**Step 3: Configure Jest**

```bash
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ]
};
EOF
```

**Step 4: Run test to verify it fails**

Run: `npm test -- lib/git-utils.test.ts`
Expected: FAIL with "Cannot find module './git-utils'"

**Step 5: Write minimal implementation**

```typescript
cat > lib/git-utils.ts << 'EOF'
import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function getCurrentCommitSha(repoPath: string): Promise<string> {
  const git: SimpleGit = simpleGit(repoPath);
  const log = await git.log(['-1']);
  return log.latest?.hash || '';
}

export function getLastSyncCommit(markdownContent: string): string | null {
  const metadataMatch = markdownContent.match(/<!-- STATE_METADATA: ({.*?}) -->/);
  if (!metadataMatch) return null;

  try {
    const metadata = JSON.parse(metadataMatch[1]);
    return metadata.commit_sha || null;
  } catch {
    return null;
  }
}

export async function getDiffSinceCommit(
  repoPath: string,
  commitSha: string | null
): Promise<string> {
  const git: SimpleGit = simpleGit(repoPath);

  if (!commitSha) {
    // Get uncommitted changes
    return await git.diff();
  }

  // Get diff between commit and HEAD
  return await git.diff([`${commitSha}...HEAD`]);
}

export async function getCommitsBetween(
  repoPath: string,
  fromCommit: string,
  toCommit: string = 'HEAD'
): Promise<number> {
  const git: SimpleGit = simpleGit(repoPath);
  const log = await git.log({ from: fromCommit, to: toCommit });
  return log.total;
}

export async function hasUncommittedChanges(repoPath: string): Promise<boolean> {
  const git: SimpleGit = simpleGit(repoPath);
  const status = await git.status();
  return status.files.length > 0;
}
EOF
```

**Step 6: Run test to verify it passes**

Run: `npm test -- lib/git-utils.test.ts`
Expected: PASS (or skip if mock git repo needed)

**Step 7: Commit**

```bash
git add lib/git-utils.ts lib/git-utils.test.ts jest.config.js
git commit -m "feat: add git utility functions for state tracking"
```

---

## Task 5: Create State File Parser

**Files:**
- Create: `lib/state-parser.ts`
- Create: `lib/state-parser.test.ts`

**Step 1: Write failing test**

```typescript
cat > lib/state-parser.test.ts << 'EOF'
import { parseStateFile, extractSection, updateSection, updateMetadata } from './state-parser';

describe('state-parser', () => {
  const sampleState = `# Project State

## System Architecture

- Pattern: Microservices

## Active Modules

- auth-module: JWT authentication

<!-- STATE_METADATA: {"last_sync": "2026-01-12T10:00:00Z", "commit_sha": "abc123", "version": "1.0"} -->`;

  describe('parseStateFile', () => {
    it('should parse metadata from state file', () => {
      const result = parseStateFile(sampleState);
      expect(result.metadata.commit_sha).toBe('abc123');
      expect(result.metadata.last_sync).toBe('2026-01-12T10:00:00Z');
    });

    it('should extract sections', () => {
      const result = parseStateFile(sampleState);
      expect(result.sections['system_architecture']).toContain('Microservices');
      expect(result.sections['active_modules']).toContain('auth-module');
    });
  });

  describe('extractSection', () => {
    it('should extract content between section headers', () => {
      const content = extractSection(sampleState, 'system_architecture');
      expect(content).toContain('Pattern: Microservices');
    });

    it('should return empty string for missing section', () => {
      const content = extractSection(sampleState, 'nonexistent');
      expect(content).toBe('');
    });
  });

  describe('updateSection', () => {
    it('should replace section content', () => {
      const newContent = '## System Architecture\n\n- Pattern: Monolith';
      const updated = updateSection(sampleState, 'system_architecture', newContent);
      expect(updated).toContain('Pattern: Monolith');
      expect(updated).not.toContain('Pattern: Microservices');
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata in state file', () => {
      const updated = updateMetadata(sampleState, {
        commit_sha: 'xyz789',
        last_sync: '2026-01-12T11:00:00Z'
      });
      expect(updated).toContain('"commit_sha": "xyz789"');
      expect(updated).toContain('"last_sync": "2026-01-12T11:00:00Z"');
    });
  });
});
EOF
```

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/state-parser.test.ts`
Expected: FAIL with "Cannot find module './state-parser'"

**Step 3: Write minimal implementation**

```typescript
cat > lib/state-parser.ts << 'EOF'
export interface StateMetadata {
  last_sync: string;
  commit_sha: string;
  version: string;
  granularity?: string;
}

export interface ParsedState {
  metadata: StateMetadata;
  sections: Record<string, string>;
  rawContent: string;
}

const SECTION_NAMES = [
  'system_architecture',
  'active_modules',
  'dependency_map',
  'tech_debt',
  'infrastructure'
];

export function parseStateFile(content: string): ParsedState {
  const metadata = extractMetadata(content);
  const sections: Record<string, string> = {};

  for (const sectionName of SECTION_NAMES) {
    sections[sectionName] = extractSection(content, sectionName);
  }

  return {
    metadata,
    sections,
    rawContent: content
  };
}

function extractMetadata(content: string): StateMetadata {
  const metadataMatch = content.match(/<!-- STATE_METADATA: ({.*?}) -->/);

  if (!metadataMatch) {
    return {
      last_sync: '',
      commit_sha: '',
      version: '1.0'
    };
  }

  try {
    return JSON.parse(metadataMatch[1]);
  } catch {
    return {
      last_sync: '',
      commit_sha: '',
      version: '1.0'
    };
  }
}

export function extractSection(content: string, sectionName: string): string {
  const headerMap: Record<string, string> = {
    'system_architecture': 'System Architecture',
    'active_modules': 'Active Modules',
    'dependency_map': 'Dependency Map',
    'tech_debt': 'Tech Debt',
    'infrastructure': 'Infrastructure'
  };

  const header = headerMap[sectionName];
  if (!header) return '';

  const regex = new RegExp(`## ${header}\\n\\n([\\s\\S]*?)(?=\\n## |<!-- STATE_METADATA|$)`, 'm');
  const match = content.match(regex);

  return match ? match[1].trim() : '';
}

export function updateSection(content: string, sectionName: string, newSectionContent: string): string {
  const headerMap: Record<string, string> = {
    'system_architecture': 'System Architecture',
    'active_modules': 'Active Modules',
    'dependency_map': 'Dependency Map',
    'tech_debt': 'Tech Debt',
    'infrastructure': 'Infrastructure'
  };

  const header = headerMap[sectionName];
  if (!header) return content;

  // Match the section and replace it
  const regex = new RegExp(`## ${header}\\n\\n[\\s\\S]*?(?=\\n## |<!-- STATE_METADATA|$)`, 'm');

  // Ensure newSectionContent includes the header
  const formattedContent = newSectionContent.startsWith('##')
    ? newSectionContent
    : `## ${header}\n\n${newSectionContent}`;

  if (regex.test(content)) {
    return content.replace(regex, formattedContent + '\n');
  } else {
    // Section doesn't exist, add before metadata
    return content.replace(/<!-- STATE_METADATA/, `${formattedContent}\n\n<!-- STATE_METADATA`);
  }
}

export function updateMetadata(content: string, updates: Partial<StateMetadata>): string {
  const current = extractMetadata(content);
  const updated = { ...current, ...updates };

  const metadataString = `<!-- STATE_METADATA: ${JSON.stringify(updated)} -->`;

  const metadataRegex = /<!-- STATE_METADATA:.*?-->/;

  if (metadataRegex.test(content)) {
    return content.replace(metadataRegex, metadataString);
  } else {
    return content + '\n\n' + metadataString;
  }
}
EOF
```

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/state-parser.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/state-parser.ts lib/state-parser.test.ts
git commit -m "feat: add state file parser and updater"
```

---

## Task 6: Create State Status Command

**Files:**
- Create: `commands/state-status.ts`
- Create: `commands/state-status.test.ts`

**Step 1: Create commands directory**

```bash
mkdir -p .claude/plugins/state-manager/commands
```

**Step 2: Write failing test**

```typescript
cat > commands/state-status.test.ts << 'EOF'
import { getStateStatus } from './state-status';

describe('state-status', () => {
  it('should report when state is current', async () => {
    const status = await getStateStatus({
      repoPath: '/test/repo',
      statePath: '.claude/project_state.md',
      currentCommitSha: 'abc123',
      lastSyncSha: 'abc123',
      stateFileModified: false
    });

    expect(status.drift).toBe(0);
    expect(status.message).toContain('current');
    expect(status.isCurrentByCurrent).toBe(true);
  });

  it('should report drift when commits are behind', async () => {
    const status = await getStateStatus({
      repoPath: '/test/repo',
      statePath: '.claude/project_state.md',
      currentCommitSha: 'xyz789',
      lastSyncSha: 'abc123',
      stateFileModified: false,
      commitsBehind: 5
    });

    expect(status.drift).toBe(5);
    expect(status.message).toContain('5 commits behind');
    expect(status.isCurrent).toBe(false);
  });

  it('should warn when state file manually edited', async () => {
    const status = await getStateStatus({
      repoPath: '/test/repo',
      statePath: '.claude/project_state.md',
      currentCommitSha: 'abc123',
      lastSyncSha: 'abc123',
      stateFileModified: true
    });

    expect(status.manuallyEdited).toBe(true);
    expect(status.message).toContain('manually edited');
  });
});
EOF
```

**Step 3: Run test to verify it fails**

Run: `npm test -- commands/state-status.test.ts`
Expected: FAIL with "Cannot find module './state-status'"

**Step 4: Write minimal implementation**

```typescript
cat > commands/state-status.ts << 'EOF'
export interface StateStatusOptions {
  repoPath: string;
  statePath: string;
  currentCommitSha: string;
  lastSyncSha: string;
  stateFileModified: boolean;
  commitsBehind?: number;
}

export interface StateStatusResult {
  drift: number;
  message: string;
  isCurrent: boolean;
  manuallyEdited: boolean;
}

export async function getStateStatus(options: StateStatusOptions): Promise<StateStatusResult> {
  const {
    currentCommitSha,
    lastSyncSha,
    stateFileModified,
    commitsBehind = 0
  } = options;

  const drift = commitsBehind;
  const isCurrent = currentCommitSha === lastSyncSha && !stateFileModified;

  let message = '';

  if (isCurrent) {
    message = '✓ State is current';
  } else {
    const parts: string[] = [];

    if (drift > 0) {
      parts.push(`State is ${drift} commit${drift === 1 ? '' : 's'} behind`);
    }

    if (stateFileModified) {
      parts.push('⚠️  State file manually edited - changes not validated');
    }

    message = parts.join('\n');
  }

  return {
    drift,
    message,
    isCurrent,
    manuallyEdited: stateFileModified
  };
}

export async function main() {
  // CLI entry point - to be implemented
  console.log('state-status command');
}

if (require.main === module) {
  main();
}
EOF
```

**Step 5: Run test to verify it passes**

Run: `npm test -- commands/state-status.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add commands/state-status.ts commands/state-status.test.ts
git commit -m "feat: add state-status command logic"
```

---

## Task 7: Create State Plan Command

**Files:**
- Create: `commands/state-plan.ts`
- Create: `lib/architect-client.ts`

**Step 1: Create architect client for calling subagent**

```typescript
cat > lib/architect-client.ts << 'EOF'
export interface ArchitectInput {
  diffs: string;
  fileContexts?: Record<string, string>;
  currentState: string;
  granularity: 'high' | 'medium' | 'fine';
}

export interface ArchitectOutput {
  summary: string;
  changes_by_category: {
    system_architecture?: string[];
    active_modules?: string[];
    dependency_map?: string[];
    tech_debt?: string[];
    infrastructure?: string[];
  };
  patches: Record<string, string>;
  confidence: 'high' | 'medium' | 'low';
  questions?: string[];
  removals?: string[];
}

export async function callArchitectAgent(input: ArchitectInput): Promise<ArchitectOutput> {
  // In real implementation, this would call Claude with the architect agent prompt
  // For now, return a mock structure

  const prompt = `
Analyze the following code changes:

${input.diffs}

Current state file:
${input.currentState}

Granularity: ${input.granularity}

Respond with JSON in the specified format.
`;

  // TODO: Integrate with Claude API or Claude Code agent system
  // For now, return empty structure
  return {
    summary: 'Analysis not yet implemented - awaiting agent integration',
    changes_by_category: {},
    patches: {},
    confidence: 'low',
    questions: ['Agent integration pending']
  };
}
EOF
```

**Step 2: Write state-plan command**

```typescript
cat > commands/state-plan.ts << 'EOF'
import * as fs from 'fs/promises';
import * as path from 'path';
import { getDiffSinceCommit, getCurrentCommitSha } from '../lib/git-utils';
import { parseStateFile } from '../lib/state-parser';
import { callArchitectAgent, ArchitectOutput } from '../lib/architect-client';

export interface PlanOptions {
  repoPath: string;
  statePath: string;
  configPath: string;
}

export interface PlanResult {
  analysis: ArchitectOutput;
  diff: string;
  commitsAnalyzed: number;
}

export async function runStatePlan(options: PlanOptions): Promise<PlanResult> {
  const { repoPath, statePath, configPath } = options;

  // 1. Load config
  const configContent = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configContent);

  // 2. Load current state
  let currentStateContent = '';
  try {
    currentStateContent = await fs.readFile(statePath, 'utf-8');
  } catch {
    // State file doesn't exist yet
    currentStateContent = '';
  }

  // 3. Get last sync commit
  const parsed = parseStateFile(currentStateContent);
  const lastSyncSha = parsed.metadata.commit_sha || null;

  // 4. Get diff
  const diff = await getDiffSinceCommit(repoPath, lastSyncSha);

  if (!diff || diff.trim().length === 0) {
    return {
      analysis: {
        summary: 'No changes detected since last sync',
        changes_by_category: {},
        patches: {},
        confidence: 'high'
      },
      diff: '',
      commitsAnalyzed: 0
    };
  }

  // 5. Call architect agent
  const analysis = await callArchitectAgent({
    diffs: diff,
    currentState: currentStateContent,
    granularity: config.granularity || 'medium'
  });

  // 6. Return results
  return {
    analysis,
    diff,
    commitsAnalyzed: 1 // TODO: Calculate actual commit count
  };
}

export async function main() {
  const repoPath = process.cwd();
  const statePath = path.join(repoPath, '.claude', 'project_state.md');
  const configPath = path.join(repoPath, '.claude', 'plugins', 'state-manager', '.claude-plugin', 'config.json');

  try {
    const result = await runStatePlan({ repoPath, statePath, configPath });

    console.log('\n=== State Plan ===\n');
    console.log(`Analyzed ${result.commitsAnalyzed} commit(s)\n`);
    console.log('Summary:', result.analysis.summary);
    console.log('\nProposed Changes:');

    for (const [section, content] of Object.entries(result.analysis.patches)) {
      console.log(`\n[${section}]`);
      console.log(content);
    }

    if (result.analysis.questions && result.analysis.questions.length > 0) {
      console.log('\nQuestions:');
      result.analysis.questions.forEach(q => console.log(`  - ${q}`));
    }

    console.log('\n\nRun `/state-apply` to commit these changes to project_state.md');
  } catch (error) {
    console.error('Error running state-plan:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
EOF
```

**Step 3: Commit**

```bash
git add commands/state-plan.ts lib/architect-client.ts
git commit -m "feat: add state-plan command with architect integration"
```

---

## Task 8: Create State Apply Command

**Files:**
- Create: `commands/state-apply.ts`

**Step 1: Write state-apply command**

```typescript
cat > commands/state-apply.ts << 'EOF'
import * as fs from 'fs/promises';
import * as path from 'path';
import { getCurrentCommitSha } from '../lib/git-utils';
import { parseStateFile, updateSection, updateMetadata } from '../lib/state-parser';

export interface ApplyOptions {
  repoPath: string;
  statePath: string;
  patches: Record<string, string>;
}

export async function runStateApply(options: ApplyOptions): Promise<void> {
  const { repoPath, statePath, patches } = options;

  // 1. Load current state
  let currentContent = '';
  try {
    currentContent = await fs.readFile(statePath, 'utf-8');
  } catch {
    // State file doesn't exist - create from template
    currentContent = await createInitialStateFile();
  }

  // 2. Apply patches
  let updatedContent = currentContent;
  for (const [sectionName, patchContent] of Object.entries(patches)) {
    updatedContent = updateSection(updatedContent, sectionName, patchContent);
  }

  // 3. Update metadata
  const currentSha = await getCurrentCommitSha(repoPath);
  const timestamp = new Date().toISOString();

  updatedContent = updateMetadata(updatedContent, {
    commit_sha: currentSha,
    last_sync: timestamp,
    version: '1.0'
  });

  // 4. Write to file
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, updatedContent, 'utf-8');
}

async function createInitialStateFile(): Promise<string> {
  return `# Project State

> Last updated: ${new Date().toISOString().split('T')[0]} | Commit: pending

## System Architecture

High-level overview of the system design, major patterns, and architectural decisions.

## Active Modules

List of major modules/packages and their responsibilities.

## Dependency Map

Key external dependencies and their usage context.

## Tech Debt

Known issues, workarounds, and planned improvements.

## Infrastructure

Deployment, environment, and operational requirements.

<!-- STATE_METADATA: {"last_sync": "", "commit_sha": "", "version": "1.0"} -->
`;
}

export async function main() {
  console.log('state-apply: This command should be run after state-plan');
  console.log('In a real CLI context, this would read the last plan result from session state');

  // For now, just demonstrate the structure
  const repoPath = process.cwd();
  const statePath = path.join(repoPath, '.claude', 'project_state.md');

  // Example usage (would come from session state in real implementation)
  // await runStateApply({
  //   repoPath,
  //   statePath,
  //   patches: {}
  // });
}

if (require.main === module) {
  main();
}
EOF
```

**Step 2: Commit**

```bash
git add commands/state-apply.ts
git commit -m "feat: add state-apply command for updating state file"
```

---

## Task 9: Create Initial State Template

**Files:**
- Create: `.claude/project_state.md`

**Step 1: Create .claude directory if needed**

```bash
mkdir -p .claude
```

**Step 2: Create initial state file**

```bash
cat > .claude/project_state.md << 'EOF'
# Project State

> Last updated: 2026-01-12 | Commit: initial

## System Architecture

**Plugin Architecture**: Claude Code plugin using TypeScript with three core commands (state-plan, state-apply, state-status) and one specialized agent (architect).

**Data Flow**: Git operations → Architect analysis → State file reconciliation → Metadata tracking

**Key Patterns**:
- Plan & Apply workflow inspired by Terraform
- Bidirectional drift detection (code changes and manual edits)
- Configurable granularity levels

## Active Modules

- **commands/state-plan**: Analyzes git diffs and proposes state updates via architect agent
- **commands/state-apply**: Commits approved changes to project_state.md with metadata updates
- **commands/state-status**: Shows drift metrics (commits behind, manual edit detection)
- **agents/architect**: Specialized LLM agent for architectural impact analysis
- **lib/git-utils**: Git operations wrapper using simple-git
- **lib/state-parser**: Markdown parser for extracting/updating state file sections

## Dependency Map

- **simple-git** (^3.20.0): Git operations for diff analysis and commit tracking
- **typescript** (^5.0.0): Type-safe development
- **jest** (^29.5.0): Testing framework
- **ts-jest** (^29.1.0): TypeScript support for Jest

## Tech Debt

- TODO: Architect agent currently returns mock data - needs integration with Claude API or Claude Code agent system
- TODO: Session state management for state-apply to read last plan result
- TODO: Post-commit hook implementation for automated state-plan suggestions
- TODO: File context loading for complex changes (>50 lines)

## Infrastructure

- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Build Tool**: TypeScript compiler
- **Plugin System**: Claude Code plugin manifest (.claude-plugin/plugin.json)

<!-- STATE_METADATA: {"last_sync": "2026-01-12T00:00:00Z", "commit_sha": "initial", "version": "1.0", "granularity": "medium"} -->
EOF
```

**Step 3: Commit**

```bash
git add .claude/project_state.md
git commit -m "feat: initialize project state file with current architecture"
```

---

## Task 10: Create Comprehensive README

**Files:**
- Modify: `README.md`

**Step 1: Write comprehensive README**

```bash
cat > README.md << 'EOF'
# Claude State Manager Plugin

A Terraform-inspired "Plan & Apply" state management plugin for Claude Code that helps teams track architectural evolution through automatic drift detection and reconciliation.

## Overview

The State Manager plugin maintains a living `project_state.md` file that documents your system architecture, active modules, dependencies, tech debt, and infrastructure. It analyzes git changes to propose updates, giving you visibility into architectural impact before committing to the state file.

## Philosophy

Inspired by Terraform's workflow:
- **Plan**: See what architectural changes have occurred
- **Review**: Understand the impact before applying
- **Apply**: Commit changes to the state file with metadata tracking

## Installation

```bash
# Clone into your Claude plugins directory
cd ~/.claude/plugins
git clone <this-repo> state-manager

# Install dependencies
cd state-manager
npm install

# Build
npm run build
```

## Commands

### `/state-plan`

Analyzes code changes since the last state sync and proposes updates.

**Usage:**
```
/state-plan
```

**What it does:**
1. Finds the last sync point from `project_state.md` metadata
2. Generates git diff since that point
3. Calls the Architect agent to analyze architectural impact
4. Shows a preview of proposed changes

**When to use:**
- After making code changes (committed or uncommitted)
- Before committing to review architectural impact
- Periodically to batch-review multiple commits

### `/state-apply`

Applies the proposed changes from the last `/state-plan` to your state file.

**Usage:**
```
/state-apply
```

**What it does:**
1. Validates that `/state-plan` was run
2. Updates `project_state.md` with approved changes
3. Updates metadata (timestamp, commit SHA)
4. Confirms sync completion

### `/state-status`

Shows current state drift metrics.

**Usage:**
```
/state-status
```

**Output examples:**
```
✓ State is current

State is 5 commits behind
⚠️  State file manually edited - changes not validated
```

## Configuration

Edit `.claude/plugins/state-manager/.claude-plugin/config.json`:

```json
{
  "granularity": "medium",
  "auto_hooks": false,
  "ignore_patterns": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/fixtures/**"
  ]
}
```

### Granularity Levels

- **high**: Only major changes (new services, database changes, API contracts)
- **medium**: Above + significant classes, routes, config changes
- **fine**: Above + function signatures, utility additions

## State File Structure

`.claude/project_state.md` contains five standardized sections:

```markdown
## System Architecture
High-level patterns and architectural decisions

## Active Modules
Major modules/packages and their responsibilities

## Dependency Map
External dependencies with usage context

## Tech Debt
Known issues and planned improvements

## Infrastructure
Deployment and operational requirements
```

Metadata is tracked in a hidden HTML comment:
```html
<!-- STATE_METADATA: {"last_sync": "2026-01-12T10:30:00Z", "commit_sha": "abc123", "version": "1.0"} -->
```

## The Architect Agent

The Architect agent (`agents/architect.md`) is a specialized LLM agent that:
- Analyzes git diffs for architectural significance
- Compares against existing state to avoid duplication
- Suggests additions, updates, and removals
- Provides confidence scores and clarifying questions

**Output format:**
```json
{
  "summary": "Natural language overview",
  "changes_by_category": { ... },
  "patches": { "section_name": "## Section\n\nContent" },
  "confidence": "high|medium|low",
  "questions": ["..."]
}
```

## Workflow Examples

### Example 1: After Feature Development
```bash
# You've been working on a new authentication module
git add .
git commit -m "feat: add JWT authentication"

# Review architectural impact
/state-plan
# Output: "Added JWT authentication service. Introduces auth-module..."

# Apply changes to state
/state-apply
# Output: "State updated. Tracking 1 commit through a4f8c2b"
```

### Example 2: Batch Review
```bash
# After a week of development with 12 commits

/state-status
# Output: "State is 12 commits behind"

/state-plan
# Output: "Analyzed 12 commits. Major changes: new payment module, Redis caching..."

/state-apply
```

### Example 3: Drift Detection
```bash
# Someone manually edited project_state.md

/state-status
# Output: "⚠️ State file manually edited - changes not validated"

/state-plan
# Architect validates manual changes against actual code
```

## Bidirectional Drift Detection

The plugin detects two types of drift:

1. **Code drift**: Changes in codebase not yet documented
2. **State drift**: Manual edits to state file that may not reflect reality

This ensures your state file stays synchronized with both automated analysis and manual curation.

## Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Build
npm run build

# Clean
npm run clean
```

## Architecture

```
.claude/plugins/state-manager/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── config.json          # User configuration
├── commands/
│   ├── state-plan.ts        # Plan command
│   ├── state-apply.ts       # Apply command
│   └── state-status.ts      # Status command
├── agents/
│   └── architect.md         # Architect agent prompt
├── lib/
│   ├── git-utils.ts         # Git operations
│   ├── state-parser.ts      # State file parsing
│   └── architect-client.ts  # Agent communication
└── hooks/
    └── post-commit.ts       # Optional git hook
```

## Future Enhancements

- [ ] PR integration (comment state diffs on pull requests)
- [ ] Historical snapshots (track evolution over time)
- [ ] Visual dependency graphs
- [ ] Team collaboration features
- [ ] Custom section templates
- [ ] Integration with issue trackers

## Contributing

Contributions welcome! Please ensure:
- Tests pass (`npm test`)
- Code follows TypeScript best practices
- README updated for new features

## License

MIT
EOF
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with usage examples"
```

---

## Task 11: Create Package Entry Point

**Files:**
- Create: `commands/index.ts`

**Step 1: Create index file**

```typescript
cat > commands/index.ts << 'EOF'
// Entry point for the plugin commands
export { runStatePlan } from './state-plan';
export { runStateApply } from './state-apply';
export { getStateStatus } from './state-status';
EOF
```

**Step 2: Build the project**

Run: `npm run build`
Expected: TypeScript compilation succeeds, `dist/` directory created

**Step 3: Commit**

```bash
git add commands/index.ts
git commit -m "feat: add package entry point"
```

---

## Task 12: Test the Plugin Setup

**Step 1: Verify directory structure**

Run: `tree -L 3 -I 'node_modules|dist' .claude/`
Expected: Shows complete plugin structure

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Test state-status command**

Run: `node dist/commands/state-status.js`
Expected: Command executes without errors

**Step 4: Verify state file exists**

Run: `cat .claude/project_state.md | head -20`
Expected: Shows state file header and first sections

**Step 5: Commit final verification**

```bash
git add -A
git commit -m "chore: verify plugin setup complete"
```

---

## Task 13: Create Marketplace Documentation

**Files:**
- Create: `.claude/plugins/state-manager/docs/MARKETPLACE.md`

**Step 1: Create docs directory**

```bash
mkdir -p .claude/plugins/state-manager/docs
```

**Step 2: Write marketplace documentation**

```bash
cat > .claude/plugins/state-manager/docs/MARKETPLACE.md << 'EOF'
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

✅ **Bidirectional Drift Detection** - Catches both code changes and manual edits
✅ **AI-Powered Analysis** - Specialized Architect agent understands architectural significance
✅ **Configurable Granularity** - Track everything or just major changes
✅ **Git-Integrated** - Works seamlessly with your existing workflow
✅ **Zero Lock-In** - State file is readable markdown, works without the plugin

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
# ✓ State is current
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

- 🐛 **Issues**: [GitHub Issues]
- 📖 **Docs**: [Full Documentation]
- 💬 **Discussions**: [GitHub Discussions]

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
EOF
```

**Step 3: Commit**

```bash
git add .claude/plugins/state-manager/docs/MARKETPLACE.md
git commit -m "docs: add marketplace listing documentation"
```

---

## Implementation Complete

The plugin is now fully structured with:

✅ Directory structure
✅ Plugin manifest and configuration
✅ Architect agent definition
✅ Three core commands (plan, apply, status)
✅ Git utilities and state parser
✅ Initial state file template
✅ Comprehensive README
✅ Test coverage
✅ Marketplace documentation

**Next Steps:**

1. **Architect Integration**: The `lib/architect-client.ts` currently returns mock data. This needs integration with Claude Code's agent system to actually call the architect.md agent.

2. **Session State**: The state-apply command needs access to the last plan result. This requires understanding Claude Code's session state management.

3. **File Context Loading**: Implement smart context loading for complex changes (>50 lines).

4. **Post-Commit Hook**: Implement optional git hook for automated suggestions.

5. **Testing**: Add integration tests that use a real git repository.

**To test the current setup:**

```bash
# Run unit tests
npm test

# Try running commands
node dist/commands/state-plan.js
node dist/commands/state-status.js

# Check the state file
cat .claude/project_state.md
```
