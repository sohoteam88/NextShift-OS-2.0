import { CANONICAL_ROUTES } from '@/config/canonical-routes';
import type {
  BottleneckResult,
  DashboardPriority,
  MissionBottleneck,
  MissionType,
  PriorityCategory,
  PriorityResult,
} from '../contracts/MissionAuthority';

type PriorityCandidate = {
  action: string;
  reason: string;
  expectedImpact: string;
  category: PriorityCategory;
  missionType: MissionType;
  route: string;
  ctaLabel: string;
  impact: number;
  revenueProximity: number;
  relevance: number;
};

type PriorityDefinition = {
  defaultCandidate: PriorityCandidate;
  alternatives?: PriorityCandidate[];
};

export type PriorityHistoryEntry = {
  priorityAction: string;
  bottleneck: MissionBottleneck;
  completionStatus: string;
  resolved: boolean;
};

type ScoredPriorityCandidate = {
  priority: PriorityCandidate;
  baseScore: number;
  penalty: number;
  finalScore: number;
  dedupReason?: string;
};

const DEDUP_PENALTY = 30;

const URGENCY_SCORE: Record<DashboardPriority, number> = {
  Critical: 100,
  High: 75,
  Normal: 45,
};

const REVENUE_PROXIMITY: Record<MissionBottleneck, number> = {
  NO_BRAND: 10,
  NO_POSITIONING: 20,
  NO_CONTENT: 30,
  NO_AUDIENCE: 35,
  NO_LEAD_MAGNET: 45,
  NO_FUNNEL: 55,
  NO_TRAFFIC: 65,
  NO_LEADS: 70,
  NO_CONVERSION: 90,
  NO_CUSTOMERS: 95,
  NO_RETENTION: 85,
  BUSINESS_HEALTHY: 60,
  NO_SYSTEM: 80,
  NO_TEAM: 75,
};

function priorityCandidate(input: {
  action: string;
  reason: string;
  expectedImpact: string;
  category: PriorityCategory;
  missionType: MissionType;
  route: string;
  ctaLabel: string;
  impact: number;
  revenueProximity: number;
  relevance?: number;
}): PriorityCandidate {
  return {
    relevance: 100,
    ...input,
  };
}

