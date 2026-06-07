import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { TeamMemberBase, TeamMemberNode, TeamMemberRow, TeamSummary } from '../types';

type TeamUserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: Date;
  sponsorId: string | null;
};

type TeamContext = {
  usersById: Map<string, TeamUserRecord>;
  usersBySponsor: Map<string, TeamUserRecord[]>;
  statsByUserId: Map<string, TeamMemberBase>;
  trainingTotal: number;
};

const TEAM_ROLES = new Set(['leader', 'operator', 'platform_admin']);
const RECENT_CONTENT_DAYS = 30;
const STREAK_WINDOW_DAYS = 60;
const DEFAULT_TRAINING_TOTAL = 5;

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
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function maxDate(current: string | null, candidate: Date | null | undefined) {
  if (!candidate) return current;
  const next = candidate.toISOString();
  return !current || next > current ? next : current;
}

function defaultStats(user: TeamUserRecord, trainingTotal: number): TeamMemberBase {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatar_url: user.avatarUrl,
    joined_at: user.createdAt.toISOString(),
    lead_count: 0,
    conversion_count: 0,
    content_count: 0,
    daily_action_streak: 0,
    training_completed: 0,
    training_total: trainingTotal,
    last_active_at: null,
  };
}

function toUserRecord(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: Date;
  sponsorId: string | null;
}): TeamUserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    sponsorId: user.sponsorId,
  };
}

async function loadTrainingTotal(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const settings = normalizeSettings(tenant?.settings);
  const modules = Array.isArray(settings.training_modules) ? settings.training_modules : [];
  return modules.length > 0 ? modules.length : DEFAULT_TRAINING_TOTAL;
}

function buildSponsorIndex(users: TeamUserRecord[]) {
  const usersById = new Map<string, TeamUserRecord>();
  const usersBySponsor = new Map<string, TeamUserRecord[]>();

  for (const user of users) {
    usersById.set(user.id, user);
    if (!user.sponsorId) continue;
    const siblings = usersBySponsor.get(user.sponsorId) ?? [];
    siblings.push(user);
    usersBySponsor.set(user.sponsorId, siblings);
  }

  for (const siblings of usersBySponsor.values()) {
    siblings.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  return { usersById, usersBySponsor };
}

function computeStreaks(rows: Array<{ userId: string; date: Date; completed: boolean }>) {
  const byUser = new Map<string, Map<string, { total: number; completed: number }>>();

  for (const row of rows) {
    const day = dayKey(row.date);
    const userDays = byUser.get(row.userId) ?? new Map<string, { total: number; completed: number }>();
    const current = userDays.get(day) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (row.completed) current.completed += 1;
    userDays.set(day, current);
    byUser.set(row.userId, userDays);
  }

  const streaks = new Map<string, number>();
  const today = startOfDay(new Date());

  for (const [userId, days] of byUser.entries()) {
    let streak = 0;
    for (let offset = 0; offset < STREAK_WINDOW_DAYS; offset += 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - offset);
      const key = dayKey(date);
      const day = days.get(key);
      if (!day || day.total === 0 || day.completed !== day.total) break;
      streak += 1;
    }
    streaks.set(userId, streak);
  }

  return streaks;
}

function findMostRecentDate(values: Array<Date | null | undefined>) {
  const valid = values.filter((value): value is Date => Boolean(value));
  if (!valid.length) return null;
  return valid.reduce((latest, value) => (value > latest ? value : latest));
}

async function loadContext(tenantId: string): Promise<TeamContext> {
  const trainingTotal = await loadTrainingTotal(tenantId);
  const sinceContent = new Date();
  sinceContent.setDate(sinceContent.getDate() - RECENT_CONTENT_DAYS);
  const sinceStreak = new Date();
  sinceStreak.setDate(sinceStreak.getDate() - (STREAK_WINDOW_DAYS - 1));

  const [
    users,
    leadCounts,
    conversionCounts,
    contentCounts,
    activityLastActive,
    contentLastActive,
    dailyActionLastActive,
    trainingLastActive,
    trainingCompleted,
    dailyActionRows,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['active', 'pending', 'suspended'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        sponsorId: true,
      },
      orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
    }),
    prisma.lead.groupBy({
      by: ['ownerId'],
      where: { tenantId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ['ownerId'],
      where: {
        tenantId,
        deletedAt: null,
        pipelineStage: { in: ['已转化', 'converted', 'won'] },
      },
      _count: { _all: true },
    }),
    prisma.content.groupBy({
      by: ['ownerId'],
      where: { tenantId, createdAt: { gte: sinceContent } },
      _count: { _all: true },
    }),
    prisma.activity.groupBy({
      by: ['userId'],
      where: { tenantId },
      _max: { createdAt: true },
    }),
    prisma.content.groupBy({
      by: ['ownerId'],
      where: { tenantId },
      _max: { createdAt: true },
    }),
    prisma.dailyAction.groupBy({
      by: ['userId'],
      where: { tenantId },
      _max: { createdAt: true, completedAt: true },
    }),
    prisma.trainingProgress.groupBy({
      by: ['userId'],
      where: { tenantId },
      _max: { createdAt: true, completedAt: true },
    }),
    prisma.trainingProgress.groupBy({
      by: ['userId'],
      where: { tenantId, status: 'completed' },
      _count: { _all: true },
    }),
    prisma.dailyAction.findMany({
      where: { tenantId, date: { gte: sinceStreak } },
      select: { userId: true, date: true, completed: true },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    }),
  ]);

  const { usersById, usersBySponsor } = buildSponsorIndex(users.map(toUserRecord));
  const statsByUserId = new Map<string, TeamMemberBase>();
  const lastActiveByUserId = new Map<string, string | null>();

  for (const user of usersById.values()) {
    statsByUserId.set(user.id, defaultStats(user, trainingTotal));
  }

  for (const row of leadCounts) {
    const current = statsByUserId.get(row.ownerId);
    if (current) current.lead_count = row._count._all;
  }

  for (const row of conversionCounts) {
    const current = statsByUserId.get(row.ownerId);
    if (current) current.conversion_count = row._count._all;
  }

  for (const row of contentCounts) {
    const current = statsByUserId.get(row.ownerId);
    if (current) current.content_count = row._count._all;
  }

  for (const row of trainingCompleted) {
    const current = statsByUserId.get(row.userId);
    if (current) current.training_completed = row._count._all;
  }

  const streaks = computeStreaks(dailyActionRows);

  for (const row of activityLastActive) {
    lastActiveByUserId.set(row.userId, maxDate(lastActiveByUserId.get(row.userId) ?? null, row._max.createdAt));
  }

  for (const row of contentLastActive) {
    lastActiveByUserId.set(row.ownerId, maxDate(lastActiveByUserId.get(row.ownerId) ?? null, row._max.createdAt));
  }

  for (const row of dailyActionLastActive) {
    const latest = findMostRecentDate([row._max.createdAt, row._max.completedAt]);
    lastActiveByUserId.set(row.userId, maxDate(lastActiveByUserId.get(row.userId) ?? null, latest));
  }

  for (const row of trainingLastActive) {
    const latest = findMostRecentDate([row._max.createdAt, row._max.completedAt]);
    lastActiveByUserId.set(row.userId, maxDate(lastActiveByUserId.get(row.userId) ?? null, latest));
  }

  for (const [userId, stats] of statsByUserId.entries()) {
    stats.daily_action_streak = streaks.get(userId) ?? 0;
    stats.last_active_at = lastActiveByUserId.get(userId) ?? null;
  }

  return {
    usersById,
    usersBySponsor,
    statsByUserId,
    trainingTotal,
  };
}

