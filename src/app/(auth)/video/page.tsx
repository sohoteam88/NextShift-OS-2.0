import { CapabilityViewNavigation } from '@/components/navigation/CapabilityViewNavigation';
import { VideoProjectsList } from '@/modules/video/components/VideoProjectsList';
import { VideoProductionDashboard } from '@/modules/video-production/components/VideoProductionDashboard';
import { resolveVideoView } from '@/lib/navigation/merged-capability-views';

const views = [
  { id: 'projects', label: '视频项目', href: '/video' },
  { id: 'production', label: '视频制作', href: '/video?view=production' },
] as const;

export default async function VideoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const activeView = resolveVideoView((await searchParams)?.view);
  return (
    <div className="px-4 py-6">
      <CapabilityViewNavigation activeId={activeView} items={views} label="Video views" />
      {activeView === 'production' ? <VideoProductionDashboard /> : <VideoProjectsList />}
    </div>
  );
}
