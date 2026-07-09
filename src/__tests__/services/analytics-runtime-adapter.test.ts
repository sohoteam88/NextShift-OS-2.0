import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveAnalyticsRuntimeProjection,
  type AnalyticsRuntimeMetadata,
} from '@/modules/analytics/runtime';
import type { AnalyticsProjection } from '@/modules/analytics/adapters/AnalyticsProjectionAdapter';

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS;

const sampleProjection: AnalyticsProjection = {
  businessStateVersion: 'BusinessStateAssembler:lead_generation:64',
  journeyVersion: 'JourneyStateAssembler:lead_generation:57',
  growthLoopVersion: 'GrowthLoopAssembler:2026-06-19T00:00:00.000Z:72',
  readiness: {
    value: 64,
    stage: 'lead_generation',
    bottleneckCount: 1,
  },
  progress: {
    value: 57,
    stage: 'lead_generation',
    nextAction: {
      title: 'Launch traffic',
      description: 'Start sending audience traffic to the funnel.',
      route: '/traffic-engine',
    },
  },
  growth: {
    value: 72,
    health: 'active',
    recommendationCount: 1,
  },
};

function setRuntimeAnalyticsFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS = value;
}

function createProjectionLoader() {
  return vi.fn().mockResolvedValue(sampleProjection);
}

afterEach(() => {
  setRuntimeAnalyticsFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('AnalyticsRuntimeAdapter', () => {
  it('keeps the legacy path when the runtime analytics flag is missing', async () => {
    setRuntimeAnalyticsFlag(undefined);
    const getProjection = createProjectionLoader();

    const output = await resolveAnalyticsRuntimeProjection({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'analytics-center',
      projectionType: 'analytics-center',
      workspaceFocus: 'sales',
    }, {
      getProjection,
    });

    expect(getProjection).toHaveBeenCalledWith('user_1', 'tenant_1');
    expect(output.projection).toBe(sampleProjection);
    expect(output.runtime).toEqual({
      enabled: false,
      mode: 'legacy',
      source: 'analytics-center',
      fallback: false,
      confidence: 'derived',
    });
  });

  it.each(['false', 'FALSE', 'True', '1', '0', ''])(
    'treats %s as flag OFF',
    async (flagValue) => {
      setRuntimeAnalyticsFlag(flagValue);

      const output = await resolveAnalyticsRuntimeProjection({
        userId: 'user_1',
        tenantId: 'tenant_1',
        source: 'analytics-center',
        projectionType: 'analytics-center',
      }, {
        getProjection: createProjectionLoader(),
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

  it('creates runtime metadata when the runtime analytics flag is ON', async () => {
    setRuntimeAnalyticsFlag('true');

    const output = await resolveAnalyticsRuntimeProjection({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'analytics-center',
      projectionType: 'analytics-center',
      workspaceFocus: 'sales',
    }, {
      getProjection: createProjectionLoader(),
    });

    expect(output.projection).toBe(sampleProjection);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'analytics-center',
      fallback: false,
      confidence: 'derived',
      capabilityId: 'analytics.projection.resolve',
      eventType: 'runtime.analytics.projection.resolved',
      diagnosticsStatus: 'healthy',
    });
    expect(output.runtime.contextId).toEqual(expect.any(String));
    expect(output.runtime.correlationId).toEqual(expect.any(String));
    expect(output.runtime.capabilityRuntimeId).toEqual(expect.any(String));
    expect(output.runtime.eventId).toEqual(expect.any(String));
    expect(output.runtime.diagnosticsId).toEqual(expect.any(String));
  });

  it('falls back to legacy analytics projection when runtime construction throws', async () => {
    const warn = vi.fn();

    const output = await resolveAnalyticsRuntimeProjection({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'analytics-center',
      projectionType: 'analytics-center',
      workspaceFocus: 'sales',
    }, {
      isEnabled: () => true,
      getProjection: createProjectionLoader(),
      createRuntimeArtifacts: () => {
        throw new Error('runtime unavailable for tenant_1 user_1');
      },
      logger: { warn },
    });

    expect(output.projection).toBe(sampleProjection);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'legacy',
      source: 'analytics-center',
      fallback: true,
      confidence: 'fallback',
      diagnosticsStatus: 'degraded',
      warning: 'runtime-analytics-adapter-fallback',
      errorKind: 'Error',
    });
    expect(warn).toHaveBeenCalledWith(
      '[analytics-runtime-adapter] falling back to legacy projection',
      expect.objectContaining({
        warning: 'runtime-analytics-adapter-fallback',
        errorKind: 'Error',
        source: 'analytics-center',
        projectionType: 'analytics-center',
        workspaceFocus: 'sales',
        status: 'resolved',
      }),
    );
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('tenantId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('userId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('message');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('stack');
    expect(JSON.stringify(warn.mock.calls[0]?.[1])).not.toContain('runtime unavailable');
  });

  it('falls back when injected runtime artifacts produce incomplete metadata', async () => {
    const output = await resolveAnalyticsRuntimeProjection({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'api',
      projectionType: 'analytics-center',
    }, {
      isEnabled: () => true,
      getProjection: createProjectionLoader(),
      createRuntimeArtifacts: () => ({
        context: {
          id: '',
          scope: 'capability',
          correlationId: '',
          rootId: '',
          createdAt: new Date(),
        },
        capability: {
          id: '',
          identity: {
            capabilityId: '',
            kind: 'workflow',
          },
          state: 'active',
          registeredAt: new Date(),
        },
        event: {
          id: '',
          identity: {
            eventId: '',
            type: 'runtime.analytics.projection.resolved',
            source: 'nextshift.analytics',
          },
          occurredAt: new Date(),
        },
        diagnostics: {
          id: '',
          identity: {
            diagnosticsId: 'analytics-runtime-adapter',
            component: 'analytics',
            scope: 'capability',
          },
          health: 'healthy',
          status: 'ok',
          observedAt: new Date(),
        },
      }),
      logger: { warn: vi.fn() },
    });

    expect(output.projection).toBe(sampleProjection);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'legacy',
      source: 'api',
      fallback: true,
      confidence: 'fallback',
      diagnosticsStatus: 'degraded',
      warning: 'runtime-analytics-adapter-invalid-output',
    });
  });

  it('returns safe UI-facing runtime metadata without tenantId or userId', async () => {
    const output = await resolveAnalyticsRuntimeProjection({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'analytics-center',
      projectionType: 'analytics-center',
      workspaceFocus: 'sales',
    }, {
      isEnabled: () => true,
      getProjection: createProjectionLoader(),
    });
    const metadataKeys = Object.keys(output.runtime as AnalyticsRuntimeMetadata);
    const forbiddenKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'analytics-center',
      fallback: false,
      confidence: 'derived',
    });
    expect(output.runtime).not.toHaveProperty('tenantId');
    expect(output.runtime).not.toHaveProperty('userId');
    expect(metadataKeys.some((key) => forbiddenKeyPattern.test(key))).toBe(false);
  });
});
