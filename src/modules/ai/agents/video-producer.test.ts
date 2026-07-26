import { beforeEach, describe, expect, it, vi } from 'vitest';

const videoProjectMocks = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock('@/modules/video/services/video-project-service', () => ({
  videoProjectService: videoProjectMocks,
}));

import { executeVideoProducer } from './video-producer';

const input = {
  agentId: 'video_producer' as const,
  userId: 'user-1',
  tenantId: 'tenant-1',
  objective: 'Review video output',
};

describe('video producer agent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the canonical video project pipeline for its report', async () => {
    videoProjectMocks.list.mockResolvedValue([{ id: 'project-1', status: 'scripted' }]);

    const report = await executeVideoProducer(input);

    expect(videoProjectMocks.list).toHaveBeenCalledWith({ id: 'user-1', tenantId: 'tenant-1' });
    expect(report).toMatchObject({
      confidenceScore: 75,
      findings: expect.arrayContaining(['已有视频项目 (状态: scripted)']),
      actions: expect.arrayContaining([expect.objectContaining({ route: '/video?view=production' })]),
    });
  });
});
