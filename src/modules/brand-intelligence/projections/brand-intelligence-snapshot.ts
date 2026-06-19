import type { BrandIntelligenceSnapshot } from '../types/brand-intelligence';

export async function getBrandIntelligenceSnapshot(_userId: string): Promise<BrandIntelligenceSnapshot> {
  return {
    overallScore: 74,
    health: {
      identity: 86,
      audience: 72,
      offer: 68,
      content: 75,
      visual: 69,
    },
    recommendations: [
      {
        id: 'rec-1',
        title: 'Health Score',
        priority: 'high',
        reason: 'Core intelligence metrics will be wired in during the next migration phase.',
        status: 'coming_soon',
      },
      {
        id: 'rec-2',
        title: 'Advisor',
        priority: 'medium',
        reason: 'Advisor recommendations will move into this module after capability migration starts.',
        status: 'coming_soon',
      },
      {
        id: 'rec-3',
        title: 'Regeneration',
        priority: 'medium',
        reason: 'Regeneration will remain in Brand DNA Studio until V6.4F.',
        status: 'coming_soon',
      },
    ],
    recentChanges: [
      {
        id: 'change-1',
        title: 'Module shell created',
        detail: 'Brand Intelligence now has a runtime route and dedicated module boundary.',
        date: 'Today',
      },
      {
        id: 'change-2',
        title: 'Navigation surfaced',
        detail: 'Brand Intelligence is visible from the Brand Builder navigation.',
        date: 'Today',
      },
    ],
    versions: [
      {
        id: 'version-1',
        label: 'v0.1 Shell',
        summary: 'Placeholder intelligence surface with no feature migration.',
        createdAt: 'Today',
      },
    ],
  };
}
