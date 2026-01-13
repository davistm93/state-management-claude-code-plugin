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
    expect(status.isCurrent).toBe(true);
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
