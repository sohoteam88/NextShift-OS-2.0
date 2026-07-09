import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveRevenueRuntimeIntent,
  type RevenueRuntimeMetadata,
} from '@/modules/revenue-drivers/runtime';

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE;

function setRuntimeRevenueFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE = value;
}

afterEach(() => {
  setRuntimeRevenueFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('RevenueRuntimeAdapter', () => {
  it('keeps the legacy path when the runtime revenue flag is OFF', () => {
    setRuntimeRevenueFlag(undefined);

    const output = resolveRevenueRuntimeIntent({
      route: '/content-engine',
      intent: 'facebook-post',
      source: 'deep-link',
    });

    expect(output.resolution).toMatchObject({
      status: 'resolved',
      route: '/content-engine',
      intent: 'facebook-post',
      toolId: 'content.facebook-post',
    });
    expect(output.runtime).toEqual({
      enabled: false,
      mode: 'legacy',
      source: 'deep-link',
      fallback: false,
      confidence: 1,
    });
  });

  it('creates runtime metadata when the runtime revenue flag is ON', () => {
    setRuntimeRevenueFlag('true');

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
    setRuntimeRevenueFlag('true');

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
    }, {
      isEnabled: () => true,
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
    });
    expect(warn).toHaveBeenCalledWith(
      '[revenue-runtime-adapter] falling back to legacy resolver',
      expect.objectContaining({
        warning: 'runtime-adapter-fallback',
        route: '/content-engine',
        intent: 'facebook-post',
        status: 'resolved',
        source: 'deep-link',
      }),
    );
  });

  it('falls back when injected runtime artifacts produce incomplete metadata', () => {
    const output = resolveRevenueRuntimeIntent({
      route: '/content-engine',
      intent: 'facebook-post',
      source: 'api',
    }, {
      isEnabled: () => true,
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
    setRuntimeRevenueFlag('true');

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
