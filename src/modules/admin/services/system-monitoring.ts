// System Monitoring — Growth windows, alerts, and funnel analysis

import { clamp } from './ai-profitability';
import type { TenantHealthRecord } from './tenant-health';

const DAY_MS = 24 * 60 * 60 * 1000;
function daysAgo(days: number) { return new Date(Date.now() - days * DAY_MS); }

type GrowthWindow = {
  label: string;
  newUsers: number;
  newTenants: number;
  activationPercent: number;
  contentPercent: number;
  leadPercent: number;
  customerPercent: number;
  memberPercent: number;
};

export function computeGrowthWindow(
  label: string, days: number,
  users: Array<{ createdAt: Date; status: string; sponsorId?: string | null }>,
  tenants: Array<{ id: string; createdAt: Date }>,
  contents: Array<{ createdAt: Date; ownerId: string }>,
  leadGroups: Array<{ tenantId: string; _count: { _all: number } }>,
  customers: Array<{ createdAt: Date; tenantId: string }>,
): GrowthWindow {
  const since = daysAgo(days);
  const newUsers = users.filter(u => u.createdAt >= since).length;
  const newTenants = tenants.filter(t => t.createdAt >= since).length;
  const activated = users.filter(u => u.createdAt >= since && u.status === 'active').length;
  const contentUsers = new Set(contents.filter(c => c.createdAt >= since).map(c => c.ownerId)).size;
  const leadTenants = new Set(leadGroups.filter(r => r._count._all > 0).map(r => r.tenantId)).size;
  const customerTenants = new Set(customers.filter(c => c.createdAt >= since).map(c => c.tenantId)).size;
  return {
    label, newUsers, newTenants,
    activationPercent: newUsers ? clamp((activated / newUsers) * 100) : 0,
    contentPercent: newUsers ? clamp((contentUsers / newUsers) * 100) : 0,
    leadPercent: tenants.length ? clamp((leadTenants / tenants.length) * 100) : 0,
    customerPercent: tenants.length ? clamp((customerTenants / tenants.length) * 100) : 0,
    memberPercent: newUsers ? clamp((users.filter(u => u.sponsorId && u.createdAt >= since).length / newUsers) * 100) : 0,
  };
}

export type FounderAlertPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type FounderAlert = { title: string; description: string; priority: FounderAlertPriority; href: string };

export function computeAlerts(
  tenantHealth: TenantHealthRecord[],
  grossMargin: number,
  mrr: number,
  previousMrr: number,
  activeTenants: number,
  totalTenants: number,
): FounderAlert[] {
  const alerts: FounderAlert[] = [
    ...tenantHealth
      .filter(t => t.churnRisk === 'Critical' || t.churnRisk === 'High')
      .slice(0, 5)
      .map(t => ({ title: `${t.name} churn risk`, description: `${t.healthScore}/100 health · ${t.riskSignals.join(', ') || 'low activity'}`, priority: t.churnRisk === 'Critical' ? 'Critical' as const : 'High' as const, href: '/superadmin/tenant-health' })),
    ...(grossMargin > 0 && grossMargin < 60 ? [{ title: 'AI cost spike', description: `Gross margin is ${grossMargin}%`, priority: 'High' as const, href: '/superadmin/ai-profitability' }] : []),
    ...(mrr < previousMrr ? [{ title: 'Revenue drop', description: 'MRR is lower than previous period estimate.', priority: 'Critical' as const, href: '/superadmin/revenue' }] : []),
    ...(activeTenants < totalTenants ? [{ title: 'Inactive tenant', description: `${totalTenants - activeTenants} tenants are not active.`, priority: 'Medium' as const, href: '/superadmin/tenant-health' }] : []),
  ];
  return alerts.length > 0 ? alerts : [{ title: 'Platform stable', description: 'No critical founder alerts detected.', priority: 'Low', href: '/superadmin' }];
}

export function computeFunnelAnalysis(
  funnels: Array<{ id: string; title: string; views: number; conversions: number; status: string; publishedAt?: Date | null }>,
  tenants: Array<{ id: string; status: string; plan: string }>,
  customersByTenant: Map<string, Array<{ id: string }>>,
  appointmentsByTenant: Map<string, number>,
  usersByTenant: Map<string, Array<{ sponsorId?: string | null }>>,
) {
  function classifyFunnel(title: string) {
    const v = title.toLowerCase();
    if (v.includes('recruit') || v.includes('member') || v.includes('team')) return 'Recruitment Funnel';
    if (v.includes('upgrade') || v.includes('upsell')) return 'Upgrade Funnel';
    return 'Retail Funnel';
  }

  const mrr: Record<string, number> = { starter: 0, growth: 149, pro: 399, enterprise: 999 };
  const buckets = new Map<string, { leads: number; appointments: number; customers: number; members: number; revenue: number; conversion: number }>();
  for (const type of ['Retail Funnel', 'Recruitment Funnel', 'Upgrade Funnel']) {
    buckets.set(type, { leads: 0, appointments: 0, customers: 0, members: 0, revenue: 0, conversion: 0 });
  }
  for (const f of funnels) {
    const b = buckets.get(classifyFunnel(f.title)); if (!b) continue;
    b.leads += f.conversions;
    b.conversion += f.views > 0 ? f.conversions / f.views : 0;
  }
  for (const t of tenants) {
    const b = buckets.get('Retail Funnel'); if (!b) continue;
    b.customers += customersByTenant.get(t.id)?.length ?? 0;
    b.appointments += appointmentsByTenant.get(t.id) ?? 0;
    b.members += (usersByTenant.get(t.id) ?? []).filter(u => u.sponsorId).length;
    b.revenue += t.status === 'active' ? (mrr[t.plan] ?? 0) : 0;
  }
  const rows = Array.from(buckets.entries()).map(([type, v]) => ({ type, ...v, conversion: v.leads > 0 ? clamp((v.customers / v.leads) * 100) : 0 }));
  const bestFunnel = [...rows].sort((a, b) => b.conversion - a.conversion)[0]?.type ?? 'None';
  const worstFunnel = [...rows].sort((a, b) => a.conversion - b.conversion)[0]?.type ?? 'None';
  return { bestFunnel, worstFunnel, rows };
}
