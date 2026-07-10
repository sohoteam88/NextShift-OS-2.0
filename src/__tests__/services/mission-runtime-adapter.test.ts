import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import { projectAdaptiveJourney } from '@/modules/journey-engine/journey-engine-service';
import type { BottleneckResult, MissionBottleneck } from '@/modules/mission-engine/contracts/MissionAuthority';
import {
  resolveMissionAuthorityFromJourney,
} from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import {
  resolveMissionRuntimeAuthority,
  type MissionRuntimeMetadata,
} from '@/modules/mission-engine/runtime';

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_RUNTIME_MISSION;

function setRuntimeMissionFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_RUNTIME_MISSION;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_RUNTIME_MISSION = value;
}

function businessState(): BusinessState {
  return {
    stage: 'foundation',
    readiness: {
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      score: 50,
      maxScore: 100,
      percentage: 50,
    },
    bottlenecks: [],
    opportunities: [],
    stateResult: {
      currentState: 'BRAND_FOUNDATION',
      completedStates: [],
      missingRequirements: ['AI Interview Completed'],
      nextState: 'BRAND_POSITIONING',
      readinessScore: 50,
      explainability: {
        completed: [],
        missing: [{ id: 'interviewCompleted', label: 'AI Interview Completed', completed: false }],
        reason: 'Business profile incomplete.',
      },
    },
  };
}

function interview(): InterviewAuthorityProjection {
  return {
    source: 'InterviewAuthorityProjection',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    businessMode: 'retail',
    experienceLevel: 'beginner',
    offerStatus: 'missing',
    audienceStatus: 'defined',
    contentReadiness: 40,
    trafficReadiness: 30,
    revenueStatus: 'none',
    primaryOffer: '',
    revenueModel: '',
    primaryGrowthChannel: '',
    brandArchetype: 'operator',
    personalStoryVector: [],
    authorityScore: 40,
    readinessScore: 50,
    recommendedJourney: 'retail',
    recommendedMission: 'MISSION_005',
  };
}

function bottleneckResult(bottleneck: MissionBottleneck): BottleneckResult {
  return {
    bottleneck,
    confidence: 80,
    evidence: [`bottleneck=${bottleneck}`],
    severity: 'High',
    explainability: '',
  };
}

function sampleAuthority() {
  return resolveMissionAuthorityFromJourney(projectAdaptiveJourney({
    businessState: businessState(),
    interview: interview(),
    completedChecks: [
      'registered',
      'approved',
      'brand_discovery_completed',
      'brand_dna_confirmed',
      'first_content_generated',
    ],
  }), undefined, bottleneckResult('NO_LEAD_MAGNET'), { locale: 'zh' });
}

function createAuthorityResolver() {
  const authority = sampleAuthority();
  return {
    authority,
    resolveAuthority: vi.fn().mockResolvedValue(authority),
  };
}

afterEach(() => {
  setRuntimeMissionFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('MissionRuntimeAdapter', () => {
  it('keeps the legacy path when the runtime mission flag is OFF', async () => {
    setRuntimeMissionFlag(undefined);
    const { authority, resolveAuthority } = createAuthorityResolver();

    const output = await resolveMissionRuntimeAuthority({
      userId: 'user_1',
      source: 'authority-service',
    }, {
      resolveAuthority,
    });

    expect(resolveAuthority).toHaveBeenCalledWith({
      userId: 'user_1',
      source: 'authority-service',
    });
    expect(output.authority).toBe(authority);
    expect(output.runtime).toEqual({
      enabled: false,
      mode: 'legacy',
      source: 'authority-service',
      fallback: false,
      confidence: 'derived',
    });
  });

  it.each(['false', 'FALSE', 'True', '1', '0', ''])(
    'treats %s as flag OFF',
    async (flagValue) => {
      setRuntimeMissionFlag(flagValue);

      const output = await resolveMissionRuntimeAuthority({
        userId: 'user_1',
        source: 'api',
      }, {
        resolveAuthority: createAuthorityResolver().resolveAuthority,
      });

      expect(output.runtime).toMatchObject({
        enabled: false,
        mode: 'legacy',
        fallback: false,
      });
      expect(output.runtime.contextId).toBeUndefined();
      expect(output.runtime.correlationId).toBeUndefined();
    },
  );

  it('creates runtime metadata when the runtime mission flag is ON', async () => {
    setRuntimeMissionFlag('true');
    const { authority, resolveAuthority } = createAuthorityResolver();

    const output = await resolveMissionRuntimeAuthority({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'dashboard',
    }, {
      resolveAuthority,
    });

    expect(output.authority).toBe(authority);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'dashboard',
      fallback: false,
      confidence: 'derived',
      capabilityId: 'mission.authority.resolve',
      eventType: 'runtime.mission.authority.active',
      diagnosticsStatus: 'healthy',
    });
    expect(output.runtime.contextId).toEqual(expect.any(String));
    expect(output.runtime.correlationId).toEqual(expect.any(String));
    expect(output.runtime.capabilityRuntimeId).toEqual(expect.any(String));
    expect(output.runtime.eventId).toEqual(expect.any(String));
    expect(output.runtime.diagnosticsId).toEqual(expect.any(String));
  });

  it('falls back to legacy mission authority when runtime construction throws', async () => {
    const warn = vi.fn();
    const { authority, resolveAuthority } = createAuthorityResolver();

    const output = await resolveMissionRuntimeAuthority({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'dashboard',
    }, {
      isEnabled: () => true,
      resolveAuthority,
      createRuntimeArtifacts: () => {
        throw new Error('runtime unavailable for tenant_1 user_1');
      },
      logger: { warn },
    });

    expect(output.authority).toBe(authority);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'legacy',
      source: 'dashboard',
      fallback: true,
      confidence: 'fallback',
      diagnosticsStatus: 'degraded',
      warning: 'runtime-mission-adapter-fallback',
      errorKind: 'Error',
    });
    expect(warn).toHaveBeenCalledWith(
      '[mission-runtime-adapter] falling back to legacy authority resolver',
      expect.objectContaining({
        warning: 'runtime-mission-adapter-fallback',
        errorKind: 'Error',
        source: 'dashboard',
        missionId: 'MISSION_005',
        missionLifecycle: 'ACTIVE',
        businessStage: 'LEAD_MAGNET',
        bottleneck: 'NO_LEAD_MAGNET',
        confidence: 'derived',
      }),
    );
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('tenantId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('userId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('message');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('stack');
    expect(JSON.stringify(warn.mock.calls[0]?.[1])).not.toContain('runtime unavailable');
  });

  it('returns safe UI-facing runtime metadata without tenantId or userId', async () => {
    const output = await resolveMissionRuntimeAuthority({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'api',
    }, {
      isEnabled: () => true,
      resolveAuthority: createAuthorityResolver().resolveAuthority,
    });
    const metadataKeys = Object.keys(output.runtime as MissionRuntimeMetadata);
    const forbiddenKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'api',
      fallback: false,
      confidence: 'derived',
    });
    expect(output.runtime).not.toHaveProperty('tenantId');
    expect(output.runtime).not.toHaveProperty('userId');
    expect(metadataKeys.some((key) => forbiddenKeyPattern.test(key))).toBe(false);
  });
});
