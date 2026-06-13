import { ContentEngineDashboard } from '@/modules/content-engine/components/ContentEngineDashboard';
import { FunnelSelector } from '@/components/funnel-operating-system/FunnelSelector';

export default function ContentEnginePage() {
  return (
    <div className="space-y-4 px-4 py-6">
      <FunnelSelector compact />
      <ContentEngineDashboard />
    </div>
  );
}
