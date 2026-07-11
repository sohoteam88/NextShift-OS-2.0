import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveRevenueRuntimeIntent,
  type RevenueRuntimeMetadata,
} from '@/modules/revenue-drivers/runtime';
import { resolveRevenueDriverIntent } from '@/modules/revenue-drivers/constants/revenue-driver-intents';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RevenueRuntimeAdapter', () => {
  it.each([
    { route: '/content-engine', intent: 'facebook-post' },
    { route: '/webinar-center', intent: 'invalid-intent' },
    { route: '/webinar-center', intent: null },
  ])(
    'matches legacy business output for $route / $intent',
    ({ route, intent }) => {
      const legacyResolution = resolveRevenueDriverIntent({ route, intent });
      const runtimeOutput = resolveRevenueRuntimeIntent({
        route,
        intent,
        source: 'api',
      });

      expect(runtimeOutput.resolution).toEqual(legacyResolution);
    },
  );

  it('creates runtime metadata for revenue intent resolution', () => {
    const output = resolveRevenueRuntimeIntent({
      route: '/content-engine',
      intent: 'facebook-post',
      source: 'deep-link',
      tenantId: 'tenant_1',
      userId: 'user_1',
    });

    expect(output.resolution).toMatchObject({
      status: 'resolved',
      toolId: 'content.facebook-post',
    });
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'deep-link',
      fallback: false,
      confidence: 1,
      capabilityId: 'revenue.driver.intent.resolve',
      eventType: 'runtime.revenue.intent.resolved',
      diagnosticsStatus: 'healthy',
    });
    expect(output.runtime.contextId).toEqual(expect.any(String));
    expect(output.runtime.correlationId).toEqual(expect.any(String));
    expect(output.runtime.capabilityRuntimeId).toEqual(expect.any(String));
    expect(output.runtime.eventId).toEqual(expect.any(String));
    expect(output.runtime.diagnosticsId).toEqual(expect.any(String));
  });

  it('maps invalid and fallback resolutions to deterministic runtime events', () => {
    const invalid = resolveRevenueRuntimeIntent({
      route: '/webinar-center',
      intent: 'invalid-intent',
      source: 'deep-link',
    });
    const fallback = resolveRevenueRuntimeIntent({
      route: '/webinar-center',
      intent: null,
      source: 'hub',
    });

    expect(invalid.resolution.status).toBe('invalid');
    expect(invalid.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      eventType: 'runtime.revenue.intent.invalid',
      confidence: 0,
    });
    expect(fallback.resolution.status).toBe('fallback');
    expect(fallback.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      eventType: 'runtime.revenue.intent.fallback',
      confidence: 0.35,
    });
  });

  it('falls back to the legacy resolver when runtime construction throws', () => {
    const warn = vi.fn();

    const output = resolveRevenueRuntimeIntent({
      route: '/content-engine',
      intent: 'facebook-post',
      source: 'deep-link',
      tenantId: 'tenant_1',
      userId: 'user_1',
    }, {
      createRuntimeArtifacts: () => {
        throw new Error('runtime unavailable');
      },
      logger: { warn },
    });

    expect(output.resolution).toMatchObject({
      status: 'resolved',
      toolId: 'content.facebook-post',
    });
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'legacy',
      fallback: true,
      diagnosticsStatus: 'degraded',
      warning: 'runtime-adapter-fallback',
      errorKind: 'Error',
    });
    expect(warn).toHaveBeenCalledWith(
      '[revenue-runtime-adapter] falling back to legacy resolver',
      expect.objectContaining({
        warning: 'runtime-adapter-fallback',
        errorKind: 'Error',
        route: '/content-engine',
        intent: 'facebook-post',
        status: 'resolved',
        source: 'deep-link',
      }),
    );
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('tenantId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('userId');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('message');
    expect(warn.mock.calls[0]?.[1]).not.toHaveProperty('stack');
  });

  it('falls back when injected runtime artifacts produce incomplete metadata', () => {
    const output = resolveRevenueRuntimeIntent({
      route: '/content-engine',
      intent: 'facebook-post',
      source: 'api',
    }, {
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
            type: 'runtime.revenue.intent.resolved',
            source: 'nextshift.revenue-drivers',
          },
          occurredAt: new Date(),
        },
        diagnostics: {
          id: '',
          identity: {
            diagnosticsId: 'revenue-runtime-adapter',
            component: 'revenue-drivers',
            scope: 'capability',
          },
          health: 'healthy',
          status: 'ok',
          observedAt: new Date(),
        },
      }),
      logger: { warn: vi.fn() },
    });

    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'legacy',
      fallback: true,
      diagnosticsStatus: 'degraded',
      warning: 'runtime-adapter-invalid-output',
    });
  });

  it('exposes safe runtime metadata without forbidden secret-like keys', () => {
    const output = resolveRevenueRuntimeIntent({
      route: '/traffic-engine',
      intent: 'facebook-ad',
      source: 'dashboard',
    });
    const forbiddenKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;
    const metadataKeys = Object.keys(output.runtime as RevenueRuntimeMetadata);

    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'dashboard',
      fallback: false,
      confidence: 1,
      eventType: 'runtime.revenue.intent.resolved',
    });
    expect(metadataKeys.some((key) => forbiddenKeyPattern.test(key))).toBe(false);
  });
});
