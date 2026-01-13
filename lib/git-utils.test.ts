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
