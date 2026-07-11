import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CRMCommandCenter } from '@/modules/crm/types';
import {
  resolveCrmRuntimeCommandCenter,
  type CrmRuntimeMetadata,
} from '@/modules/crm/runtime';

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_RUNTIME_CRM;

function setRuntimeCrmFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_RUNTIME_CRM;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_RUNTIME_CRM = value;
}

function commandCenter(): CRMCommandCenter {
  return {
    leads: {
      total: 3,
      new: 1,
      qualified: 1,
      byStage: { new_lead: 1, qualified: 1, offer_presented: 1 },
      bySource: { funnel: 2, manual: 1 },
    },
    hotLeads: [{
      leadId: 'lead_hot_1',
      name: 'Ada Prospect',
      score: 88,
      reason: 'High intent',
      urgency: 'high',
      suggestedAction: 'Follow up today',
    }],
    opportunities: [{
      id: 'opportunity_1',
      title: 'Premium Program',
      leadId: 'lead_hot_1',
      leadName: 'Ada Prospect',
      value: 2000,
      probability: 60,
      expectedCloseDate: '2026-07-15',
      stage: 'proposal',
      notes: 'Private buying notes',
    }],
    revenueForecast: {
      expectedRevenue: 1200,
      conservativeRevenue: 840,
      optimisticRevenue: 1800,
      confidenceScore: 76,
      pipelineValue: 2000,
      weightedValue: 1200,
    },
    advisorTips: [{
      id: 'hot',
      priority: 1,
      tip: 'You have a high-intent lead.',
      action: 'Follow up',
    }],
    followups: { today: 1, overdue: 1, upcoming: 1 },
    appointments: { today: 1, thisWeek: 2, thisMonth: 3 },
  };
}

function createCrmResolver() {
  const crm = commandCenter();
  return {
    commandCenter: crm,
    resolveCommandCenter: vi.fn().mockResolvedValue(crm),
  };
}