function toNode(user: TeamUserRecord, stats: TeamMemberBase): TeamMemberBase {
  return {
    ...stats,
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatar_url: user.avatarUrl,
    joined_at: user.createdAt.toISOString(),
  };
}

function buildNodeFromRecord(
  record: TeamUserRecord,
  context: TeamContext,
  depth = 0,
): TeamMemberNode {
  const stats = context.statsByUserId.get(record.id) ?? defaultStats(record, context.trainingTotal);
  if (depth >= 10) {
    return { ...toNode(record, stats), children: [] };
  }

  const children = context.usersBySponsor.get(record.id) ?? [];
  return {
    ...toNode(record, stats),
    children: children.map((child) => buildNodeFromRecord(child, context, depth + 1)),
  };
}

function collectDescendantIds(userId: string, context: TeamContext, visited = new Set<string>()): string[] {
  const children = context.usersBySponsor.get(userId) ?? [];
  const ids: string[] = [];

  for (const child of children) {
    if (visited.has(child.id)) continue;
    visited.add(child.id);
    ids.push(child.id);
    ids.push(...collectDescendantIds(child.id, context, visited));
  }

  return ids;
}

function toRow(node: TeamMemberNode, directChildrenCount: number): TeamMemberRow {
  const { children, ...base } = node;
  void children;
  return {
    ...base,
    direct_children_count: directChildrenCount,
  };
}

export const teamService = {
  async getTree(user: AuthUser): Promise<TeamMemberNode> {
    if (!TEAM_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const [rootUser, context] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          sponsorId: true,
        },
      }),
      loadContext(user.tenantId),
    ]);

    if (!rootUser) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    return buildNodeFromRecord(toUserRecord(rootUser), context);
  },

  async getDirectDownline(user: AuthUser, includeStats = true): Promise<TeamMemberRow[]> {
    if (!TEAM_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const context = await loadContext(user.tenantId);
    const directChildren = context.usersBySponsor.get(user.id) ?? [];

    return directChildren.map((child) => {
      const node = buildNodeFromRecord(child, context, 1);
      const directChildrenCount = context.usersBySponsor.get(child.id)?.length ?? 0;
      return includeStats ? toRow(node, directChildrenCount) : {
        ...toRow(node, directChildrenCount),
        lead_count: 0,
        conversion_count: 0,
        content_count: 0,
        daily_action_streak: 0,
        training_completed: 0,
        training_total: context.trainingTotal,
        last_active_at: null,
      };
    });
  },

  async getTeamSummary(user: AuthUser): Promise<TeamSummary> {
    if (!TEAM_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const context = await loadContext(user.tenantId);
    const allIds = collectDescendantIds(user.id, context);

    const [activeMembers, totalLeads, totalConversions] = await Promise.all([
      prisma.user.count({ where: { tenantId: user.tenantId, id: { in: allIds }, status: 'active' } }),
      prisma.lead.count({ where: { tenantId: user.tenantId, deletedAt: null, ownerId: { in: [user.id, ...allIds] } } }),
      prisma.lead.count({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          ownerId: { in: [user.id, ...allIds] },
          pipelineStage: { in: ['已转化', 'converted', 'won'] },
        },
      }),
    ]);

    return {
      totalMembers: allIds.length,
      activeMembers,
      totalLeads,
      totalConversions,
    };
  },

  async getUserStats(userId: string, tenantId: string, context?: TeamContext): Promise<TeamMemberBase> {
    const loaded = context ?? (await loadContext(tenantId));
    const record = loaded.usersById.get(userId);
    if (!record) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }
    return loaded.statsByUserId.get(userId) ?? defaultStats(record, loaded.trainingTotal);
  },

  async getAllDownlineIds(userId: string, tenantId: string): Promise<string[]> {
    const context = await loadContext(tenantId);
    return collectDescendantIds(userId, context);
  },
};
