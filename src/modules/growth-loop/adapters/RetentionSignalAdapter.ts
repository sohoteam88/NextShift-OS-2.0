import type { RetentionSegment, RetentionSignal } from '../contracts/RetentionSignal';

export interface RetentionSignalInput {
  userId: string;
  tenantId: string;
  leadCount: number;
  customerCount: number;
  overdueFollowups: number;
  dueTodayFollowups: number;
  upcomingFollowups: number;
  recentActivityCount: number;
  generatedAt: string;
}

function retentionSegments(input: RetentionSignalInput): RetentionSegment[] {
  const segments: RetentionSegment[] = [];
  if (input.leadCount > 0) segments.push('active_leads');
  if (input.overdueFollowups > 0) segments.push('overdue_followup');
  if (input.customerCount > 0) segments.push('customers');
  return segments.length > 0 ? segments : ['new_leads'];
}

function retentionScore(input: RetentionSignalInput): number {
  const base = input.leadCount > 0 || input.customerCount > 0 ? 35 : 0;
  const activity = Math.min(input.recentActivityCount * 5, 25);
  const customer = Math.min(input.customerCount * 10, 30);
  const penalty = Math.min(input.overdueFollowups * 10, 30);
  return Math.max(Math.min(base + activity + customer - penalty, 100), 0);
}

export function adaptRetentionSignals(input: RetentionSignalInput): RetentionSignal[] {
  const score = retentionScore(input);

  return [{
    source: 'GrowthLoop.RetentionSignalAdapter',
    scope: 'user',
    confidence: score > 0 ? 'derived' : 'fallback',
    fallback: score > 0 ? 'none' : 'no_retention_signals_found',

    id: `growth-retention-${input.userId}`,
    domain: 'retention',
    status: score === 0 ? 'missing' : input.overdueFollowups > 0 ? 'blocked' : 'active',
    score,
    summary: `${input.overdueFollowups} overdue followups, ${input.customerCount} customers, ${input.recentActivityCount} recent activities.`,
    metrics: [
      { key: 'overdue_followups', label: 'Overdue followups', value: input.overdueFollowups, unit: 'count' },
      { key: 'due_today_followups', label: 'Due today followups', value: input.dueTodayFollowups, unit: 'count' },
      { key: 'upcoming_followups', label: 'Upcoming followups', value: input.upcomingFollowups, unit: 'count' },
      { key: 'recent_activity_count', label: 'Recent activity count', value: input.recentActivityCount, unit: 'count' },
      { key: 'customer_count', label: 'Customer count', value: input.customerCount, unit: 'count' },
    ],
    evidence: [
      {
        source: 'Lead/Activity/Customer read models',
        description: 'Read-only retention facts aggregated from followups, activities, and customers.',
        observedAt: input.generatedAt,
      },
    ],
    recommendations: input.overdueFollowups === 0 ? [] : [{
      id: 'growth-retention-clear-overdue-followups',
      title: 'Clear overdue followups',
      summary: 'Resolve overdue followups before adding new acquisition volume.',
      priority: 'high',
      route: '/customers',
      owner: 'growth-loop',
    }],
    generatedAt: input.generatedAt,
    segments: retentionSegments(input),
    followups: {
      overdue: input.overdueFollowups,
      dueToday: input.dueTodayFollowups,
      upcoming: input.upcomingFollowups,
    },
    atRiskCount: input.overdueFollowups,
    retainedCount: input.customerCount,
    retentionRate: input.leadCount > 0 ? Math.round((input.customerCount / input.leadCount) * 100) : undefined,
  }];
}
