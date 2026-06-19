import prisma from '@/lib/prisma';
import { growthLoopEngine } from '@/modules/growth-loop/services/growth-loop-engine';
import type { OptimizationProjection } from '../contracts/OptimizationProjection';
import { buildOptimizationProjection } from './optimization-projection';

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export async function getOptimizationProjection(userId: string, tenantId?: string): Promise<OptimizationProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const generatedAt = new Date().toISOString();
  const [
    growthProjection,
    missionTotalCount,
    missionCompletedCount,
    missionBlockedCount,
    missionAbandonedCount,
    contentPublishedCount,
    funnelAggregates,
    agentCompletedCount,
    agentFailedCount,
    executionCompletedCount,
    executionFailedCount,
  ] = await Promise.all([
    growthLoopEngine.getProjection(user.id),
    prisma.mission.count({ where: { tenantId: resolvedTenantId, userId: user.id } }),
    prisma.mission.count({ where: { tenantId: resolvedTenantId, userId: user.id, status: 'completed' } }),
    prisma.mission.count({ where: { tenantId: resolvedTenantId, userId: user.id, status: 'blocked' } }),
    prisma.mission.count({ where: { tenantId: resolvedTenantId, userId: user.id, status: 'abandoned' } }),
    prisma.content.count({ where: { tenantId: resolvedTenantId, ownerId: user.id, status: 'published' } }),
    prisma.funnel.aggregate({
      where: { tenantId: resolvedTenantId, ownerId: user.id },
      _sum: { views: true, conversions: true },
    }),
    prisma.auditLog.count({
      where: { tenantId: resolvedTenantId, actorId: user.id, targetType: 'agent_workforce', action: 'AGENT_TASK_COMPLETED' },
    }),
    prisma.auditLog.count({
      where: { tenantId: resolvedTenantId, actorId: user.id, targetType: 'agent_workforce', action: 'AGENT_TASK_FAILED' },
    }),
    prisma.auditLog.count({
      where: { tenantId: resolvedTenantId, actorId: user.id, targetType: 'autonomous_execution', action: 'EXECUTION_COMPLETED' },
    }),
    prisma.auditLog.count({
      where: { tenantId: resolvedTenantId, actorId: user.id, targetType: 'autonomous_execution', action: 'EXECUTION_FAILED' },
    }),
  ]);

  const funnelViews = funnelAggregates._sum.views ?? 0;
  const funnelConversions = funnelAggregates._sum.conversions ?? 0;
  const agentTotalCount = agentCompletedCount + agentFailedCount;
  const executionTotalCount = executionCompletedCount + executionFailedCount;

  return buildOptimizationProjection({
    generatedAt,
    growthProjection,
    missionCompletionRate: percent(missionCompletedCount, missionTotalCount),
    missionCompletedCount,
    missionTotalCount,
    missionBlockedCount,
    missionAbandonedCount,
    contentPublishedCount,
    funnelConversionRate: percent(funnelConversions, funnelViews),
    agentSuccessRate: percent(agentCompletedCount, agentTotalCount),
    agentCompletedCount,
    agentFailedCount,
    executionCompletionRate: percent(executionCompletedCount, executionTotalCount),
    executionFailedCount,
  });
}

export const optimizationEngine = {
  getProjection: getOptimizationProjection,
};
