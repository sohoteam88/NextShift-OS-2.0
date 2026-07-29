import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import {
  createOutcomePlan,
  ensureOutcomeAudit,
} from '@/modules/mission-engine/services/OutcomeOrchestrator';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { BottleneckSignals } from '@/modules/mission-engine/services/BottleneckEngine';

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const user: AuthUser = {
  id: 'user_1',
  email: 'user@example.com',
  tenantId: 'tenant_1',
  role: 'member',
  name: 'User',
  preferredLanguage: 'zh',
  status: 'active',
};

const baseSignals: Partial<BottleneckSignals> = {
  validationFailed: false,
  signalSourceAvailable: true,
  requiredMetricsResolved: true,
};

const leadMagnetComplete: Partial<BottleneckSignals> = {
  ...baseSignals,
  leadMagnetExists: true,
  leadMagnetPublished: true,
  leadMagnetCtaExists: true,
};

const firstLeadMissionsComplete: Partial<BottleneckSignals> = {
  ...leadMagnetComplete,
  landingPagePublished: true,
  thankYouPagePublished: true,
  leadRouteExists: true,
  activeTrafficSourceCount: 1,
  trafficCount: 1,
};

describe('EXEC-006 Outcome Orchestrator', () => {
  beforeEach(() => {
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'audit_1' } as never);
  });

  it('creates a first lead outcome with locked mission dependencies', () => {
    const outcome = createOutcomePlan({
      currentMissionType: 'LEAD_MAGNET',
      signals: baseSignals,
      sourceAvailable: true,
    });

    expect(outcome).toMatchObject({
      id: 'outcome-first_lead',
      templateId: 'FIRST_LEAD',
      name: 'Acquire First Lead',
      status: 'ACTIVE',
      verificationBoundary: 'outcome_completion_requires_missions_and_signal',
    });
    expect(outcome.missions.map((mission) => mission.status)).toEqual(['ACTIVE', 'LOCKED', 'LOCKED']);
    expect(outcome.missions[1]).toMatchObject({
      missionId: 'mission-plan-funnel',
      dependsOn: ['mission-plan-lead_magnet'],
    });
  });

  it('unlocks dependent missions only after upstream missions complete', () => {
    const outcome = createOutcomePlan({
      currentMissionType: 'LEAD_MAGNET',
      signals: leadMagnetComplete,
      sourceAvailable: true,
    });

    expect(outcome.missions.map((mission) => mission.status)).toEqual(['COMPLETED', 'ACTIVE', 'LOCKED']);
    expect(outcome.currentMissionId).toBe('mission-plan-funnel');
    expect(outcome.nextMissionId).toBe('mission-plan-traffic');
    expect(outcome.completionPercentage).toBe(25);
  });

  it('does not complete an outcome when missions are complete but the outcome signal is missing', () => {
    const outcome = createOutcomePlan({
      currentMissionType: 'LEAD_MAGNET',
      signals: { ...firstLeadMissionsComplete, leadCount: 0 },
      sourceAvailable: true,
    });

    expect(outcome.missions.map((mission) => mission.status)).toEqual(['COMPLETED', 'COMPLETED', 'COMPLETED']);
    expect(outcome.requiredSignal).toMatchObject({
      id: 'leadCount',
      currentValue: 0,
      verified: false,
    });
    expect(outcome.status).toBe('BLOCKED');
    expect(outcome.completionPercentage).toBe(75);
  });

  it('completes the outcome only when all missions and the required signal are verified', () => {
    const outcome = createOutcomePlan({
      currentMissionType: 'LEAD_MAGNET',
      signals: { ...firstLeadMissionsComplete, leadCount: 1 },
      sourceAvailable: true,
    });

    expect(outcome.status).toBe('COMPLETED');
    expect(outcome.requiredSignal.verified).toBe(true);
    expect(outcome.completionPercentage).toBe(100);
  });

  it('writes deduped outcome audit events for created and current lifecycle', async () => {
    const outcome = createOutcomePlan({
      currentMissionType: 'LEAD_MAGNET',
      signals: leadMagnetComplete,
      sourceAvailable: true,
    });

    await ensureOutcomeAudit({ user, outcome });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'outcome.created',
        targetType: 'business_outcome',
        targetId: null,
        metadata: expect.objectContaining({
          target_key: 'outcome-first_lead',
        }),
      }),
    }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'outcome.started',
        targetId: null,
        metadata: expect.objectContaining({
          target_key: 'outcome-first_lead:ACTIVE',
        }),
      }),
    }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'outcome.progressed',
        targetId: null,
        metadata: expect.objectContaining({
          target_key: 'outcome-first_lead:25',
        }),
      }),
    }));
  });

  it('includes webinar as a first customer conversion mission before customer follow-up', () => {
    const outcome = createOutcomePlan({
      currentMissionType: 'CUSTOMERS',
      signals: firstLeadMissionsComplete,
      sourceAvailable: true,
    });

    expect(outcome.templateId).toBe('FIRST_CUSTOMER');
    expect(outcome.missions.map((mission) => mission.missionType)).toEqual([
      'LEAD_MAGNET',
      'FUNNEL',
      'TRAFFIC',
      'WEBINAR',
      'CUSTOMERS',
    ]);
    expect(outcome.missions[3]).toMatchObject({
      missionId: 'mission-plan-webinar',
      route: '/webinar-center',
      status: 'ACTIVE',
    });
    expect(outcome.missions[4]).toMatchObject({
      missionId: 'mission-plan-customers',
      dependsOn: ['mission-plan-webinar'],
      status: 'LOCKED',
    });
  });
});