afterEach(() => {
  setRuntimeCrmFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('CrmRuntimeAdapter', () => {
  it('keeps the legacy path when the runtime CRM flag is OFF', async () => {
    setRuntimeCrmFlag('false');
    const { commandCenter: crm, resolveCommandCenter } = createCrmResolver();

    const output = await resolveCrmRuntimeCommandCenter({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'crm-center-service',
    }, {
      resolveCommandCenter,
    });

    expect(resolveCommandCenter).toHaveBeenCalledWith({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'crm-center-service',
    });
    expect(output.commandCenter).toBe(crm);
    expect(output.runtime).toEqual({
      enabled: false,
      mode: 'legacy',
      source: 'crm-center-service',
      fallback: false,
      confidence: 76,
    });
  });

  it('defaults to the runtime path when the runtime CRM flag is missing', async () => {
    setRuntimeCrmFlag(undefined);
    const { commandCenter: crm, resolveCommandCenter } = createCrmResolver();

    const output = await resolveCrmRuntimeCommandCenter({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'crm-center',
    }, {
      resolveCommandCenter,
    });

    expect(output.commandCenter).toBe(crm);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'crm-center',
      fallback: false,
      confidence: 76,
      capabilityId: 'crm.command-center.resolve',
    });
    expect(output.runtime.contextId).toEqual(expect.any(String));
    expect(output.runtime.correlationId).toEqual(expect.any(String));
  });

  it.each(['false', 'FALSE', 'True', '1', '0', ''])(
    'treats %s as flag OFF',
    async (flagValue) => {
      setRuntimeCrmFlag(flagValue);

      const output = await resolveCrmRuntimeCommandCenter({
        userId: 'user_1',
        tenantId: 'tenant_1',
        source: 'api',
      }, {
        resolveCommandCenter: createCrmResolver().resolveCommandCenter,
      });

      expect(output.runtime).toMatchObject({
        enabled: false,
        mode: 'legacy',
        source: 'api',
        fallback: false,
      });
      expect(output.runtime.contextId).toBeUndefined();
      expect(output.runtime.correlationId).toBeUndefined();
    },
  );

  it('creates runtime metadata when the runtime CRM flag is ON', async () => {
    setRuntimeCrmFlag('true');
    const { commandCenter: crm, resolveCommandCenter } = createCrmResolver();

    const output = await resolveCrmRuntimeCommandCenter({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'crm-center',
    }, {
      resolveCommandCenter,
    });

    expect(output.commandCenter).toBe(crm);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'crm-center',
      fallback: false,
      confidence: 76,
      capabilityId: 'crm.command-center.resolve',
      eventType: 'runtime.crm.followup-overdue',
      diagnosticsStatus: 'healthy',
    });
    expect(output.runtime.contextId).toEqual(expect.any(String));
    expect(output.runtime.correlationId).toEqual(expect.any(String));
    expect(output.runtime.capabilityRuntimeId).toEqual(expect.any(String));
    expect(output.runtime.eventId).toEqual(expect.any(String));
    expect(output.runtime.diagnosticsId).toEqual(expect.any(String));
  });

  it('falls back to legacy CRM command-center output when runtime construction throws', async () => {
    const warn = vi.fn();
    const { commandCenter: crm, resolveCommandCenter } = createCrmResolver();

    const output = await resolveCrmRuntimeCommandCenter({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'command-center',
    }, {
      isEnabled: () => true,
      resolveCommandCenter,
      createRuntimeArtifacts: () => {
        throw new Error('runtime unavailable for tenant_1 ada@example.com');
      },
      logger: { warn },
    });

    expect(output.commandCenter).toBe(crm);
    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'legacy',
      source: 'command-center',
      fallback: true,
      confidence: 'fallback',
      diagnosticsStatus: 'degraded',
      warning: 'runtime-crm-adapter-fallback',
      errorKind: 'Error',
    });
    expect(warn).toHaveBeenCalledWith(
      '[crm-runtime-adapter] falling back to legacy CRM command-center resolver',
      expect.objectContaining({
        warning: 'runtime-crm-adapter-fallback',
        errorKind: 'Error',
        source: 'command-center',
        totalLeadCount: 3,
        hotLeadCount: 1,
        opportunityCount: 1,
        overdueFollowupCount: 1,
        todayFollowupCount: 1,
        revenueConfidenceScore: 76,
      }),
    );

    const warningPayload = warn.mock.calls[0]?.[1];
    expect(warningPayload).not.toHaveProperty('tenantId');
    expect(warningPayload).not.toHaveProperty('userId');
    expect(warningPayload).not.toHaveProperty('message');
    expect(warningPayload).not.toHaveProperty('stack');
    expect(JSON.stringify(warningPayload)).not.toContain('Ada Prospect');
    expect(JSON.stringify(warningPayload)).not.toContain('ada@example.com');
    expect(JSON.stringify(warningPayload)).not.toContain('Private buying notes');
  });

  it('returns safe UI-facing runtime metadata without tenantId, userId, or CRM PII', async () => {
    const output = await resolveCrmRuntimeCommandCenter({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'api',
    }, {
      isEnabled: () => true,
      resolveCommandCenter: createCrmResolver().resolveCommandCenter,
    });
    const metadataKeys = Object.keys(output.runtime as CrmRuntimeMetadata);
    const forbiddenKeyPattern = /(secret|password|token|api[-_]?key|credential|email|phone|name)/i;

    expect(output.runtime).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'api',
      fallback: false,
      confidence: 76,
    });
    expect(output.runtime).not.toHaveProperty('tenantId');
    expect(output.runtime).not.toHaveProperty('userId');
    expect(metadataKeys.some((key) => forbiddenKeyPattern.test(key))).toBe(false);
    expect(JSON.stringify(output.runtime)).not.toContain('Ada Prospect');
    expect(JSON.stringify(output.runtime)).not.toContain('lead_hot_1');
  });
});
