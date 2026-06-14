// Tenant Health — Tenant scoring and churn risk analysis

import { clamp } from './ai-profitability';

export type TenantHealthRecord = {
  id: string; name: string; slug: string; plan: string;
  users: number; funnels: number; leads: number; activity: number;
  healthScore: number; revenue: number; churnRisk: string; riskSignals: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
function daysAgo(days: number) { return new Date(Date.now() - days * DAY_MS); }

export type ChurnRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

function riskLevel(score: number, signals: string[]): ChurnRiskLevel {
  if (score < 35 || signals.length >= 4) return 'Critical';
  if (score < 55 || signals.length >= 3) return 'High';
  if (score < 75 || signals.length >= 1) return 'Medium';
  return 'Low';
}

export function computeTenantHealth(
  tenants: Array<{ id: string; name: string; slug: string; plan: string; status: string }>,
  usersByTenant: Map<string, Array<{ id: string; userProgress?: { lastActivityAt?: Date } | null; updatedAt: Date }>>,
  funnelsByTenant: Map<string, Array<{ id: string; views: number }>>,
  contentsByTenant: Map<string, Array<{ createdAt: Date }>>,
  customersByTenant: Map<string, Array<{ id: string }>>,
  leadsByTenant: Map<string, number>,
  aiTenantMap: Map<string, { calls: number; cost: number }>,
): TenantHealthRecord[] {
  const fourteenDaysAgo = daysAgo(14);

  return tenants.map(tenant => {
    const tenantUsers = usersByTenant.get(tenant.id) ?? [];
    const tenantFunnels = funnelsByTenant.get(tenant.id) ?? [];
    const tenantContents = contentsByTenant.get(tenant.id) ?? [];
    const tenantCustomers = customersByTenant.get(tenant.id) ?? [];
    const tenantLeads = leadsByTenant.get(tenant.id) ?? 0;
    const recentUsers = tenantUsers.filter(u => (u.userProgress?.lastActivityAt ?? u.updatedAt) >= fourteenDaysAgo).length;
    const recentContent = tenantContents.filter(c => c.createdAt >= fourteenDaysAgo).length;
    const funnelViews = tenantFunnels.reduce((s, f) => s + f.views, 0);
    const signals: string[] = [];
    if (tenantUsers.length > 0 && recentUsers === 0) signals.push('No login 14 days');
    if (recentContent === 0) signals.push('No content 14 days');
    if (tenantFunnels.length > 0 && funnelViews === 0) signals.push('No funnel activity');
    if ((aiTenantMap.get(tenant.id)?.calls ?? 0) === 0) signals.push('Declining AI usage');
    const healthScore = clamp(
      (tenant.status === 'active' ? 20 : 0) +
        (tenantUsers.length ? Math.min(25, (recentUsers / tenantUsers.length) * 25) : 8) +
        (tenantLeads > 0 ? 18 : 4) +
        (tenantFunnels.length > 0 && funnelViews > 0 ? 17 : 5) +
        (recentContent > 0 ? 12 : 2) +
        (tenantCustomers.length > 0 ? 8 : 2),
    );
    return {
      id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan,
      users: tenantUsers.length, funnels: tenantFunnels.length, leads: tenantLeads,
      activity: recentUsers + recentContent + (aiTenantMap.get(tenant.id)?.calls ?? 0),
      healthScore,
      revenue: tenant.status === 'active' ? (() => { const mrr: Record<string, number> = { starter: 0, growth: 149, pro: 399, enterprise: 999 }; return mrr[tenant.plan] ?? 0; })() : 0,
      churnRisk: riskLevel(healthScore, signals),
      riskSignals: signals,
    };
  }).sort((a, b) => a.healthScore - b.healthScore);
}
