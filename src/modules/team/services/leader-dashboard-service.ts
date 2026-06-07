import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { teamService } from './team-service';
import type {
  LeaderDashboardAlert,
  LeaderDashboardData,
  LeaderDashboardMemberPerformance,
  LeaderDashboardSummary,
  LeaderDashboardTrendPoint,
  LeaderDashboardWeeklyTrend,
  TeamTopPerformer,
} from '../types';

type TrainingRow = {
  userId: string;
  moduleName: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
};

const ROLE_GUARD = new Set(['leader', 'operator', 'platform_admin']);
const ACTIVE_WINDOW_DAYS = 3;
const WARNING_WINDOW_DAYS = 7;
const CONTENT_WINDOW_DAYS = 7;
const TRAINING_STALL_DAYS = 10;
const HISTORY_WINDOW_DAYS = 30;
const TREND_WEEKS = 8;
const CONVERSION_STAGES = ['已转化', 'converted', 'won'];

function normalizeSettings(settings: unknown): Prisma.JsonObject {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? ({ ...(settings as Prisma.JsonObject) } as Prisma.JsonObject)
    : {};
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dayKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

function daysBetween(later: Date, earlier: Date) {
  return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}

function statusFlag(lastActiveAt: string | null): 'active' | 'cooling' | 'inactive' {
  if (!lastActiveAt) return 'inactive';
  const days = daysBetween(new Date(), new Date(lastActiveAt));
  if (days >= WARNING_WINDOW_DAYS) return 'inactive';
  if (days >= ACTIVE_WINDOW_DAYS) return 'cooling';
  return 'active';
}

function loadTrainingTotal(settings: unknown) {
  const normalized = normalizeSettings(settings);
  const modules = Array.isArray(normalized.training_modules) ? normalized.training_modules : [];
  return modules.length > 0 ? modules.length : 5;
}

function computeStreak(rows: Array<{ date: Date; completed: boolean }>) {
  const map = new Map<string, { total: number; completed: number }>();
  for (const row of rows) {
    const key = dayKey(row.date);
    const current = map.get(key) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (row.completed) current.completed += 1;
    map.set(key, current);
  }

  let streak = 0;
  const today = startOfDay(new Date());
  for (let offset = 0; offset < 60; offset += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const day = map.get(dayKey(date));
    if (!day || day.total === 0 || day.completed !== day.total) break;
    streak += 1;
  }

  return streak;
}

function aggregateByWeek(
  rows: Array<{ createdAt: Date }>,
  weeks: Array<{ start: Date; label: string }>,
) {
  const counts = new Map(weeks.map((week) => [week.label, 0]));
  for (const row of rows) {
    const week = weeks.find((item) => row.createdAt >= item.start && row.createdAt < new Date(item.start.getTime() + 7 * 86_400_000));
    if (!week) continue;
    counts.set(week.label, (counts.get(week.label) ?? 0) + 1);
  }
  return weeks.map<LeaderDashboardTrendPoint>((week) => ({ week: week.label, count: counts.get(week.label) ?? 0 }));
}

async function loadMemberState(memberIds: string[], tenantId: string) {
  const since30 = new Date();
  since30.setDate(since30.getDate() - HISTORY_WINDOW_DAYS);
  const since60 = new Date();
  since60.setDate(since60.getDate() - 60);

  const [members, leadRows, conversionRows, contentRows, activityRows, contentActivityRows, dailyActionRows, trainingRows] =
    await Promise.all([
      prisma.user.findMany({
        where: { tenantId, id: { in: memberIds }, deletedAt: null },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.lead.groupBy({
        by: ['ownerId'],
        where: { tenantId, deletedAt: null, ownerId: { in: memberIds }, createdAt: { gte: since30 } },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ['ownerId'],
        where: {
          tenantId,
          deletedAt: null,
          ownerId: { in: memberIds },
          createdAt: { gte: since30 },
          pipelineStage: { in: CONVERSION_STAGES },
        },
        _count: { _all: true },
      }),
      prisma.content.groupBy({
        by: ['ownerId'],
        where: { tenantId, ownerId: { in: memberIds }, createdAt: { gte: since30 } },
        _count: { _all: true },
      }),
      prisma.activity.groupBy({
        by: ['userId'],
        where: { tenantId, userId: { in: memberIds } },
        _max: { createdAt: true },
      }),
      prisma.content.groupBy({
        by: ['ownerId'],
        where: { tenantId, ownerId: { in: memberIds } },
        _max: { createdAt: true },
      }),
      prisma.dailyAction.findMany({
        where: { tenantId, userId: { in: memberIds }, date: { gte: since60 } },
        select: { userId: true, date: true, completed: true, completedAt: true },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.trainingProgress.findMany({
        where: { tenantId, userId: { in: memberIds } },
        select: {
          userId: true,
          moduleName: true,
          status: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

  const leadCountMap = new Map<string, number>(leadRows.map((row) => [row.ownerId, row._count._all]));
  const conversionCountMap = new Map<string, number>(conversionRows.map((row) => [row.ownerId, row._count._all]));
  const contentCountMap = new Map<string, number>(contentRows.map((row) => [row.ownerId, row._count._all]));
  const lastActivityMap = new Map<string, string | null>();
  const lastContentMap = new Map<string, string | null>();
  const lastDailyActionMap = new Map<string, string | null>();
  const lastTrainingMap = new Map<string, string | null>();

  for (const row of activityRows) {
    const current = lastActivityMap.get(row.userId);
    const candidate = row._max.createdAt?.toISOString() ?? null;
    if (candidate && (!current || candidate > current)) lastActivityMap.set(row.userId, candidate);
  }

  for (const row of contentActivityRows) {
    const current = lastContentMap.get(row.ownerId);
    const candidate = row._max.createdAt?.toISOString() ?? null;
    if (candidate && (!current || candidate > current)) lastContentMap.set(row.ownerId, candidate);
  }

  for (const row of dailyActionRows) {
    const candidate = row.completedAt?.toISOString() ?? null;
    if (!candidate) continue;
    const current = lastDailyActionMap.get(row.userId);
    if (!current || candidate > current) lastDailyActionMap.set(row.userId, candidate);
  }

  for (const row of trainingRows) {
    const candidate = row.completedAt?.toISOString() ?? null;
    if (!candidate) continue;
    const current = lastTrainingMap.get(row.userId);
    if (!current || candidate > current) lastTrainingMap.set(row.userId, candidate);
  }

  const dailyActionByUser = new Map<string, Array<{ date: Date; completed: boolean }>>();
  for (const row of dailyActionRows) {
    const current = dailyActionByUser.get(row.userId) ?? [];
    current.push({ date: row.date, completed: row.completed });
    dailyActionByUser.set(row.userId, current);
  }

  const trainingByUser = new Map<string, TrainingRow[]>();
  for (const row of trainingRows) {
    const current = trainingByUser.get(row.userId) ?? [];
    current.push(row as TrainingRow);
    trainingByUser.set(row.userId, current);
  }

  return {
    members,
    leadCountMap,
    conversionCountMap,
    contentCountMap,
    lastActivityMap,
    lastContentMap,
    lastDailyActionMap,
    lastTrainingMap,
    dailyActionByUser,
    trainingByUser,
  };
}

export const leaderDashboardService = {
  async getData(user: AuthUser): Promise<LeaderDashboardData> {
    if (!ROLE_GUARD.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const downlineIds = await teamService.getAllDownlineIds(user.id, user.tenantId);
    const allIds = [user.id, ...downlineIds];

    const [tenant, state, pendingApprovals, totalLeads, totalConversions] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { settings: true },
      }),
      loadMemberState(downlineIds, user.tenantId),
      prisma.user.count({ where: { tenantId: user.tenantId, sponsorId: { in: allIds }, status: 'pending', deletedAt: null } }),
      prisma.lead.count({ where: { tenantId: user.tenantId, deletedAt: null, ownerId: { in: allIds } } }),
      prisma.lead.count({
        where: { tenantId: user.tenantId, deletedAt: null, ownerId: { in: allIds }, pipelineStage: { in: CONVERSION_STAGES } },
      }),
    ]);

    const summary: LeaderDashboardSummary = {
      totalMembers: downlineIds.length,
      activeMembers: state.members.filter((member) => member.status === 'active').length,
      pendingApprovals,
      totalLeads,
      totalConversions,
      teamConversionRate: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 1000) / 10 : 0,
    };

    const trainingTotal = loadTrainingTotal(tenant?.settings);
    const memberPerformance: LeaderDashboardMemberPerformance[] = state.members.map((member) => {
      const userId = member.id;
      const dailyActions = state.dailyActionByUser.get(userId) ?? [];
      const trainingRows = state.trainingByUser.get(userId) ?? [];
      const completedTraining = trainingRows.filter((row) => row.status === 'completed').length;
      const progressPct = trainingTotal > 0 ? Math.round((completedTraining / trainingTotal) * 100) : 0;
      const lastActive =
        state.lastActivityMap.get(userId) ??
        state.lastContentMap.get(userId) ??
        state.lastDailyActionMap.get(userId) ??
        state.lastTrainingMap.get(userId) ??
        null;
      const streak = computeStreak(dailyActions);

      return {
        id: member.id,
        name: member.name,
        avatar_url: member.avatarUrl,
        phone: member.phone,
        role: member.role,
        leads_30d: state.leadCountMap.get(userId) ?? 0,
        conversions_30d: state.conversionCountMap.get(userId) ?? 0,
        content_30d: state.contentCountMap.get(userId) ?? 0,
        action_streak: streak,
        training_pct: progressPct,
        last_active: lastActive,
        status_flag: statusFlag(lastActive),
        status: member.status,
      } satisfies LeaderDashboardMemberPerformance;
    });

    const alerts = await this.getAlerts(downlineIds, user.tenantId);
    const weeklyTrend = await this.getWeeklyTrend(allIds, user.tenantId);
    const topPerformers = this.getTopPerformers(memberPerformance);

    // Stalled training alerts need module context, computed after member list is available.
    return {
      summary,
      memberPerformance,
      alerts,
      weeklyTrend,
      topPerformers,
    };
  },

  async getAlerts(memberIds: string[], tenantId: string): Promise<LeaderDashboardAlert[]> {
    const since30 = new Date();
    since30.setDate(since30.getDate() - HISTORY_WINDOW_DAYS);

    const [members, activities, contents, trainingRows] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, id: { in: memberIds }, deletedAt: null },
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.activity.findMany({
        where: { tenantId, userId: { in: memberIds } },
        select: { userId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.content.findMany({
        where: { tenantId, ownerId: { in: memberIds } },
        select: { ownerId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trainingProgress.findMany({
        where: { tenantId, userId: { in: memberIds }, createdAt: { gte: since30 } },
        select: { userId: true, moduleName: true, status: true, createdAt: true, completedAt: true },
        orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const activityMap = new Map<string, Date>();
    for (const activity of activities) {
      if (!activityMap.has(activity.userId)) {
        activityMap.set(activity.userId, activity.createdAt);
      }
    }

    const contentMap = new Map<string, Date>();
    for (const content of contents) {
      if (!contentMap.has(content.ownerId)) {
        contentMap.set(content.ownerId, content.createdAt);
      }
    }

    const trainingMap = new Map<string, TrainingRow[]>();
    for (const row of trainingRows) {
      const current = trainingMap.get(row.userId) ?? [];
      current.push(row as TrainingRow);
      trainingMap.set(row.userId, current);
    }

    const alerts: LeaderDashboardAlert[] = [];
    const now = new Date();

    for (const member of members) {
      const lastActivity = activityMap.get(member.id);
      if (!lastActivity) {
        alerts.push({
          type: 'inactive',
          member: { id: member.id, name: member.name },
          days_inactive: 999,
        });
      } else {
        const inactiveDays = daysBetween(now, lastActivity);
        if (inactiveDays >= WARNING_WINDOW_DAYS) {
          alerts.push({
            type: 'inactive',
            member: { id: member.id, name: member.name },
            days_inactive: inactiveDays,
          });
        }
      }

      const lastContent = contentMap.get(member.id);
      const contentDays = lastContent ? daysBetween(now, lastContent) : 999;
      if (contentDays >= CONTENT_WINDOW_DAYS) {
        alerts.push({
          type: 'no_content',
          member: { id: member.id, name: member.name },
          days_without_content: contentDays,
        });
      }

      const progress = trainingMap.get(member.id) ?? [];
      const firstIncomplete = progress.find((row) => row.status !== 'completed');
      if (firstIncomplete) {
        const stuckDays = daysBetween(now, firstIncomplete.completedAt ?? firstIncomplete.createdAt);
        if (stuckDays >= TRAINING_STALL_DAYS) {
          alerts.push({
            type: 'stalled_training',
            member: { id: member.id, name: member.name },
            stuck_at_module: firstIncomplete.moduleName,
          });
        }
      }

      if (member.status === 'pending') {
        alerts.push({
          type: 'pending_approval',
          member: { id: member.id, name: member.name },
          waiting_since: member.createdAt.toISOString(),
        });
      }
    }

    return alerts
      .sort((a, b) => {
        if (a.type === 'pending_approval' && b.type !== 'pending_approval') return -1;
        if (b.type === 'pending_approval' && a.type !== 'pending_approval') return 1;
        return 0;
      })
      .slice(0, 10);
  },

  async getWeeklyTrend(allIds: string[], tenantId: string): Promise<LeaderDashboardWeeklyTrend> {
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    const weeks = Array.from({ length: TREND_WEEKS }, (_, index) => {
      const start = new Date(currentWeekStart);
      start.setDate(start.getDate() - (TREND_WEEKS - 1 - index) * 7);
      return { start, label: dayKey(start) };
    });
    const earliest = weeks[0]?.start ?? currentWeekStart;
    const endExclusive = new Date(currentWeekStart);
    endExclusive.setDate(endExclusive.getDate() + 7);

    const [leadRows, conversionRows, contentRows] = await Promise.all([
      prisma.lead.findMany({
        where: { tenantId, deletedAt: null, ownerId: { in: allIds }, createdAt: { gte: earliest, lt: endExclusive } },
        select: { createdAt: true, pipelineStage: true },
      }),
      prisma.lead.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ownerId: { in: allIds },
          createdAt: { gte: earliest, lt: endExclusive },
          pipelineStage: { in: CONVERSION_STAGES },
        },
        select: { createdAt: true, pipelineStage: true },
      }),
      prisma.content.findMany({
        where: { tenantId, ownerId: { in: allIds }, createdAt: { gte: earliest, lt: endExclusive } },
        select: { createdAt: true },
      }),
    ]);

    return {
      leads: aggregateByWeek(leadRows, weeks),
      conversions: aggregateByWeek(conversionRows, weeks),
      content: aggregateByWeek(contentRows, weeks),
    };
  },

  getTopPerformers(memberPerformance: LeaderDashboardMemberPerformance[]): TeamTopPerformer[] {
    return [...memberPerformance]
      .sort((a, b) => b.conversions_30d - a.conversions_30d || b.content_30d - a.content_30d || b.action_streak - a.action_streak)
      .slice(0, 3)
      .map((member) => ({
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
        metric: 'conversions',
        value: member.conversions_30d,
      }));
  },
};
