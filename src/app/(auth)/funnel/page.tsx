import { CapabilityViewNavigation } from '@/components/navigation/CapabilityViewNavigation';
import { FunnelBuilderDashboard } from '@/modules/funnel/components/FunnelBuilderDashboard';
import { FunnelContextDashboard } from '@/modules/funnel/components/dashboard/FunnelContextDashboard';
import { resolveFunnelView } from '@/lib/navigation/merged-capability-views';

const views = [
  { id: 'builder', label: '漏斗建构', href: '/funnel' },
  { id: 'context', label: '多漏斗管理', href: '/funnel?view=context' },
] as const;

export default async function FunnelPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const activeView = resolveFunnelView((await searchParams)?.view);
  return (
    <div className="px-4 py-6">
      <CapabilityViewNavigation activeId={activeView} items={views} label="Funnel views" />
      {activeView === 'context' ? <FunnelContextDashboard /> : <FunnelBuilderDashboard />}
    </div>
  );
}
