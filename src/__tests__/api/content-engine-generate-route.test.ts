import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const authMocks = vi.hoisted(() => ({ requireAuthApi: vi.fn() }));
const rateLimitMocks = vi.hoisted(() => ({
  sharedAiRateLimitGuard: vi.fn(),
  runWithAiRateLimitRefunds: vi.fn(),
  refundAiRateLimits: vi.fn(),
}));
const contentEngineMocks = vi.hoisted(() => ({
  generatePlatformPost: vi.fn(),
}));
const missionMocks = vi.hoisted(() => ({ notifyMissionProgress: vi.fn() }));
const workspaceMocks = vi.hoisted(() => ({
  resolveRequestWorkspaceContext: vi.fn(),
}));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);
vi.mock('@/lib/ai-rate-limit', () => rateLimitMocks);
vi.mock('@/modules/content-engine/contentEngineService', () => ({
  contentEngineService: contentEngineMocks,
}));
vi.mock('@/modules/mission/utils/complete-mission', () => missionMocks);
vi.mock('@/modules/workspace/request-workspace-context', () => workspaceMocks);

import { POST } from '@/app/api/v1/content-engine/generate/route';

const user = {
  id: '4e6a3c0e-bf73-49de-a4c9-24589f3c4425',
  tenantId: '7e051fa7-56cf-4995-89fa-eea7f6cc8936',
  email: 'member@example.test',
  role: 'member',
  status: 'active',
};

describe('content engine generate API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAuthApi.mockResolvedValue(user);
    rateLimitMocks.sharedAiRateLimitGuard.mockResolvedValue(undefined);
    rateLimitMocks.runWithAiRateLimitRefunds.mockImplementation(
      (callback: () => Promise<Response>) => callback(),
    );
    workspaceMocks.resolveRequestWorkspaceContext.mockResolvedValue(undefined);
    contentEngineMocks.generatePlatformPost.mockResolvedValue({
      id: 'generated-id',
    });
    missionMocks.notifyMissionProgress.mockResolvedValue(undefined);
  });

  it('forwards a valid target draft ID to the service', async () => {
    const targetContentId = 'c5b64d0e-b20a-4f96-ae47-74a5732b62c1';
    const response = await postGenerate({ targetContentId });

    expect(response.status).toBe(200);
    expect(contentEngineMocks.generatePlatformPost).toHaveBeenCalledWith(
      user.id,
      user.tenantId,
      'facebook',
      'text_post',
      'awareness',
      undefined,
      undefined,
      targetContentId,
    );
  });

  it('rejects an invalid target content ID before calling the service', async () => {
    const response = await postGenerate({ targetContentId: 'not-a-uuid' });

    expect(response.status).toBe(400);
    expect(contentEngineMocks.generatePlatformPost).not.toHaveBeenCalled();
  });
});

function postGenerate(overrides: Record<string, unknown>) {
  return POST(
    new NextRequest('https://example.test/api/v1/content-engine/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'facebook',
        format: 'text_post',
        funnelStage: 'awareness',
        ...overrides,
      }),
    }),
  );
}
