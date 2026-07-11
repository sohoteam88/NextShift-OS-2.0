import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveAnalyticsRuntimeProjection,
  type AnalyticsRuntimeMetadata,
} from '@/modules/analytics/runtime';
import type { AnalyticsProjection } from '@/modules/analytics/adapters/AnalyticsProjectionAdapter';

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

function createProjectionLoader() {
  return vi.fn().mockResolvedValue(sampleProjection);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AnalyticsRuntimeAdapter', () => {
  it.each([
    { source: 'analytics-center' as const, workspaceFocus: 'sales' },
    { source: 'api' as const, workspaceFocus: 'command-center' },
  ])(
    'matches legacy business output for $source / $workspaceFocus',
    async ({ source, workspaceFocus }) => {
      const getProjection = createProjectionLoader();

      const legacyProjection = await getProjection('user_1', 'tenant_1');
      const runtimeOutput = await resolveAnalyticsRuntimeProjection({
        userId: 'user_1',
        tenantId: 'tenant_1',
        source,
        projectionType: 'analytics-center',
        workspaceFocus,
      }, {
        getProjection,
      });

      expect(runtimeOutput.projection).toEqual(legacyProjection);
    },
  );

  it('creates runtime metadata for analytics projection resolution', async () => {
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