const PRIORITY_BY_BOTTLENECK: Record<MissionBottleneck, PriorityDefinition> = {
  NO_BRAND: {
    defaultCandidate: priorityCandidate({
      action: 'Complete AI Interview',
      reason: 'The AI COO needs verified business context before it can rank growth actions reliably.',
      expectedImpact: 'Business context becomes available for accurate mission and growth decisions.',
      category: 'FOUNDATION',
      missionType: 'BRAND',
      route: CANONICAL_ROUTES.brandInterview,
      ctaLabel: '开始 AI 访谈',
      impact: 95,
      revenueProximity: REVENUE_PROXIMITY.NO_BRAND,
    }),
  },
  NO_POSITIONING: {
    defaultCandidate: priorityCandidate({
      action: 'Define Market Position',
      reason: 'Positioning must be clear before content, funnels, or traffic can speak to the right buyer.',
      expectedImpact: 'The business gets a sharper audience, offer promise, and conversion angle.',
      category: 'FOUNDATION',
      missionType: 'POSITIONING',
      route: CANONICAL_ROUTES.brandProfile,
      ctaLabel: '确认 Brand DNA',
      impact: 90,
      revenueProximity: REVENUE_PROXIMITY.NO_POSITIONING,
    }),
  },
  NO_CONTENT: {
    defaultCandidate: priorityCandidate({
      action: 'Build Content Foundation',
      reason: 'Without a content base, the market has no repeatable reason to discover or trust the offer.',
      expectedImpact: 'The business can start attracting and educating the right audience.',
      category: 'CONTENT',
      missionType: 'CONTENT',
      route: CANONICAL_ROUTES.contentEngine,
      ctaLabel: '打开内容引擎',
      impact: 85,
      revenueProximity: REVENUE_PROXIMITY.NO_CONTENT,
    }),
  },
  NO_AUDIENCE: {
    defaultCandidate: priorityCandidate({
      action: 'Publish Audience Growth Content',
      reason: 'The content system needs to reach and attract the right audience before lead capture can scale.',
      expectedImpact: 'Audience reach and engagement increase around the validated market position.',
      category: 'CONTENT',
      missionType: 'CONTENT',
      route: CANONICAL_ROUTES.contentEngine,
      ctaLabel: '发布受众增长内容',
      impact: 82,
      revenueProximity: REVENUE_PROXIMITY.NO_AUDIENCE,
    }),
  },
  NO_LEAD_MAGNET: {
    defaultCandidate: priorityCandidate({
      action: 'Create Lead Magnet',
      reason: 'The business needs a clear reason for visitors to leave contact information before traffic is scaled.',
      expectedImpact: 'Qualified visitors can become leads through a concrete opt-in asset.',
      category: 'LEADS',
      missionType: 'LEAD_MAGNET',
      route: CANONICAL_ROUTES.leadMagnet,
      ctaLabel: '生成引流资源',
      impact: 88,
      revenueProximity: REVENUE_PROXIMITY.NO_LEAD_MAGNET,
    }),
  },
  NO_FUNNEL: {
    defaultCandidate: priorityCandidate({
      action: 'Build Funnel',
      reason: 'Lead capture assets need a working landing page, thank-you path, and follow-up route before traffic is useful.',
      expectedImpact: 'The business has a conversion path that can receive real traffic.',
      category: 'LEADS',
      missionType: 'FUNNEL',
      route: CANONICAL_ROUTES.funnel,
      ctaLabel: '生成双漏斗落地页',
      impact: 90,
      revenueProximity: REVENUE_PROXIMITY.NO_FUNNEL,
    }),
  },
  NO_TRAFFIC: {
    defaultCandidate: priorityCandidate({
      action: 'Activate Traffic Source',
      reason: 'Your funnel and lead magnet are ready. Without traffic, no new leads can enter the system.',
      expectedImpact: 'A traffic source creates the fastest path to new leads and growth feedback.',
      category: 'LEADS',
      missionType: 'TRAFFIC',
      route: CANONICAL_ROUTES.trafficEngine,
      ctaLabel: '启动流量测试',
      impact: 90,
      revenueProximity: REVENUE_PROXIMITY.NO_TRAFFIC,
    }),
  },
  NO_LEADS: {
    defaultCandidate: priorityCandidate({
      action: 'Improve Lead Capture',
      reason: 'Traffic exists, but the capture flow is not turning visitors into leads.',
      expectedImpact: 'More qualified visitors enter the follow-up system as leads.',
      category: 'LEADS',
      missionType: 'FUNNEL',
      route: CANONICAL_ROUTES.funnel,
      ctaLabel: '改善 Lead Capture',
      impact: 86,
      revenueProximity: REVENUE_PROXIMITY.NO_LEADS,
    }),
  },
  NO_CONVERSION: {
    defaultCandidate: priorityCandidate({
      action: 'Improve Offer',
      reason: 'Existing leads are closest to revenue, so fixing the offer creates more leverage than adding traffic.',
      expectedImpact: 'More qualified leads understand the value and move toward purchase.',
      category: 'CONVERSION',
      missionType: 'CUSTOMERS',
      route: CANONICAL_ROUTES.sales,
      ctaLabel: '改善 Offer',
      impact: 94,
      revenueProximity: REVENUE_PROXIMITY.NO_CONVERSION,
    }),
  },
  NO_CUSTOMERS: {
    defaultCandidate: priorityCandidate({
      action: 'Convert Existing Leads',
      reason: 'The fastest path to revenue is to work the leads already closest to buying.',
      expectedImpact: 'Existing leads move into booked conversations, proposals, or first purchases.',
      category: 'CONVERSION',
      missionType: 'CUSTOMERS',
      route: CANONICAL_ROUTES.leads,
      ctaLabel: '处理 Leads',
      impact: 92,
      revenueProximity: REVENUE_PROXIMITY.NO_CUSTOMERS,
    }),
  },
  NO_RETENTION: {
    defaultCandidate: priorityCandidate({
      action: 'Build Retention System',
      reason: 'Customer value is leaking after purchase, so retention must be systemized before scaling acquisition.',
      expectedImpact: 'Customers receive follow-up paths that improve repeat purchase and retention.',
      category: 'RETENTION',
      missionType: 'RETENTION',
      route: CANONICAL_ROUTES.crm,
      ctaLabel: '建立留存系统',
      impact: 84,
      revenueProximity: REVENUE_PROXIMITY.NO_RETENTION,
    }),
  },
  NO_TEAM: {
    defaultCandidate: priorityCandidate({
      action: 'Create SOP',
      reason: 'The business has value signals, but execution still needs repeatable process before scale.',
      expectedImpact: 'Core workflows can be delegated to team members or AI workforce.',
      category: 'SCALE',
      missionType: 'TEAM',
      route: CANONICAL_ROUTES.teamGrowth,
      ctaLabel: '创建 SOP',
      impact: 78,
      revenueProximity: REVENUE_PROXIMITY.NO_TEAM,
    }),
  },
  BUSINESS_HEALTHY: {
    defaultCandidate: priorityCandidate({
      action: 'Optimize Growth',
      reason: 'No active bottleneck is blocking progress, so the next action should improve what is already working.',
      expectedImpact: 'The business keeps momentum while testing growth, revenue, or scale opportunities.',
      category: 'OPTIMIZATION',
      missionType: 'OPTIMIZATION',
      route: CANONICAL_ROUTES.dashboard,
      ctaLabel: '继续优化系统',
      impact: 72,
      revenueProximity: REVENUE_PROXIMITY.BUSINESS_HEALTHY,
    }),
  },
  NO_SYSTEM: {
    defaultCandidate: priorityCandidate({
      action: 'Restore Business Signals',
      reason: 'Business signals are unavailable, so the system must restore reliable data before ranking growth actions.',
      expectedImpact: 'The AI COO can resume trustworthy bottleneck and mission decisions.',
      category: 'SYSTEM',
      missionType: 'SYSTEM',
      route: CANONICAL_ROUTES.dashboard,
      ctaLabel: '恢复业务信号',
      impact: 90,
      revenueProximity: REVENUE_PROXIMITY.NO_SYSTEM,
    }),
  },
};

