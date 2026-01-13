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
