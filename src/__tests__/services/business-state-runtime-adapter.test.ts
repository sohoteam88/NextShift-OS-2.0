import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
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
    bottlenecks: [{
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      code: 'BRAND_FOUNDATION_INCOMPLETE',
      title: 'Brand foundation incomplete',
      description: 'Business profile is incomplete.',
      severity: 'high',
      domain: 'brand',
    }],
    opportunities: [{
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      code: 'CLARIFY_POSITIONING',
      title: 'Clarify positioning',
      description: 'Complete the business foundation first.',
      impact: 'high',
      domain: 'brand',
    }],
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

function createBusinessStateResolver() {
  const state = businessState();
  return {
    state,
    resolveBusinessState: vi.fn().mockResolvedValue(state),
  };
}

afterEach(() => {
  setRuntimeBusinessStateFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('BusinessStateRuntimeAdapter', () => {
  it('keeps the legacy path when the runtime business-state flag is OFF', async () => {
    setRuntimeBusinessStateFlag(undefined);
    const { state, resolveBusinessState } = createBusinessStateResolver();

    const output = await resolveBusinessStateRuntime({
      userId: 'user_1',
      source: 'business-state-service',
    }, {
      resolveBusinessState,
    });

    expect(resolveBusinessState).toHaveBeenCalledWith({
      userId: 'user_1',
      source: 'business-state-service',
    });
    expect(output.state).toBe(state);
    expect(output.runtime).toEqual({
      enabled: false,
      mode: 'legacy',
      source: 'business-state-service',
      fallback: false,
      confidence: 'derived',
    });
  });

  it.each(['false', 'FALSE', 'True', '1', '0', ''])(
    'treats %s as flag OFF',
    async (flagValue) => {
      setRuntimeBusinessStateFlag(flagValue);

      const output = await resolveBusinessStateRuntime({
        userId: 'user_1',
        source: 'command-center',
      }, {
        resolveBusinessState: createBusinessStateResolver().resolveBusinessState,
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

  it('creates runtime metadata when the runtime business-state flag is ON', async () => {
    setRuntimeBusinessStateFlag('true');
    const { state, resolveBusinessState } = createBusinessStateResolver();

    const output = await resolveBusinessStateRuntime({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'command-center',
    }, {
      resolveBusinessState,
    });

    expect(output.state).toBe(state);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'command-center',
      fallback: false,
      confidence: 'derived',
      capabilityId: 'business-state.resolve',
      eventType: 'runtime.business-state.brand-foundation',
      diagnosticsStatus: 'healthy',
    });
    expect(output.runtime.contextId).toEqual(expect.any(String));
    expect(output.runtime.correlationId).toEqual(expect.any(String));
    expect(output.runtime.capabilityRuntimeId).toEqual(expect.any(String));
    expect(output.runtime.eventId).toEqual(expect.any(String));
    expect(output.runtime.diagnosticsId).toEqual(expect.any(String));
  });

  it('falls back to legacy business state when runtime construction throws', async () => {
    const warn = vi.fn();
    const { state, resolveBusinessState } = createBusinessStateResolver();

    const output = await resolveBusinessStateRuntime({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'mission-engine',
    }, {
      isEnabled: () => true,
      resolveBusinessState,
      createRuntimeArtifacts: () => {
        throw new Error('runtime unavailable for tenant_1 user_1');
      },
      logger: { warn },
    });

    expect(output.state).toBe(state);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'legacy',
      source: 'mission-engine',
      fallback: true,
      confidence: 'fallback',
      diagnosticsStatus: 'degraded',
      warning: 'runtime-business-state-adapter-fallback',
      errorKind: 'Error',
    });
    expect(warn).toHaveBeenCalledWith(
      '[business-state-runtime-adapter] falling back to legacy business-state resolver',
      expect.objectContaining({
        warning: 'runtime-business-state-adapter-fallback',
        errorKind: 'Error',
        source: 'mission-engine',
        stage: 'foundation',
        currentState: 'BRAND_FOUNDATION',
        nextState: 'BRAND_POSITIONING',
        readinessScore: 50,
        readinessConfidence: 'derived',
        bottleneckCount: 1,
        opportunityCount: 1,
      }),
    );
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('tenantId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('userId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('message');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('stack');
    expect(JSON.stringify(warn.mock.calls[0]?.[1])).not.toContain('runtime unavailable');
  });

  it('returns safe UI-facing runtime metadata without tenantId or userId', async () => {
    const output = await resolveBusinessStateRuntime({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'api',
    }, {
      isEnabled: () => true,
      resolveBusinessState: createBusinessStateResolver().resolveBusinessState,
    });
    const metadataKeys = Object.keys(output.runtime as BusinessStateRuntimeMetadata);
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
