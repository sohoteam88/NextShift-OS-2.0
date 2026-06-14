import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetAgents = vi.hoisted(() => ({
  getAgent: vi.fn(), getAgentsForPlan: vi.fn(), getAgentsForMissionStage: vi.fn(),
}));
const mockRegistry = vi.hoisted(() => ({ AGENT_REGISTRY: {} }));

vi.mock('@/modules/ai/services/agent-registry', () => ({
  getAgent: mockGetAgents.getAgent,
  getAgentsForPlan: mockGetAgents.getAgentsForPlan,
  getAgentsForMissionStage: mockGetAgents.getAgentsForMissionStage,
}));

import { agentManager } from '@/modules/ai/services/agent-manager';

describe('agentManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAgents.getAgent.mockReturnValue({ id: 'brand_strategist', name: 'Brand Strategist', description: '', capabilities: [], allowedActions: [], requiredFeatures: [], requiredPlan: 'starter', dependencies: [], emoji: '🧠' });
    mockGetAgents.getAgentsForPlan.mockReturnValue([{ id: 'brand_strategist', name: 'Brand Strategist', description: '', capabilities: [], allowedActions: [], requiredFeatures: [], requiredPlan: 'starter', dependencies: [], emoji: '🧠' }]);
    mockGetAgents.getAgentsForMissionStage.mockReturnValue(['brand_strategist']);
  });

  // ── getAvailableAgents ──
  describe('getAvailableAgents', () => {
    it('returns agents for a given plan', async () => {
      const agents = await agentManager.getAvailableAgents('pro');
      expect(mockGetAgents.getAgentsForPlan).toHaveBeenCalledWith('pro');
      expect(agents).toHaveLength(1);
    });
  });

  // ── getRecommendedAgents ──
  describe('getRecommendedAgents', () => {
    it('intersects mission stage agents with plan availability', async () => {
      const ids = await agentManager.getRecommendedAgents('brand_discovery', 'starter');
      expect(ids).toContain('brand_strategist');
    });
  });

  // ── getWorkforceState ──
  describe('getWorkforceState', () => {
    it('returns workforce health score', async () => {
      const state = await agentManager.getWorkforceState('u1', 't1', 'pro', 'brand_discovery');
      expect(state.health).toBeDefined();
      expect(state.available).toHaveLength(1);
    });

    it('returns optimal for pro plan with many agents', async () => {
      mockGetAgents.getAgentsForPlan.mockReturnValue([
        { id: 'brand_strategist' }, { id: 'content_director' }, { id: 'video_producer' },
        { id: 'funnel_architect' }, { id: 'traffic_strategist' },
      ].map(a => ({ ...a, name: '', description: '', capabilities: [], allowedActions: [], requiredFeatures: [], requiredPlan: 'pro', dependencies: [], emoji: '' })) as any);
      const state = await agentManager.getWorkforceState('u1', 't1', 'pro', 'brand_discovery');
      expect(state.health).toBe('optimal');
    });
  });
});
