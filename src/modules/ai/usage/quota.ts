import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

const PLAN_QUOTAS: Record<string, number> = {
  starter: 200,
  growth: 1000,
  pro: 5000,
};

export const DEFAULT_DAILY_TENANT_CALL_LIMIT = 200;

interface QuotaEnv {
  AI_DAILY_CALL_LIMIT_PER_TENANT?: string;
}

interface QuotaClockOptions {
  now?: Date;
  env?: QuotaEnv;
}

function resolveDailyTenantLimit(
  env: QuotaEnv = { AI_DAILY_CALL_LIMIT_PER_TENANT: process.env.AI_DAILY_CALL_LIMIT_PER_TENANT },
): number {
  const raw = env.AI_DAILY_CALL_LIMIT_PER_TENANT;
  if (!raw || !raw.trim()) return DEFAULT_DAILY_TENANT_CALL_LIMIT;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_DAILY_TENANT_CALL_LIMIT;

  return Math.floor(parsed);
}

function getUtcDayWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);
  return { start, end };
}

function readQuotaFromSettings(settings: unknown): number | null {
  if (!settings || typeof settings !== 'object') return null;
  const direct = (settings as Record<string, unknown>).ai_monthly_quota;
  const nested = (settings as Record<string, unknown>).ai;
  const nestedQuota =
    nested && typeof nested === 'object'
      ? (nested as Record<string, unknown>).monthly_quota
      : null;

  const raw = direct ?? nestedQuota;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function resolveLimit(tenant: { maxAiCalls: number | null; plan: string; settings: unknown }): number {
  return (
    tenant.maxAiCalls ??
    readQuotaFromSettings(tenant.settings) ??
    PLAN_QUOTAS[tenant.plan] ??
    PLAN_QUOTAS.starter
  );
}

export async function checkDailyTenantQuota(
  tenantId: string,
  options: QuotaClockOptions = {},
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  resetAt: Date;
}> {
  const { start, end } = getUtcDayWindow(options.now);
  const limit = resolveDailyTenantLimit(options.env);
  const used = await prisma.aIUsageLog.count({
    where: {
      tenantId,
      createdAt: { gte: start, lt: end },
    },
  });

  const remaining = Math.max(0, limit - used);
  const percentUsed = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;

  return { used, limit, remaining, percentUsed, resetAt: end };
}

export async function enforceDailyTenantQuota(
  tenantId: string,
  options: QuotaClockOptions = {},
): Promise<void> {
  const quota = await checkDailyTenantQuota(tenantId, options);

  if (quota.remaining <= 0) {
    throw new AppError(
      'QUOTA_EXCEEDED',
      429,
      `AI daily tenant quota exceeded. Used ${quota.used}/${quota.limit} today.`,
      {
        scope: 'tenant',
        window: 'day',
        used: quota.used,
        limit: quota.limit,
        resetAt: quota.resetAt.toISOString(),
      },
    );
  }
}

export async function checkQuota(tenantId: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { maxAiCalls: true, plan: true, settings: true },
  });

  if (!tenant) {
    throw new AppError('NOT_FOUND', 404, 'Tenant not found');
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const used = await prisma.aIUsageLog.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth },
    },
  });

  const limit = resolveLimit(tenant);
  const remaining = Math.max(0, limit - used);
  const percentUsed = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;

  return { used, limit, remaining, percentUsed };
}

export async function enforceQuota(tenantId: string): Promise<void> {
  await enforceDailyTenantQuota(tenantId);

  const quota = await checkQuota(tenantId);

  if (quota.remaining <= 0) {
    throw new AppError(
      'QUOTA_EXCEEDED',
      429,
      `AI quota exceeded. Used ${quota.used}/${quota.limit} this month.`,
    );
  }
}
