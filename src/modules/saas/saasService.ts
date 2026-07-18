// SaaS Service — Feature gates, usage limits, subscriptions
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { PlanId, FeatureKey, FeatureGateResult, UsageLimitResult, Subscription, UpgradeRecommendation, ManualOverride } from './types';
import { PLANS, UPGRADE_PATHS } from './planDefinitions';
import { requirePlatformAdminDataAccess } from '@/lib/security/platform-data-authority';

// ---- Override Helpers ----
async function getOverride(tenantId: string): Promise<ManualOverride | null> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const settings = (t?.settings as Record<string, unknown>) ?? {};
  const override = settings.manual_override;
  return override && typeof override === 'object' ? (override as ManualOverride) : null;
}

function isOverrideActive(override: ManualOverride | null): boolean {
  if (!override?.enabled) return false;
  if (override.expiresAt) {
    const expiry = new Date(override.expiresAt);
    if (expiry < new Date()) return false;
  }
  return true;
}

export const saasService = {
  // ---- Feature Gate ----
  async canAccessFeature(userId: string, featureKey: FeatureKey): Promise<FeatureGateResult> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!user) return { allowed: false, reason: 'User not found' };

    // Check manual override first
    const override = await getOverride(user.tenantId);
    if (override && isOverrideActive(override)) {
      if (override.customFeatures?.includes(featureKey)) return { allowed: true };
      if (override.planOverride) {
        const plan = PLANS[override.planOverride];
        if (plan?.features.includes(featureKey)) return { allowed: true };
      }
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true } });
    const plan = PLANS[(tenant?.plan as string) ?? 'free'] ?? PLANS.free;
    if (plan.features.includes(featureKey)) return { allowed: true };
    const upgradePath = UPGRADE_PATHS[plan.id]?.[0] as PlanId | undefined;
    return { allowed: false, reason: `此功能需要${plan.name}以上计划`, requiredPlan: upgradePath, upgradeLink: '/saas' };
  },

  // ---- Usage Limits ----
  async checkUsageLimit(userId: string, metric: 'videos' | 'funnels' | 'leads'): Promise<UsageLimitResult> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!user) return { allowed: false, used: 0, limit: 0, remaining: 0 };
    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true } });
    const plan = PLANS[(tenant?.plan as string) ?? 'free'] ?? PLANS.free;
    const limits = plan.limits;
    let used = 0; let limit = 0;
    if (metric === 'videos') { used = await prisma.videoProject.count({ where: { userId } }); limit = limits.videosPerMonth; }
    else if (metric === 'funnels') { used = await prisma.funnel.count({ where: { tenantId: user.tenantId } }); limit = limits.funnels; }
    else if (metric === 'leads') { used = await prisma.lead.count({ where: { tenantId: user.tenantId, deletedAt: null } }); limit = limits.leads; }

    const remaining = Math.max(0, limit - used);
    const allowed = used < limit;
    return { allowed, used, limit, remaining, warning: remaining <= Math.ceil(limit * 0.2) ? `已使用${Math.round((used/limit)*100)}%，接近上限` : undefined };
  },

  // ---- AI Credits ----
  async checkAiCredits(userId: string): Promise<UsageLimitResult> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!user) return { allowed: false, used: 0, limit: 0, remaining: 0 };

    // Check manual override for custom credit limit
    const override = await getOverride(user.tenantId);
    if (override && isOverrideActive(override) && override.customAiCredits) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const used = await prisma.aIUsageLog.count({ where: { tenantId: user.tenantId, createdAt: { gte: monthStart } } });
      const remaining = Math.max(0, override.customAiCredits - used);
      return { allowed: used < override.customAiCredits, used, limit: override.customAiCredits, remaining, warning: remaining <= Math.ceil(override.customAiCredits * 0.2) ? 'AI额度即将用完（手动额度）' : undefined };
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true, maxAiCalls: true } });
    const plan = PLANS[(tenant?.plan as string) ?? 'free'] ?? PLANS.free;
    const limit = tenant?.maxAiCalls ?? plan.limits.aiCredits;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const used = await prisma.aIUsageLog.count({ where: { tenantId: user.tenantId, createdAt: { gte: monthStart } } });
    const remaining = Math.max(0, limit - used);
    return { allowed: used < limit, used, limit, remaining, warning: remaining <= Math.ceil(limit * 0.2) ? 'AI额度即将用完' : undefined };
  },

  // ---- Subscription ----
  async getSubscription(tenantId: string): Promise<Subscription> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, status: true, maxAiCalls: true, maxMembers: true } });
    const plan = PLANS[(tenant?.plan as string) ?? 'free'] ?? PLANS.free;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const aiUsed = await prisma.aIUsageLog.count({ where: { tenantId, createdAt: { gte: monthStart } } });
    const seatsUsed = await prisma.user.count({ where: { tenantId, deletedAt: null } });
    const videosUsed = await prisma.videoProject.count({ where: { tenantId } });
    const funnelsUsed = await prisma.funnel.count({ where: { tenantId } });
    const leadsUsed = await prisma.lead.count({ where: { tenantId, deletedAt: null } });
    return { plan: plan.id, status: (tenant?.status as Subscription['status']) ?? 'active', aiCreditsUsed: aiUsed, aiCreditsLimit: tenant?.maxAiCalls ?? plan.limits.aiCredits, seatsUsed, seatsLimit: tenant?.maxMembers ?? plan.limits.seats, videosUsed, videosLimit: plan.limits.videosPerMonth, funnelsUsed, funnelsLimit: plan.limits.funnels, leadsUsed, leadsLimit: plan.limits.leads };
  },

  async updatePlan(tenantId: string, planId: PlanId) {
    const plan = PLANS[planId];
    if (!plan) throw new Error('Invalid plan');
    return prisma.tenant.update({ where: { id: tenantId }, data: { plan: planId, maxAiCalls: plan.limits.aiCredits, maxMembers: plan.limits.seats } });
  },

  // ---- Upgrade Recommendations ----
  async getUpgradeRecommendations(userId: string): Promise<UpgradeRecommendation[]> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!user) return [];
    const sub = await this.getSubscription(user.tenantId);
    const recs: UpgradeRecommendation[] = [];
    const aiCheck = await this.checkAiCredits(userId);

    if (aiCheck.remaining <= aiCheck.limit * 0.2) {
      const nextPlan = UPGRADE_PATHS[sub.plan]?.[0] as PlanId | undefined;
      if (nextPlan) recs.push({ id: 'ai_limit', reason: `已使用${aiCheck.used}/${aiCheck.limit} AI额度`, currentPlan: sub.plan, targetPlan: nextPlan, benefit: `升级后获得${PLANS[nextPlan].limits.aiCredits}额度`, urgency: 'high' });
    }

    if (sub.leadsUsed >= sub.leadsLimit * 0.8) {
      const nextPlan = UPGRADE_PATHS[sub.plan]?.[0] as PlanId | undefined;
      if (nextPlan) recs.push({ id: 'lead_limit', reason: `Lead接近上限(${sub.leadsUsed}/${sub.leadsLimit})`, currentPlan: sub.plan, targetPlan: nextPlan, benefit: `扩展Lead容量到${PLANS[nextPlan].limits.leads}`, urgency: 'medium' });
    }

    return recs;
  },

  // ---- Manual Admin Override ----
  async getManualOverride(tenantId: string): Promise<ManualOverride | null> {
    await requirePlatformAdminDataAccess();
    return getOverride(tenantId);
  },

  async setManualOverride(tenantId: string, override: ManualOverride, actorId: string): Promise<ManualOverride> {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    const settings = (t?.settings as Record<string, unknown>) ?? {};
    const updated: ManualOverride = { ...override, grantedBy: actorId, grantedAt: override.grantedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    await prisma.tenant.update({ where: { id: tenantId }, data: { settings: { ...settings, manual_override: updated as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });

    // Audit log
    await prisma.auditLog.create({ data: { tenantId, actorId, action: override.enabled ? 'override_granted' : 'override_revoked', targetType: 'tenant', targetId: tenantId, metadata: { planOverride: override.planOverride, features: override.customFeatures } as Prisma.InputJsonValue } });
    return updated;
  },

  async revokeOverride(tenantId: string, actorId: string): Promise<void> {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
    const settings = (t?.settings as Record<string, unknown>) ?? {};
    await prisma.tenant.update({ where: { id: tenantId }, data: { settings: { ...settings, manual_override: null as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
    await prisma.auditLog.create({ data: { tenantId, actorId, action: 'override_revoked', targetType: 'tenant', targetId: tenantId } });
  },

  async getOverrideExpiryWarnings(): Promise<Array<{ tenantId: string; tenantName: string; expiresAt: string; daysLeft: number }>> {
    await requirePlatformAdminDataAccess();
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, settings: true } });
    const warnings: Array<{ tenantId: string; tenantName: string; expiresAt: string; daysLeft: number }> = [];
    const now = new Date();
    for (const t of tenants) {
      const settings = (t.settings as Record<string, unknown>) ?? {};
      const override = settings.manual_override as ManualOverride | null;
      if (override?.enabled && override.expiresAt) {
        const expiry = new Date(override.expiresAt);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
        if (daysLeft <= 3 && daysLeft > 0) {
          warnings.push({ tenantId: t.id, tenantName: t.name, expiresAt: override.expiresAt, daysLeft });
        }
      }
    }
    return warnings;
  },
};