function urgencyFor(bottleneckResult: BottleneckResult): DashboardPriority {
  if (bottleneckResult.severity === 'Critical') return 'Critical';
  if (bottleneckResult.severity === 'High') return 'High';
  return 'Normal';
}

function scoreCandidate(candidate: PriorityCandidate, urgency: DashboardPriority) {
  return Math.round(
    (candidate.impact * 0.4)
      + (candidate.revenueProximity * 0.3)
      + (candidate.relevance * 0.2)
      + (URGENCY_SCORE[urgency] * 0.1),
  );
}

function selectCandidate(input: {
  bottleneck: MissionBottleneck;
  urgency: DashboardPriority;
  recentPriorityActions?: string[];
  recentPriorityHistory?: PriorityHistoryEntry[];
}) {
  const definition = PRIORITY_BY_BOTTLENECK[input.bottleneck];
  const candidates = [definition.defaultCandidate, ...(definition.alternatives ?? [])];
  const recentActions = new Set(input.recentPriorityActions ?? []);
  const historyByAction = new Map((input.recentPriorityHistory ?? []).map((entry) => [entry.priorityAction, entry]));
  const ranked = candidates
    .map((priority): ScoredPriorityCandidate => {
      const baseScore = scoreCandidate(priority, input.urgency);
      const history = historyByAction.get(priority.action);
      const stringHistoryMatch = recentActions.has(priority.action);
      const shouldPenalize = history
        ? history.completionStatus === 'completed' && history.resolved
        : stringHistoryMatch;
      const penalty = shouldPenalize ? DEDUP_PENALTY : 0;
      const dedupReason = penalty > 0
        ? 'Completed within 7 days and bottleneck resolved.'
        : undefined;

      return {
        priority,
        baseScore,
        penalty,
        finalScore: baseScore - penalty,
        dedupReason,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);

  return ranked[0];
}

export function resolvePriority(input: {
  bottleneckResult: BottleneckResult;
  recentPriorityActions?: string[];
  recentPriorityHistory?: PriorityHistoryEntry[];
}): PriorityResult {
  const urgency = urgencyFor(input.bottleneckResult);
  const selected = selectCandidate({
    bottleneck: input.bottleneckResult.bottleneck,
    urgency,
    recentPriorityActions: input.recentPriorityActions,
    recentPriorityHistory: input.recentPriorityHistory,
  });
  const priority = selected.priority;

  return {
    priorityAction: priority.action,
    priorityReason: priority.reason,
    expectedImpact: priority.expectedImpact,
    urgency,
    confidence: Math.min(95, Math.max(50, Math.round((input.bottleneckResult.confidence + selected.finalScore) / 2))),
    category: priority.category,
    missionType: priority.missionType,
    route: priority.route,
    ctaLabel: priority.ctaLabel,
    dedup: selected.penalty > 0
      ? {
          applied: true,
          action: priority.action,
          baseScore: selected.baseScore,
          penalty: selected.penalty,
          finalScore: selected.finalScore,
          reason: selected.dedupReason ?? 'Recent completed priority action was repeated.',
        }
      : undefined,
  };
}

export const priorityEngine = {
  resolve: resolvePriority,
};
