import type { ReactNode } from 'react';
import AiProfitability from '@/app/(auth)/platform-admin/ai-profitability/page';
import AiUsage from '@/app/(auth)/platform-admin/ai-usage/page';
import AuditLogs from '@/app/(auth)/platform-admin/audit-logs/page';
import Beta from '@/app/(auth)/platform-admin/beta/page';
import Billing from '@/app/(auth)/platform-admin/billing/page';
import Founder from '@/app/(auth)/platform-admin/founder/page';
import Funnels from '@/app/(auth)/platform-admin/funnels/page';
import Growth from '@/app/(auth)/platform-admin/growth/page';
import Health from '@/app/(auth)/platform-admin/health/page';
import Revenue from '@/app/(auth)/platform-admin/revenue/page';
import TenantHealth from '@/app/(auth)/platform-admin/tenant-health/page';
import Users from '@/app/(auth)/platform-admin/users/page';
import { notFound } from 'next/navigation';

type Page = () => ReactNode | Promise<ReactNode>;

const pages: Record<string, Page> = {
  'ai-profitability': AiProfitability, 'ai-usage': AiUsage, 'audit-logs': AuditLogs,
  beta: Beta, billing: Billing, founder: Founder, funnels: Funnels, growth: Growth,
  health: Health, revenue: Revenue, 'tenant-health': TenantHealth, users: Users,
};

export default async function SuperadminCapabilityPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.length !== 1 || !pages[path[0]]) notFound();
  const Page = pages[path[0]];
  return await Page();
}
