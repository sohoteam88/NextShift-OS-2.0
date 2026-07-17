import { redirect } from 'next/navigation';
import { CapabilityViewNavigation } from '@/components/navigation/CapabilityViewNavigation';
import { IntelligenceDashboard } from '@/modules/analytics/components/IntelligenceDashboard';
import { MemberAnalytics } from '@/modules/analytics/components/MemberAnalytics';
import { LeaderAnalytics } from '@/modules/analytics/components/LeaderAnalytics';
import { OperatorAnalytics } from '@/modules/analytics/components/OperatorAnalytics';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { resolveAnalyticsPeriod, resolveAnalyticsView } from '@/lib/navigation/merged-capability-views';

const views = [
  { id: 'overview', label: '洞察中心', href: '/analytics-center' },
  { id: 'role', label: '角色分析', href: '/analytics-center?view=role' },
] as const;

export default async function AnalyticsCenterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const activeView = resolveAnalyticsView(params?.view);
  const initialPeriod = resolveAnalyticsPeriod(params?.period);

  let content = <IntelligenceDashboard />;
  if (activeView === 'role') {
    if (user.role === 'member') content = <MemberAnalytics user={user} initialPeriod={initialPeriod} />;
    else if (user.role === 'leader') content = <LeaderAnalytics user={user} initialPeriod={initialPeriod} />;
    else content = <OperatorAnalytics user={user} initialPeriod={initialPeriod} />;
  }

  return (
    <div className="px-4 py-6">
      <CapabilityViewNavigation activeId={activeView} items={views} label="Analytics views" />
      {content}
    </div>
  );
}
