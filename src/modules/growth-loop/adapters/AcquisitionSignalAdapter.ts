import type { AcquisitionChannel, AcquisitionSignal } from '../contracts/AcquisitionSignal';

export interface AcquisitionSignalInput {
  userId: string;
  tenantId: string;
  leadCount: number;
  funnelCount: number;
  publishedFunnelCount: number;
  funnelViews: number;
  funnelConversions: number;
  contentCount: number;
  generatedAt: string;
}

function scoreAcquisition(input: AcquisitionSignalInput): number {
  const leadScore = Math.min(input.leadCount * 10, 40);
  const funnelScore = input.publishedFunnelCount > 0 ? 20 : input.funnelCount > 0 ? 10 : 0;
  const trafficScore = Math.min(input.funnelViews, 20);
  const contentScore = Math.min(input.contentCount * 5, 20);
  return Math.min(leadScore + funnelScore + trafficScore + contentScore, 100);
}

function acquisitionChannels(input: AcquisitionSignalInput): AcquisitionChannel[] {
  const channels: AcquisitionChannel[] = [];
  if (input.contentCount > 0) channels.push('content');
  if (input.funnelCount > 0) channels.push('funnel');
  if (input.funnelViews > 0) channels.push('traffic');
  if (input.leadCount > 0) channels.push('crm');
  return channels.length > 0 ? channels : ['unknown'];
}

export function adaptAcquisitionSignals(input: AcquisitionSignalInput): AcquisitionSignal[] {
  const score = scoreAcquisition(input);

  return [{
    source: 'GrowthLoop.AcquisitionSignalAdapter',
    scope: 'user',
    confidence: score > 0 ? 'derived' : 'fallback',
    fallback: score > 0 ? 'none' : 'no_acquisition_signals_found',

    id: `growth-acquisition-${input.userId}`,
    domain: 'acquisition',
    status: score === 0 ? 'missing' : score >= 70 ? 'active' : 'ready',
    score,
    summary: `${input.leadCount} leads, ${input.publishedFunnelCount} published funnels, ${input.funnelViews} funnel views.`,
    metrics: [
      { key: 'lead_count', label: 'Lead count', value: input.leadCount, unit: 'count' },
      { key: 'published_funnel_count', label: 'Published funnels', value: input.publishedFunnelCount, unit: 'count' },
      { key: 'funnel_views', label: 'Funnel views', value: input.funnelViews, unit: 'count' },
      { key: 'funnel_conversions', label: 'Funnel conversions', value: input.funnelConversions, unit: 'count' },
      { key: 'content_count', label: 'Content count', value: input.contentCount, unit: 'count' },
    ],
    evidence: [
      {
        source: 'Lead/Funnel/Content read models',
        description: 'Read-only acquisition facts aggregated from leads, funnels, and content.',
        observedAt: input.generatedAt,
      },
    ],
    recommendations: score >= 70 ? [] : [{
      id: 'growth-acquisition-next-asset',
      title: 'Strengthen acquisition entry points',
      summary: 'Add or improve content, traffic, and funnel assets before treating acquisition as active.',
      priority: score === 0 ? 'high' : 'medium',
      route: '/content-engine',
      owner: 'growth-loop',
    }],
    generatedAt: input.generatedAt,
    channels: acquisitionChannels(input),
    assets: [
      {
        id: 'funnels',
        type: 'funnel',
        name: 'Funnels',
        status: input.publishedFunnelCount > 0 ? 'published' : input.funnelCount > 0 ? 'draft' : 'missing',
        route: '/funnel',
      },
      {
        id: 'content',
        type: 'content',
        name: 'Content',
        status: input.contentCount > 0 ? 'active' : 'missing',
        route: '/content-engine',
      },
    ],
    leadCount: input.leadCount,
    conversionRate: input.funnelViews > 0 ? Math.round((input.funnelConversions / input.funnelViews) * 100) : undefined,
    primaryBottleneck: score >= 70 ? undefined : 'Insufficient acquisition signal density',
  }];
}
