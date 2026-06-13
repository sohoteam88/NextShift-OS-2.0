// Funnel Next Action Engine
import type { FunnelType } from '@/modules/funnel-context/types';
import type { FunnelNextAction } from './types';

export function getNextAction(
  funnelType: FunnelType,
  contentCount: number, videoCount: number,
  funnelExists: boolean, leadCount: number, customerCount: number,
): FunnelNextAction {
  if (contentCount === 0) return { action: 'Publish First Content', expectedImpact: 'Start building audience', route: '/content-engine' };
  if (videoCount === 0) return { action: 'Generate First Video', expectedImpact: '+5 Leads', route: '/video-production' };
  if (!funnelExists) return { action: 'Build Lead Magnet + Funnel', expectedImpact: 'Enable conversion', route: '/lead-magnet' };
  if (leadCount === 0) return { action: 'Launch Traffic / Start Posting', expectedImpact: 'Generate first leads', route: '/traffic-engine' };
  if (customerCount === 0) return { action: 'Follow Up Hot Leads', expectedImpact: '+1 Customer', route: '/whatsapp-ai' };

  if (funnelType === 'recruitment') return { action: 'Invite Leads To Webinar', expectedImpact: '+2 Calls', route: '/webinar-center' };
  if (funnelType === 'upgrade') return { action: 'Invite Customer To Opportunity Webinar', expectedImpact: '+1 Member', route: '/webinar-center' };
  return { action: 'Generate Video Content', expectedImpact: '+5 Leads', route: '/video-production' };
}
