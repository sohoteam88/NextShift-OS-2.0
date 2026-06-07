import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { teamService } from '@/modules/team/services/team-service';
import type {
  AnalyticsDashboardData,
  AnalyticsDistributionPoint,
  AnalyticsFunnelPerformance,
  AnalyticsFunnelStep,
  AnalyticsHeatmapCell,
  AnalyticsMemberStat,
  AnalyticsPeriod,
  AnalyticsScopeRole,
  AnalyticsTrendPoint,
} from '../types';

type UserRecord = {
  id: string;
  name: string;
  role: string;
  status: string;
  createdAt: Date;
  sponsorId: string | null;
};

type LeadRecord = {
  id: string;
  ownerId: string;
  pipelineStage: string;
  createdAt: Date;
  updatedAt: Date;
};

type ActivityRecord = {
  userId: string;
  leadId: string | null;
  createdAt: Date;
};

type ContentRecord = {
  ownerId: string;
  platform: string | null;
  createdAt: Date;
};

type AiUsageRecord = {
  userId: string;
  createdAt: Date;
  durationMs: number;
};

type DailyActionRecord = {
  userId: string;
  date: Date;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
};

type FunnelRecord = {
  id: string;
  ownerId: string;
  title: string;
  status: string;
  views: number;
  conversions: number;
  createdAt: Date;
};

type AnalyticsEventRecord = {
  funnelId: string | null;
  eventName: string;
  createdAt: Date;
};

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const FINAL_STAGE_FALLBACK = ['已转化', 'converted', 'won'];
const HEATMAP_BLOCKS = ['00:00-05:59', '06:00-11:59', '12:00-17:59', '18:00-23:59'];
const HIGHLIGHT_COLORS = ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#8b5cf6'];
const HIGHLIGHT_STEPS = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'];

function parsePeriod(value: string | null | undefined): AnalyticsPeriod {
  if (value === '7d' || value === '30d' || value === '90d') return value;
  return '30d';
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function daysBetween(later: Date, earlier: Date) {
  return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}

function getPeriodWindow(period: AnalyticsPeriod) {
  const days = PERIOD_DAYS[period];
  const periodEnd = startOfDay(new Date());
  periodEnd.setDate(periodEnd.getDate() + 1);
  const periodStart = startOfDay(new Date());
  periodStart.setDate(periodStart.getDate() - (days - 1));
  return { periodStart, periodEnd, days };
}

function buildDailyBuckets(periodStart: Date, days: number) {
  const buckets = new Map<string, AnalyticsTrendPoint>();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(periodStart);
    date.setDate(date.getDate() + index);
    buckets.set(dayKey(date), { label: dayLabel(date) });
  }

  return buckets;
}

function addBucketValue(buckets: Map<string, AnalyticsTrendPoint>, date: Date, key: string, value = 1) {
  const bucket = buckets.get(dayKey(date));
  if (!bucket) return;
  bucket[key] = Number(bucket[key] ?? 0) + value;
}

function maxDate(current: Date | null, candidate: Date | null | undefined) {
  if (!candidate) return current;
  if (!current || candidate > current) return candidate;
  return current;
}

function formatMinutes(value: number) {
  return Math.round(value * 10) / 10;
}

function percentileSort(a: AnalyticsMemberStat, b: AnalyticsMemberStat) {
  return b.score - a.score || b.conversions - a.conversions || b.leads - a.leads || a.name.localeCompare(b.name);
}

