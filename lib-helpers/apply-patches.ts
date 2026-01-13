#!/usr/bin/env node
/**
 * Bridge script: Apply patches to state file
 * Usage: apply-patches.ts <state-path> <patches-json>
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { updateSection, updateMetadata } from '../lib/state-parser';
import { getCurrentCommitSha } from '../lib/git-utils';

function createInitialState(): string {
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

async function main() {
  try {
    const statePath = process.argv[2];
    const patchesJson = process.argv[3];

    if (!statePath || !patchesJson) {
      throw new Error('Usage: apply-patches.ts <state-path> <patches-json>');
    }

    const patches = JSON.parse(patchesJson);
    const repoPath = process.cwd();

    // Load current state (or create new)
    let currentContent = '';
    try {
      currentContent = await fs.readFile(statePath, 'utf-8');
    } catch {
      currentContent = createInitialState();
    }

    // Apply patches
    let updatedContent = currentContent;
    for (const [sectionName, patchContent] of Object.entries(patches)) {
      updatedContent = updateSection(updatedContent, sectionName, patchContent as string);
    }

    // Update metadata
    const currentSha = await getCurrentCommitSha(repoPath);
    const timestamp = new Date().toISOString();

    updatedContent = updateMetadata(updatedContent, {
      commit_sha: currentSha,
      last_sync: timestamp,
      version: '1.0'
    });

    // Write file
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, updatedContent, 'utf-8');

    console.log(JSON.stringify({
      success: true,
      sha: currentSha,
      timestamp
    }, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message || String(error) }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
