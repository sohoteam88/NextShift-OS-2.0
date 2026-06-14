import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelProgressService } from '@/modules/funnel/services/funnel-progress-service';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';
import { FUNNEL_GOALS, MILESTONES } from '@/modules/funnel/types/funnel-os';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import prisma from '@/lib/prisma';

const FUNNEL_TYPES: BusinessFunnelType[] = ['retail', 'recruitment', 'upgrade'];

function parseGoalTarget(goal: string) {
  const match = goal.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function buildKpi(funnelType: BusinessFunnelType, leadCount: number, customerCount: number) {
  if (funnelType === 'recruitment') {
    return [
      { label: 'Leads', value: String(leadCount), target: '10' },
      { label: 'Calls', value: String(Math.min(leadCount, Math.max(0, Math.floor(leadCount * 0.4)))), target: '3' },
      { label: 'Members', value: String(customerCount), target: '1' },
      { label: 'Builders', value: String(Math.max(0, Math.floor(customerCount * 0.25))), target: '1' },
    ];
  }

  if (funnelType === 'upgrade') {
    return [
      { label: 'Customers', value: String(customerCount), target: '10' },
      { label: 'Invites', value: String(leadCount), target: '10' },
      { label: 'Members', value: String(Math.max(0, Math.floor(customerCount * 0.3))), target: '1' },
      { label: 'Builders', value: String(Math.max(0, Math.floor(customerCount * 0.15))), target: '1' },
    ];
  }

  return [
    { label: 'Leads', value: String(leadCount), target: '10' },
    { label: 'Appointments', value: String(Math.min(leadCount, Math.max(0, Math.floor(leadCount * 0.35)))), target: '3' },
    { label: 'Customers', value: String(customerCount), target: '1' },
    { label: 'Revenue', value: `RM ${customerCount * 100}`, target: 'RM 100' },
  ];
}

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const requestedType = (new URL(req.url).searchParams.get('type') ?? 'retail') as BusinessFunnelType;
  const funnelType = FUNNEL_TYPES.includes(requestedType) ? requestedType : 'retail';

  const [progress, contentCount, videoCount] = await Promise.all([
    funnelProgressService.getProgress(user.id, user.tenantId, funnelType),
    prisma.content.count({ where: { ownerId: user.id } }),
    prisma.videoProject.count({ where: { userId: user.id } }),
  ]);

  const leadCount = await prisma.lead.count({ where: { tenantId: user.tenantId, deletedAt: null } });
  const customerCount = await prisma.customer.count({ where: { tenantId: user.tenantId } });
  const funnelCount = await prisma.funnel.count({ where: { tenantId: user.tenantId } });

  const health = await funnelHealthService.evaluateActivity(contentCount, videoCount, funnelCount > 0, leadCount, customerCount);
  const nextAction = funnelHealthService.getActivityNextAction(funnelType, contentCount, videoCount, funnelCount > 0, leadCount, customerCount);

  // Map real data to milestones
  const milestones = (MILESTONES[funnelType] ?? []).map(m => {
    let completed = false;
    if (m.id === 'first_content') completed = contentCount > 0;
    if (m.id === 'first_video') completed = videoCount > 0;
    if (m.id === 'first_lead') completed = leadCount > 0;
    if (m.id === 'first_customer' || m.id === 'first_member') completed = customerCount > 0;
    if (m.id === 'first_appointment' || m.id === 'first_call') completed = leadCount > 2;
    return { ...m, completed };
  });

  const defaultGoal = FUNNEL_GOALS[funnelType][0];
  const target = parseGoalTarget(defaultGoal);
  const goal = {
    funnelType,
    goal: defaultGoal,
    target,
    current: customerCount,
    progress: Math.min(100, Math.round((customerCount / Math.max(target, 1)) * 100)),
  };
  const kpi = buildKpi(funnelType, leadCount, customerCount);

  return NextResponse.json({ data: { progress, health, nextAction, milestones, kpi, goal } });
});
