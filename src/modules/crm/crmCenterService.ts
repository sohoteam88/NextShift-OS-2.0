import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { WorkspaceContext } from '@/modules/workspace/types';
import type { CRMCommandCenter } from './types';
import { forecastRevenue, detectHotLeads, getCRMAdvisor } from './crmEngines';
import {
  resolveCrmRuntimeCommandCenter,
  type CrmRuntimeMetadata,
  type CrmRuntimeSource,
} from './runtime';

export type CrmRuntimeOptions = {
  onRuntimeResolved?: (runtime: CrmRuntimeMetadata) => void;
  resolveRuntimeCommandCenter?: typeof resolveCrmRuntimeCommandCenter;
  source?: CrmRuntimeSource;
};

async function resolveCrmCommandCenterLegacy(
  userId: string,
  tenantId: string,
  workspaceContext?: WorkspaceContext,
): Promise<CRMCommandCenter> {
  const ctx = await getBrandContext(userId);
  const crmLifecycle = workspaceContext?.crmContext.focus[0];
  const leads = await prisma.lead.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true, score: true, pipelineStage: true, source: true, updatedAt: true, nextFollowup: true },
    orderBy: { score: 'desc' },
  });

  // Stage counts
  const byStage: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  for (const l of leads) {
    byStage[l.pipelineStage] = (byStage[l.pipelineStage] ?? 0) + 1;
    bySource[l.source ?? 'manual'] = (bySource[l.source ?? 'manual'] ?? 0) + 1;
  }

  // Opportunities from Customer model
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    select: { id: true, name: true, leadId: true, status: true, metadata: true },
  });
  const opportunities = customers.map(c => {
    const meta = (c.metadata as Record<string, unknown>) ?? {};
    return {
      id: c.id, title: c.name, leadId: c.leadId ?? '', leadName: c.name,
      value: (meta.value as number) ?? 1000,
      probability: (meta.probability as number) ?? 25,
      expectedCloseDate: (meta.expectedCloseDate as string) ?? '',
      stage: (meta.stage as any) ?? 'identified', notes: (meta.notes as string) ?? '',
    };
  });

  // Forecast
  const forecast = forecastRevenue(
    leads.map(l => ({ pipelineStage: l.pipelineStage, score: l.score })),
    opportunities,
  );

  // Hot leads
  const hotLeads = detectHotLeads(
    leads.map(l => ({ id: l.id, name: l.name, score: l.score, pipelineStage: l.pipelineStage, updatedAt: l.updatedAt.toISOString() })),
  );

  // Follow-ups
  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59);
  const thisWeekEnd = new Date(now); thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
  const followupsToday = leads.filter(l => l.nextFollowup && l.nextFollowup <= todayEnd).length;
  const followupsOverdue = leads.filter(l => l.nextFollowup && l.nextFollowup < now).length;
  const followupsUpcoming = leads.filter(l => l.nextFollowup && l.nextFollowup > now && l.nextFollowup <= thisWeekEnd).length;

  // Appointments (from pipeline stage)
  const appointments = await prisma.activity.findMany({
    where: { tenantId, type: 'appointment', createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    select: { createdAt: true },
  });
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0);
  const appointmentToday = appointments.filter(a => a.createdAt >= todayStart && a.createdAt <= todayEnd).length;
  const appointmentThisWeek = appointments.filter(a => a.createdAt <= thisWeekEnd).length;
  const appointmentThisMonth = appointments.length;

  // Pipeline stuck (>7 days)
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const pipelineStuck = leads.filter(l => ['qualified','appointment_scheduled','offer_presented'].includes(l.pipelineStage) && l.updatedAt < weekAgo).length;

  // Advisor
  const advisorTips = getCRMAdvisor(leads.length, hotLeads.length, followupsOverdue, pipelineStuck).map((tip) =>
    crmLifecycle
      ? {
          ...tip,
          tip: `${tip.tip} (${crmLifecycle})`,
        }
      : tip,
  );

  return {
    leads: {
      total: leads.length,
      new: byStage.new_lead ?? 0,
      qualified: byStage.qualified ?? 0,
      byStage, bySource,
    },
    hotLeads, opportunities, revenueForecast: forecast, advisorTips,
    followups: { today: followupsToday, overdue: followupsOverdue, upcoming: followupsUpcoming },
    appointments: { today: appointmentToday, thisWeek: appointmentThisWeek, thisMonth: appointmentThisMonth },
  };
}

export const crmCenterService = {
  async getCommandCenter(
    userId: string,
    tenantId: string,
    workspaceContext?: WorkspaceContext,
    runtimeOptions: CrmRuntimeOptions = {},
  ): Promise<CRMCommandCenter> {
    const { commandCenter, runtime } = await (runtimeOptions.resolveRuntimeCommandCenter ?? resolveCrmRuntimeCommandCenter)({
      userId,
      tenantId,
      source: runtimeOptions.source ?? 'crm-center-service',
    }, {
      resolveCommandCenter: () => resolveCrmCommandCenterLegacy(userId, tenantId, workspaceContext),
    });
    runtimeOptions.onRuntimeResolved?.(runtime);
    return commandCenter;
  },
};
