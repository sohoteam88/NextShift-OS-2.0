import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  requireAuthApi: vi.fn(),
}));

const missionMocks = vi.hoisted(() => ({
  missionEngineAuthorityService: {
    getCurrentMission: vi.fn(),
  },
}));

const businessStateMocks = vi.hoisted(() => ({
  businessStateService: {
    getBusinessState: vi.fn(),
  },
}));

const analyticsMocks = vi.hoisted(() => ({
  resolveAnalyticsRuntimeProjection: vi.fn(),
}));

const revenueMocks = vi.hoisted(() => ({
  resolveRevenueRuntimeIntent: vi.fn(),
}));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);
vi.mock('@/modules/mission-engine/services/MissionEngineAuthorityService', () => missionMocks);
vi.mock('@/modules/business-state/services/BusinessStateService', () => businessStateMocks);
vi.mock('@/modules/analytics/runtime', () => analyticsMocks);
vi.mock('@/modules/revenue-drivers/runtime', () => revenueMocks);

import { GET } from '@/app/api/v1/dashboard/recommendation/route';

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER;

function setCommandCenterFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER = value;
}

describe('dashboard recommendation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCommandCenterFlag(ORIGINAL_FLAG);
    authMocks.requireAuthApi.mockResolvedValue({
      id: 'user_1',
      tenantId: 'tenant_1',
      email: 'user@example.com',
      role: 'member',
      status: 'active',
    });
    missionMocks.missionEngineAuthorityService.getCurrentMission.mockResolvedValue(mission());
    businessStateMocks.businessStateService.getBusinessState.mockResolvedValue(businessState());
    analyticsMocks.resolveAnalyticsRuntimeProjection.mockResolvedValue(analyticsOutput());
    revenueMocks.resolveRevenueRuntimeIntent.mockReturnValue(revenueOutput());
  });

  it('returns null when the Command Center flag is OFF', async () => {
    setCommandCenterFlag(undefined);

    const response = await GET(request() as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: null });
    expect(missionMocks.missionEngineAuthorityService.getCurrentMission).not.toHaveBeenCalled();
    expect(analyticsMocks.resolveAnalyticsRuntimeProjection).not.toHaveBeenCalled();
    expect(revenueMocks.resolveRevenueRuntimeIntent).not.toHaveBeenCalled();
  });

  it('returns a recommendation structure when the Command Center flag is ON', async () => {
    setCommandCenterFlag('true');

    const response = await GET(request() as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      recommendation: {
        id: 'command-center-engine-next-action',
        title: 'Convert the next qualified lead',
        route: '/sales',
      },
      source: 'engine',
    });
    expect(body.data.confidence).toEqual(expect.any(Number));
    expect(body.data.explain).toEqual(expect.any(String));
  });
});

function request() {
  return new Request('https://example.com/api/v1/dashboard/recommendation', {
    method: 'GET',
  });
}

function mission() {
  return {
    currentMission: {
      id: 'MISSION_CONVERT_LEAD',
      title: 'Convert the next qualified lead',
      description: 'Focus on the current bottleneck.',
      route: '/sales',
    },
    priorityAction: {
      missionType: 'CUSTOMERS',
      title: 'Convert the next qualified lead',
      route: '/sales',
      ctaLabel: 'Open Sales',
      priority: 'High',
    },
    priorityResult: {
      priorityAction: 'Convert the next qualified lead',
      priorityReason: 'Resolve the active bottleneck.',
      expectedImpact: 'Move the business to the next state.',
      urgency: 'High',
      confidence: 0.82,
      category: 'CONVERSION',
      missionType: 'CUSTOMERS',
      route: '/sales',
      ctaLabel: 'Open Sales',
    },
    explainability: {
      whyThis: 'This is the highest leverage action.',
      whyNow: 'The current signals point to this action today.',
    },
    bottleneck: 'NO_CONVERSION',
    bottleneckResult: {
      confidence: 0.82,
    },
    missionPlan: {
      missionType: 'CUSTOMERS',
    },
  };
}

function businessState() {
  return {
    stage: 'customer_acquisition',
    readiness: {
      percentage: 80,
    },
    bottlenecks: [],
    opportunities: [{
      title: 'Convert a qualified lead',
    }],
    stateResult: {
      currentState: 'SALES',
      completedStates: ['BRAND_FOUNDATION', 'BRAND_POSITIONING'],
      missingRequirements: [],
      nextState: 'TEAM_BUILDING',
      readinessScore: 80,
    },
  };
}

function analyticsOutput() {
  return {
    projection: {
      readiness: { value: 80, stage: 'customer_acquisition', bottleneckCount: 0 },
      progress: {
        value: 65,
        stage: 'sales',
        nextAction: {
          title: 'Convert qualified lead',
          description: 'Follow up with the highest intent lead.',
          route: '/sales',
        },
      },
      growth: { value: 55, health: 'medium', recommendationCount: 1 },
    },
    runtime: {},
  };
}

function revenueOutput() {
  return {
    resolution: {
      status: 'resolved',
    },
    runtime: {},
  };
}
