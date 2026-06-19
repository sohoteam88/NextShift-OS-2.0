// Admin Command Center Service
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface AdminOverview {
  pendingApprovals: number; activeUsers: number; newUsersThisWeek: number;
  totalTenants: number; aiUsageThisMonth: number; aiCostEstimate: string;
  stuckUsers: number; systemAlerts: string[];
  tenantHealth: { id: string; name: string; score: number; activeUsers: number; stuckUsers: number; status: string }[];
  recentActions: { action: string; target: string; time: string }[];
  broadcastHistory: { id: string; type: string; audience: string; sentAt: string }[];
}

export const adminCommandService = {
  async getOverview(): Promise<AdminOverview> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingUsers, activeUsers, newUsers, totalTenants, aiLogs, auditLogs, allUsers, tenants] = await Promise.all([
      prisma.user.count({ where: { status: 'pending', deletedAt: null } }),
      prisma.user.count({ where: { status: 'active', deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo }, deletedAt: null } }),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.aIUsageLog.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { tokensIn: true, tokensOut: true } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { action: true, targetType: true, targetId: true, createdAt: true } }),
      prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, tenantId: true, status: true, role: true } }),
      prisma.tenant.findMany({ select: { id: true, name: true, status: true } }),
    ]);

    // Stuck user detection: users with progress not updated in 7 days
    const stuckProgress = await prisma.userProgress.findMany({
      where: { lastActivityAt: { lt: weekAgo } },
      select: { userId: true },
    });
    const stuckUserIds = new Set(stuckProgress.map(p => p.userId));

    // Tenant health
    const tenantHealth = tenants.map(t => {
      const tenantUsers = allUsers.filter(u => u.tenantId === t.id);
      const stuck = tenantUsers.filter(u => stuckUserIds.has(u.id)).length;
      const active = tenantUsers.filter(u => u.status === 'active').length;
      const score = Math.round(
        (active / Math.max(tenantUsers.length, 1)) * 40 +
        (stuck === 0 ? 30 : stuck < 3 ? 15 : 0) +
        (t.status === 'active' ? 20 : 0) +
        10
      );
      return { id: t.id, name: t.name, score: Math.min(100, score), activeUsers: active, stuckUsers: stuck, status: t.status };
    });

    const tokensIn = aiLogs._sum.tokensIn ?? 0;
    const tokensOut = aiLogs._sum.tokensOut ?? 0;
    const costEstimate = `~$${((tokensIn + tokensOut) * 0.000003).toFixed(2)}`;

    const alerts: string[] = [];
    if (pendingUsers > 0) alerts.push(`${pendingUsers} users pending approval`);
    if (stuckProgress.length > 5) alerts.push(`${stuckProgress.length} users may be stuck`);
    if (activeUsers === 0) alerts.push('No active users — check onboarding flow');

    // Check for expiring manual overrides — import dynamically to avoid circular dep
    const { saasService } = await import('@/modules/saas/saasService');
    const overrideWarnings = await saasService.getOverrideExpiryWarnings();
    for (const w of overrideWarnings) {
      alerts.push(`Override expiring for ${w.tenantName}: ${w.daysLeft}d remaining`);
    }

    return {
      pendingApprovals: pendingUsers,
      activeUsers,
      newUsersThisWeek: newUsers,
      totalTenants,
      aiUsageThisMonth: tokensIn + tokensOut,
      aiCostEstimate: costEstimate,
      stuckUsers: stuckProgress.length,
      systemAlerts: alerts,
      tenantHealth,
      recentActions: auditLogs.map(l => ({ action: l.action, target: `${l.targetType ?? ''}:${l.targetId ?? ''}`, time: l.createdAt.toISOString() })),
      broadcastHistory: [], // Would read from broadcasts table if created
    };
  },

  async sendBroadcast(actorId: string, audience: string, type: string, message: string) {
    // Log to audit log for now
    await prisma.auditLog.create({
      data: {
        tenantId: (await prisma.user.findUnique({ where: { id: actorId }, select: { tenantId: true } }))!.tenantId,
        actorId,
        action: 'broadcast_sent',
        targetType: 'broadcast',
        metadata: { audience, type, message } as Prisma.InputJsonValue,
      },
    });

    // TODO: Integrate with actual notification system
    return { sent: true, audience, type };
  },

  async getFeatureAccess(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, settings: true, maxAiCalls: true, maxMembers: true } });
    if (!tenant) return null;
    const settings = tenant.settings as Record<string, unknown> ?? {};
    return {
      plan: tenant.plan,
      maxAiCalls: tenant.maxAiCalls,
      maxMembers: tenant.maxMembers,
      features: {
        missionEngine: true,
        brandDiscovery: true,
        brandDNA: true,
        socialSetup: true,
        contentEngine: tenant.plan !== 'free',
        videoProduction: ['pro', 'agency'].includes(tenant.plan),
        leadMagnet: tenant.plan !== 'free',
        webinar: ['pro', 'agency'].includes(tenant.plan),
        funnelBuilder: tenant.plan !== 'free',
        trafficEngine: ['pro', 'agency'].includes(tenant.plan),
        whatsappAI: tenant.plan !== 'free',
        crm: true,
        analytics: tenant.plan !== 'free',
        admin: true,
      },
      customFeatures: settings.features ?? {},
    };
  },
};
