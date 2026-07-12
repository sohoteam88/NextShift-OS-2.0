import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import { projectAdaptiveJourney } from '@/modules/journey-engine/journey-engine-service';
import type { BottleneckResult, MissionBottleneck } from '@/modules/mission-engine/contracts/MissionAuthority';
import {
  missionEngineAuthorityService,
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

function createRuntimeResolver(authority = sampleAuthority()) {
  const resolveAuthority = vi.fn().mockResolvedValue(authority);
  const resolveRuntimeAuthority: typeof resolveMissionRuntimeAuthority = (input) =>
    resolveMissionRuntimeAuthority(input, { resolveAuthority });

  return { authority, resolveAuthority, resolveRuntimeAuthority };
}

afterEach(() => {
  setRuntimeMissionFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('Mission engine runtime callsite', () => {
  it('keeps getCurrentMission response shape unchanged when the runtime mission flag is OFF', async () => {
    setRuntimeMissionFlag('false');
    const runtimeMetadata: MissionRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const authority = await missionEngineAuthorityService.getCurrentMission('user_1', {}, {
      resolveRuntimeAuthority: runtimeResolver.resolveRuntimeAuthority,
      onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
    });

    expect(authority).toBe(runtimeResolver.authority);
    expect(authority).not.toHaveProperty('runtime');
    expect(runtimeResolver.resolveAuthority).toHaveBeenCalledWith({
      userId: 'user_1',
      source: 'authority-service',
    });
    expect(runtimeMetadata).toEqual([{
      enabled: false,
      mode: 'legacy',
      source: 'authority-service',
      fallback: false,
      confidence: 'derived',
    }]);
  });

  it('routes getCurrentMission through the Mission Runtime Adapter when the flag is ON', async () => {
    setRuntimeMissionFlag('true');
    const runtimeMetadata: MissionRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const authority = await missionEngineAuthorityService.getCurrentMission('user_1', {}, {
      resolveRuntimeAuthority: runtimeResolver.resolveRuntimeAuthority,
      onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
      source: 'dashboard',
    });

    expect(authority).toBe(runtimeResolver.authority);
    expect(authority).not.toHaveProperty('runtime');
    expect(runtimeMetadata).toHaveLength(1);
    expect(runtimeMetadata[0]).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'dashboard',
      fallback: false,
      confidence: 'derived',
      capabilityId: 'mission.authority.resolve',
      eventType: 'runtime.mission.authority.active',
      diagnosticsStatus: 'healthy',
    });
    expect(runtimeMetadata[0]?.contextId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]?.correlationId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]).not.toHaveProperty('tenantId');
    expect(runtimeMetadata[0]).not.toHaveProperty('userId');
  });
});
