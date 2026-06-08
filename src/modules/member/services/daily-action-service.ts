import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { DailyActionCategory, DailyActionDay, DailyActionItem } from '../types';

type DailyActionTemplate = {
  type: string;
  description: string;
};

const DEFAULT_ACTIONS: DailyActionTemplate[] = [
  { type: 'learn.ai_coach', description: '查看 AI 教练任务' },
  { type: 'content.education_post', description: '发布 1 条教育内容' },
  { type: 'crm.follow_up', description: '跟进 2 位潜在客户' },
  { type: 'crm.whatsapp_reply', description: '回复所有 WhatsApp 消息' },
  { type: 'learn.reflection', description: '记录今天的学习心得' },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dayKey(date: Date | string) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCategory(type: string): DailyActionCategory {
  const prefix = type.split('.')[0];
  if (prefix === 'content' || prefix === 'crm') return prefix;
  return 'learn';
}

function normalizeTemplate(action: unknown): DailyActionTemplate | null {
  if (!action || typeof action !== 'object') return null;
  const value = action as Record<string, unknown>;
  const type = typeof value.type === 'string' ? value.type.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  if (!type || !description) return null;
  return { type, description };
}

function normalizeSettings(settings: unknown): Prisma.JsonObject {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? ({ ...(settings as Prisma.JsonObject) } as Prisma.JsonObject)
    : {};
}

function toItem(row: {
  id: string;
  type: string;
  description: string;
  completed: boolean;
  completedAt: Date | null;
}): DailyActionItem {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    category: getCategory(row.type),
  };
}

function toDaySummary(date: Date, rows: Array<ReturnType<typeof toItem> | DailyActionItem>): DailyActionDay {
  const actions = rows.map((row) => ({
    ...row,
    category: row.category ?? getCategory(row.type),
  }));
  const totalCount = actions.length;
  const completedCount = actions.filter((action) => action.completed).length;
  return {
    date: dayKey(date),
    actions,
    totalCount,
    completedCount,
    allCompleted: totalCount > 0 && completedCount === totalCount,
    hasData: totalCount > 0,
  };
}

export const dailyActionService = {
  async getToday(user: AuthUser) {
    const date = startOfDay(new Date());
    let actions = await prisma.dailyAction.findMany({
      where: { tenantId: user.tenantId, userId: user.id, date },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    if (!actions.length) {
      actions = await this.createDailyPlanRows(user, date);
    }

    return toDaySummary(date, actions.map(toItem));
  },

  async createDailyPlan(user: AuthUser, date: Date) {
    const rows = await this.createDailyPlanRows(user, date);
    return toDaySummary(startOfDay(date), rows.map(toItem));
  },

  async createDailyPlanRows(user: AuthUser, date: Date) {
    const planDate = startOfDay(date);
    const defaultActions = await this.getDefaultActions(user.tenantId);

    await prisma.dailyAction.deleteMany({
      where: { tenantId: user.tenantId, userId: user.id, date: planDate },
    });

    const created = await prisma.$transaction(
      defaultActions.map((action) =>
        prisma.dailyAction.create({
          data: {
            tenantId: user.tenantId,
            userId: user.id,
            date: planDate,
            type: action.type,
            description: action.description,
            completed: false,
          },
        }),
      ),
    );

    return created;
  },

  async toggleAction(user: AuthUser, actionIndex: number) {
    const today = await this.getToday(user);
    const action = today.actions[actionIndex];
    if (!action) {
      throw new AppError('NOT_FOUND', 404, 'Action not found');
    }

    const nextCompleted = !action.completed;
    await prisma.dailyAction.update({
      where: { id: action.id },
      data: {
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
      },
    });

    return this.getToday(user);
  },

  async getHistory(user: AuthUser, days = 30) {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - (days - 1));

    const rows = await prisma.dailyAction.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
        date: { gte: since },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    const byDay = new Map<string, DailyActionItem[]>();
    for (const row of rows) {
      const key = dayKey(row.date);
      const current = byDay.get(key) ?? [];
      current.push(toItem(row));
      byDay.set(key, current);
    }

    const daysList: DailyActionDay[] = [];
    for (let index = 0; index < days; index += 1) {
      const date = startOfDay(new Date());
      date.setDate(date.getDate() - (days - 1 - index));
      const key = dayKey(date);
      const actions = byDay.get(key) ?? [];
      daysList.push(toDaySummary(date, actions));
    }

    return daysList;
  },

  async getStreak(user: AuthUser): Promise<number> {
    const history = await this.getHistory(user, 60);
    let streak = 0;

    for (let index = history.length - 1; index >= 0; index -= 1) {
      const day = history[index];
      if (!day.hasData || !day.allCompleted) break;
      streak += 1;
    }

    return streak;
  },

  async getDefaultActions(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = normalizeSettings(tenant?.settings);
    const custom = Array.isArray(settings.default_daily_actions)
      ? settings.default_daily_actions.map(normalizeTemplate).filter(Boolean)
      : [];

    if (custom.length > 0) {
      return custom as DailyActionTemplate[];
    }

    return DEFAULT_ACTIONS;
  },

  async updateDefaultActions(tenantId: string, actions: Array<{ type: string; description: string }>) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const normalized = actions.map(normalizeTemplate).filter(Boolean) as DailyActionTemplate[];
    const settings = normalizeSettings(tenant?.settings);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          default_daily_actions: normalized,
        } as Prisma.InputJsonValue,
      },
    });

    return normalized;
  },
};
