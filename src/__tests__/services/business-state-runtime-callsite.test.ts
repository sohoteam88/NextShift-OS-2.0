import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import {
  resolveBusinessStateRuntime,
  type BusinessStateRuntimeMetadata,
} from '@/modules/business-state/runtime';

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE;

function setRuntimeBusinessStateFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE = value;
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

function createRuntimeResolver(state = businessState()) {
  const resolveBusinessState = vi.fn().mockResolvedValue(state);
  const resolveRuntimeBusinessState: typeof resolveBusinessStateRuntime = (input) =>
    resolveBusinessStateRuntime(input, { resolveBusinessState });

  return { state, resolveBusinessState, resolveRuntimeBusinessState };
}

afterEach(() => {
  setRuntimeBusinessStateFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('Business state runtime callsite', () => {
  it('keeps getBusinessState response shape unchanged when the runtime business-state flag is OFF', async () => {
    setRuntimeBusinessStateFlag(undefined);
    const runtimeMetadata: BusinessStateRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const state = await businessStateService.getBusinessState('user_1', {
      resolveRuntimeBusinessState: runtimeResolver.resolveRuntimeBusinessState,
      onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
    });

    expect(state).toBe(runtimeResolver.state);
    expect(state).not.toHaveProperty('runtime');
    expect(runtimeResolver.resolveBusinessState).toHaveBeenCalledWith({
      userId: 'user_1',
      source: 'business-state-service',
    });
    expect(runtimeMetadata).toEqual([{
      enabled: false,
      mode: 'legacy',
      source: 'business-state-service',
      fallback: false,
      confidence: 'derived',
    }]);
  });

  it('routes getBusinessState through the Business State Runtime Adapter when the flag is ON', async () => {
    setRuntimeBusinessStateFlag('true');
    const runtimeMetadata: BusinessStateRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const state = await businessStateService.getBusinessState('user_1', {
      resolveRuntimeBusinessState: runtimeResolver.resolveRuntimeBusinessState,
      onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
      source: 'command-center',
    });

    expect(state).toBe(runtimeResolver.state);
    expect(state).not.toHaveProperty('runtime');
    expect(runtimeMetadata).toHaveLength(1);
    expect(runtimeMetadata[0]).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'command-center',
      fallback: false,
      confidence: 'derived',
      capabilityId: 'business-state.resolve',
      eventType: 'runtime.business-state.brand-foundation',
      diagnosticsStatus: 'healthy',
    });
    expect(runtimeMetadata[0]?.contextId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]?.correlationId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]).not.toHaveProperty('tenantId');
    expect(runtimeMetadata[0]).not.toHaveProperty('userId');
  });
});