function buildHeatmap(points: Array<{ createdAt: Date } | { completedAt: Date | null; createdAt: Date }>) {
  const cells = new Map<string, number>();

  for (const point of points) {
    const timestamp = 'completedAt' in point && point.completedAt ? point.completedAt : point.createdAt;
    const dayIndex = timestamp.getDay();
    const hour = timestamp.getHours();
    const blockIndex = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
    const key = `${dayIndex}:${blockIndex}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }

  const values: AnalyticsHeatmapCell[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    for (let blockIndex = 0; blockIndex < 4; blockIndex += 1) {
      values.push({ dayIndex, blockIndex, value: cells.get(`${dayIndex}:${blockIndex}`) ?? 0 });
    }
  }
  return values;
}

function summarizeCounts<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[key] ?? 'Unknown');
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

function bucketMostRecent(dates: Array<Date | null | undefined>) {
  let latest: Date | null = null;
  for (const date of dates) {
    latest = maxDate(latest, date);
  }
  return latest;
}

function buildFunnelSteps(stages: string[], leadCounts: Map<string, number>): AnalyticsFunnelStep[] {
  if (!stages.length) {
    const entries = [...leadCounts.entries()].sort((a, b) => b[1] - a[1]);
    const base = entries[0]?.[1] ?? 0;
    return entries.map(([name, value], index) => ({
      name,
      value,
      rate: index === 0 || base === 0 ? 100 : Math.round((value / (entries[index - 1]?.[1] ?? base)) * 1000) / 10,
      color: HIGHLIGHT_STEPS[index % HIGHLIGHT_STEPS.length],
    }));
  }

  const steps: AnalyticsFunnelStep[] = [];
  let previous = 0;
  stages.forEach((stage, index) => {
    const value = leadCounts.get(stage) ?? 0;
    steps.push({
      name: stage,
      value,
      rate: index === 0 || previous === 0 ? 100 : Math.round((value / previous) * 1000) / 10,
      color: HIGHLIGHT_STEPS[index % HIGHLIGHT_STEPS.length],
    });
    previous = value;
  });
  return steps;
}

async function loadDashboard(user: AuthUser, periodInput: string | null | undefined, view: AnalyticsScopeRole): Promise<AnalyticsDashboardData> {
  const period = parsePeriod(periodInput);
  const { periodStart, periodEnd, days } = getPeriodWindow(period);

  const [users, pipelineStages, leads, activities, contents, aiUsage, dailyActions, funnels] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      select: { id: true, name: true, role: true, status: true, createdAt: true, sponsorId: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.pipelineStage.findMany({
      where: { tenantId: user.tenantId },
      select: { name: true, stageOrder: true, color: true },
      orderBy: { stageOrder: 'asc' },
    }),
    prisma.lead.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      select: { id: true, ownerId: true, pipelineStage: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.activity.findMany({
      where: { tenantId: user.tenantId, createdAt: { gte: periodStart, lt: periodEnd } },
      select: { userId: true, leadId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.content.findMany({
      where: { tenantId: user.tenantId, createdAt: { gte: periodStart, lt: periodEnd } },
      select: { ownerId: true, platform: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.aIUsageLog.findMany({
      where: { tenantId: user.tenantId, createdAt: { gte: periodStart, lt: periodEnd } },
      select: { userId: true, createdAt: true, durationMs: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.dailyAction.findMany({
      where: { tenantId: user.tenantId, date: { gte: periodStart, lt: periodEnd } },
      select: { userId: true, date: true, completed: true, completedAt: true, createdAt: true },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.funnel.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, ownerId: true, title: true, status: true, views: true, conversions: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  let scopeIds: string[] = [];
  if (view === 'member') {
    scopeIds = [user.id];
  } else if (view === 'leader') {
    const downline = await teamService.getAllDownlineIds(user.id, user.tenantId);
    scopeIds = [user.id, ...downline];
  } else {
    scopeIds = users.map((item) => item.id);
  }

  const scopeSet = new Set(scopeIds);
  const scopedUsers = users.filter((item) => scopeSet.has(item.id));
  const scopedUserIds = scopedUsers.map((item) => item.id);
  const scopeLeadIds = leads.filter((lead) => scopeSet.has(lead.ownerId)).map((lead) => lead.id);
  const scopedFunnels = funnels.filter((funnel) => scopeSet.has(funnel.ownerId));
  const scopedActivities = activities.filter((activity) => scopeSet.has(activity.userId));
  const scopedContents = contents.filter((content) => scopeSet.has(content.ownerId));
  const scopedAiUsage = aiUsage.filter((row) => scopeSet.has(row.userId));
  const scopedDailyActions = dailyActions.filter((row) => scopeSet.has(row.userId));
  const scopedLeads = leads.filter((lead) => scopeSet.has(lead.ownerId));
  const leadActivityRows = scopeLeadIds.length
    ? await prisma.activity.findMany({
        where: { tenantId: user.tenantId, leadId: { in: scopeLeadIds } },
        select: { leadId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    : [];
  const funnelEvents = scopedFunnels.length
    ? await prisma.analyticsEvent.findMany({
        where: {
          tenantId: user.tenantId,
          funnelId: { in: scopedFunnels.map((funnel) => funnel.id) },
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { funnelId: true, eventName: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const stages = pipelineStages.map((stage) => stage.name);
  const conversionStages = stages.length ? [stages[stages.length - 1]] : FINAL_STAGE_FALLBACK;
  const conversionStageSet = new Set(conversionStages);

  const periodLeads = scopedLeads.filter((lead) => lead.createdAt >= periodStart && lead.createdAt < periodEnd);
  const periodConversions = scopedLeads.filter(
    (lead) => conversionStageSet.has(lead.pipelineStage) && lead.updatedAt >= periodStart && lead.updatedAt < periodEnd,
  );

  const leadTrendBuckets = buildDailyBuckets(periodStart, days);
  const conversionTrendBuckets = buildDailyBuckets(periodStart, days);
  const aiTrendBuckets = buildDailyBuckets(periodStart, days);
  const actionTrendBuckets = buildDailyBuckets(periodStart, days);
  const growthTrendBuckets = buildDailyBuckets(periodStart, days);

  for (const lead of periodLeads) addBucketValue(leadTrendBuckets, lead.createdAt, 'leads');
  for (const lead of periodConversions) addBucketValue(conversionTrendBuckets, lead.updatedAt, 'conversions');
  for (const row of scopedAiUsage) {
    addBucketValue(aiTrendBuckets, row.createdAt, 'calls');
    addBucketValue(aiTrendBuckets, row.createdAt, 'durationMinutes', row.durationMs / 60_000);
  }
  for (const row of scopedDailyActions) {
    addBucketValue(actionTrendBuckets, row.date, 'assigned');
    if (row.completed) addBucketValue(actionTrendBuckets, row.date, 'completed');
  }
  for (const userRow of scopedUsers) addBucketValue(growthTrendBuckets, userRow.createdAt, 'newMembers');
  for (const lead of periodLeads) addBucketValue(growthTrendBuckets, lead.createdAt, 'leads');
  for (const activity of scopedActivities) addBucketValue(growthTrendBuckets, activity.createdAt, 'activities');

  const leadCountsByStage = new Map<string, number>();
  for (const lead of scopedLeads) {
    leadCountsByStage.set(lead.pipelineStage, (leadCountsByStage.get(lead.pipelineStage) ?? 0) + 1);
  }

  const platformCounts = summarizeCounts(scopedContents, 'platform');
  const contentByPlatform: AnalyticsDistributionPoint[] = [...platformCounts.entries()]
    .map(([name, value], index) => ({ name, value, color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  const aiUsageCount = scopedAiUsage.length;
  const contentCount = scopedContents.length;
  const totalLeads = periodLeads.length;
  const totalConversions = periodConversions.length;
  const actionCompletionRate = scopedDailyActions.length > 0
    ? Math.round((scopedDailyActions.filter((row) => row.completed).length / scopedDailyActions.length) * 1000) / 10
    : 0;

  const funnelEventCounts = new Map<string, { views: number; conversions: number }>();
  for (const event of funnelEvents) {
    const current = funnelEventCounts.get(event.funnelId ?? '');
    if (event.eventName === 'funnel_view') {
      funnelEventCounts.set(event.funnelId ?? '', { views: (current?.views ?? 0) + 1, conversions: current?.conversions ?? 0 });
    } else if (event.eventName === 'funnel_submit') {
      funnelEventCounts.set(event.funnelId ?? '', { views: current?.views ?? 0, conversions: (current?.conversions ?? 0) + 1 });
    }
  }

  const allFunnelPerformance: AnalyticsFunnelPerformance[] = scopedFunnels
    .map((funnel) => {
      const eventCounts = funnelEventCounts.get(funnel.id);
      const views = eventCounts?.views ?? funnel.views;
      const conversions = eventCounts?.conversions ?? funnel.conversions;
      return {
        id: funnel.id,
        title: funnel.title,
        status: funnel.status,
        views,
        conversions,
        conversionRate: views > 0 ? Math.round((conversions / views) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.views - a.views);
  const funnelPerformance = allFunnelPerformance.slice(0, 8);

  const funnelViews = allFunnelPerformance.reduce((sum, funnel) => sum + funnel.views, 0);
  const funnelConversions = allFunnelPerformance.reduce((sum, funnel) => sum + funnel.conversions, 0);
  const totalUsers = scopedUsers.length;
  const activeMembers = scopedUsers.filter((member) => {
    const hasLead = scopedLeads.some((lead) => lead.ownerId === member.id && lead.createdAt >= periodStart && lead.createdAt < periodEnd);
    const hasContent = scopedContents.some((content) => content.ownerId === member.id);
    const hasAi = scopedAiUsage.some((row) => row.userId === member.id);
    const hasActivity = scopedActivities.some((row) => row.userId === member.id);
    const hasAction = scopedDailyActions.some((row) => row.userId === member.id && row.completed);
    return hasLead || hasContent || hasAi || hasActivity || hasAction;
  }).length;
  const newMembers = scopedUsers.filter((member) => member.createdAt >= periodStart && member.createdAt < periodEnd).length;
  const memberRetentionRate = totalUsers > 0 ? Math.round((activeMembers / totalUsers) * 1000) / 10 : 0;

  const leadCountByOwner = new Map<string, number>();
  const conversionCountByOwner = new Map<string, number>();
  const contentCountByOwner = new Map<string, number>();
  const aiCountByUser = new Map<string, number>();
  const activityCountByUser = new Map<string, number>();
  const completedActionCountByUser = new Map<string, number>();
  const lastActiveByUser = new Map<string, Date | null>();
  const leadResponseSamplesByUser = new Map<string, number[]>();
  const leadActivityByLead = new Map<string, Date>();

  for (const row of leadActivityRows) {
    const leadId = row.leadId ?? '';
    if (!leadActivityByLead.has(leadId)) {
      leadActivityByLead.set(leadId, row.createdAt);
    }
  }

  for (const lead of scopedLeads) {
    leadCountByOwner.set(lead.ownerId, (leadCountByOwner.get(lead.ownerId) ?? 0) + 1);
    if (conversionStageSet.has(lead.pipelineStage)) {
      conversionCountByOwner.set(lead.ownerId, (conversionCountByOwner.get(lead.ownerId) ?? 0) + 1);
    }
    const firstActivity = leadActivityByLead.get(lead.id);
    if (firstActivity && firstActivity > lead.createdAt) {
      const delta = (firstActivity.getTime() - lead.createdAt.getTime()) / 60_000;
      const samples = leadResponseSamplesByUser.get(lead.ownerId) ?? [];
      samples.push(delta);
      leadResponseSamplesByUser.set(lead.ownerId, samples);
    }
  }

  for (const content of scopedContents) {
    contentCountByOwner.set(content.ownerId, (contentCountByOwner.get(content.ownerId) ?? 0) + 1);
    lastActiveByUser.set(content.ownerId, maxDate(lastActiveByUser.get(content.ownerId) ?? null, content.createdAt));
  }

  for (const row of scopedAiUsage) {
    aiCountByUser.set(row.userId, (aiCountByUser.get(row.userId) ?? 0) + 1);
    lastActiveByUser.set(row.userId, maxDate(lastActiveByUser.get(row.userId) ?? null, row.createdAt));
  }

  for (const row of scopedActivities) {
    activityCountByUser.set(row.userId, (activityCountByUser.get(row.userId) ?? 0) + 1);
    lastActiveByUser.set(row.userId, maxDate(lastActiveByUser.get(row.userId) ?? null, row.createdAt));
  }

  for (const row of scopedDailyActions) {
    if (row.completed) {
      completedActionCountByUser.set(row.userId, (completedActionCountByUser.get(row.userId) ?? 0) + 1);
      lastActiveByUser.set(row.userId, maxDate(lastActiveByUser.get(row.userId) ?? null, row.completedAt ?? row.createdAt));
    }
  }

  for (const lead of scopedLeads) {
    lastActiveByUser.set(lead.ownerId, maxDate(lastActiveByUser.get(lead.ownerId) ?? null, lead.updatedAt));
  }

  const memberStats: AnalyticsMemberStat[] = scopedUsers.map((member) => {
    const leadsForUser = leadCountByOwner.get(member.id) ?? 0;
    const conversionsForUser = conversionCountByOwner.get(member.id) ?? 0;
    const contentForUser = contentCountByOwner.get(member.id) ?? 0;
    const actionsForUser = completedActionCountByUser.get(member.id) ?? 0;
    const aiForUser = aiCountByUser.get(member.id) ?? 0;
    const activityForUser = activityCountByUser.get(member.id) ?? 0;
    const responseSamples = leadResponseSamplesByUser.get(member.id) ?? [];
    const avgResponseMinutes = responseSamples.length
      ? formatMinutes(responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length)
      : null;
    const lastActive = bucketMostRecent([
      lastActiveByUser.get(member.id) ?? null,
      member.createdAt,
    ]);
    const retention = leadsForUser > 0 || contentForUser > 0 || actionsForUser > 0 || aiForUser > 0 || activityForUser > 0;
    const score = leadsForUser * 2 + conversionsForUser * 5 + contentForUser * 2 + actionsForUser * 2 + aiForUser;

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      status: member.status,
      leads: leadsForUser,
      conversions: conversionsForUser,
      content: contentForUser,
      actions: actionsForUser,
      aiUsage: aiForUser,
      score,
      avgResponseMinutes,
      retention,
      lastActive: lastActive ? lastActive.toISOString() : null,
      createdAt: member.createdAt.toISOString(),
    };
  }).sort(percentileSort);

  const avgResponseCandidates = memberStats
    .map((member) => member.avgResponseMinutes)
    .filter((value): value is number => typeof value === 'number');
  const avgResponseMinutes = avgResponseCandidates.length
    ? formatMinutes(avgResponseCandidates.reduce((sum, value) => sum + value, 0) / avgResponseCandidates.length)
    : null;

  const summary = {
    totalUsers,
    activeMembers,
    newMembers,
    totalLeads,
    totalConversions,
    conversionRate: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 1000) / 10 : 0,
    contentCount,
    aiUsageCount,
    funnelViews,
    funnelConversions,
    actionCompletionRate,
    memberRetentionRate,
    avgResponseMinutes,
  };

  return {
    view,
    period,
    range: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    summary,
    stageDistribution: [...leadCountsByStage.entries()]
      .map(([name, value], index) => ({ name, value, color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length] }))
      .sort((a, b) => b.value - a.value),
    leadTrend: [...leadTrendBuckets.values()],
    conversionTrend: [...conversionTrendBuckets.values()],
    conversionFunnel: buildFunnelSteps(stages, leadCountsByStage),
    contentByPlatform,
    aiUsageTrend: [...aiTrendBuckets.values()],
    funnelPerformance,
    actionCompletionTrend: [...actionTrendBuckets.values()],
    teamGrowthTrend: [...growthTrendBuckets.values()],
    heatmap: buildHeatmap([
      ...scopedActivities,
      ...scopedDailyActions,
    ]),
    memberStats,
    topMembers: memberStats.slice(0, 5),
  };
}

export const analyticsService = {
  async getMemberAnalytics(user: AuthUser, periodInput?: string | null) {
    if (!['member', 'leader', 'operator', 'platform_admin'].includes(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }
    return loadDashboard(user, periodInput, 'member');
  },

  async getLeaderAnalytics(user: AuthUser, periodInput?: string | null) {
    if (!['leader', 'operator', 'platform_admin'].includes(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }
    return loadDashboard(user, periodInput, 'leader');
  },

  async getOperatorAnalytics(user: AuthUser, periodInput?: string | null) {
    if (!['operator', 'platform_admin'].includes(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }
    return loadDashboard(user, periodInput, 'operator');
  },
};
