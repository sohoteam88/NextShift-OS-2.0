import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { MemberAnalytics } from '@/modules/analytics/components/MemberAnalytics';
import { LeaderAnalytics } from '@/modules/analytics/components/LeaderAnalytics';
import { OperatorAnalytics } from '@/modules/analytics/components/OperatorAnalytics';
import type { AnalyticsPeriod } from '@/modules/analytics/types';

function parsePeriod(value: string | string[] | undefined): AnalyticsPeriod {
  const next = Array.isArray(value) ? value[0] : value;
  if (next === '7d' || next === '30d' || next === '90d') return next;
  return '30d';
}

type Props = {
  searchParams?: { period?: string | string[] };
};

export default async function AnalyticsPage({ searchParams }: Props) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  const initialPeriod = parsePeriod(searchParams?.period);

  if (user.role === 'member') {
    return <MemberAnalytics user={user} initialPeriod={initialPeriod} />;
  }

  if (user.role === 'leader') {
    return <LeaderAnalytics user={user} initialPeriod={initialPeriod} />;
  }

  return <OperatorAnalytics user={user} initialPeriod={initialPeriod} />;
}
