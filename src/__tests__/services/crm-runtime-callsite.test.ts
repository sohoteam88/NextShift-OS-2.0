import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CRMCommandCenter } from '@/modules/crm/types';
import { crmCenterService } from '@/modules/crm/crmCenterService';
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
      total: 1,
      new: 1,
      qualified: 0,
      byStage: { new_lead: 1 },
      bySource: { funnel: 1 },
    },
    hotLeads: [],
    opportunities: [],
    revenueForecast: {
      expectedRevenue: 0,
      conservativeRevenue: 0,
      optimisticRevenue: 0,
      confidenceScore: 0,
      pipelineValue: 0,
      weightedValue: 0,
    },
    advisorTips: [],
    followups: { today: 0, overdue: 0, upcoming: 0 },
    appointments: { today: 0, thisWeek: 0, thisMonth: 0 },
  };
}

function createRuntimeResolver(crm = commandCenter()) {
  const resolveCommandCenter = vi.fn().mockResolvedValue(crm);
  const resolveRuntimeCommandCenter: typeof resolveCrmRuntimeCommandCenter = (input) =>
    resolveCrmRuntimeCommandCenter(input, { resolveCommandCenter });

  return { commandCenter: crm, resolveCommandCenter, resolveRuntimeCommandCenter };
}

afterEach(() => {
  setRuntimeCrmFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('CRM runtime callsite', () => {
  it('keeps getCommandCenter response shape unchanged when the runtime CRM flag is OFF', async () => {
    setRuntimeCrmFlag('false');
    const runtimeMetadata: CrmRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const commandCenterOutput = await crmCenterService.getCommandCenter(
      'user_1',
      'tenant_1',
      undefined,
      {
        resolveRuntimeCommandCenter: runtimeResolver.resolveRuntimeCommandCenter,
        onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
      },
    );

    expect(commandCenterOutput).toBe(runtimeResolver.commandCenter);
    expect(commandCenterOutput).not.toHaveProperty('runtime');
    expect(runtimeResolver.resolveCommandCenter).toHaveBeenCalledWith({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'crm-center-service',
    });
    expect(runtimeMetadata).toEqual([{
      enabled: false,
      mode: 'legacy',
      source: 'crm-center-service',
      fallback: false,
      confidence: 0,
    }]);
  });

  it('routes getCommandCenter through the CRM Runtime Adapter when the flag is ON', async () => {
    setRuntimeCrmFlag('true');
    const runtimeMetadata: CrmRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const commandCenterOutput = await crmCenterService.getCommandCenter(
      'user_1',
      'tenant_1',
      undefined,
      {
        resolveRuntimeCommandCenter: runtimeResolver.resolveRuntimeCommandCenter,
        onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
        source: 'api',
      },
    );

    expect(commandCenterOutput).toBe(runtimeResolver.commandCenter);
    expect(commandCenterOutput).not.toHaveProperty('runtime');
    expect(runtimeMetadata).toHaveLength(1);
    expect(runtimeMetadata[0]).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'api',
      fallback: false,
      confidence: 0,
      capabilityId: 'crm.command-center.resolve',
      eventType: 'runtime.crm.command-center',
      diagnosticsStatus: 'healthy',
    });
    expect(runtimeMetadata[0]?.contextId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]?.correlationId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]).not.toHaveProperty('tenantId');
    expect(runtimeMetadata[0]).not.toHaveProperty('userId');
  });
});
