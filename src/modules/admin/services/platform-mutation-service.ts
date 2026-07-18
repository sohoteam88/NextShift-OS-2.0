import { randomUUID } from 'crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { createServiceRoleSupabaseClient, hasServiceRoleSupabaseCredentials } from '@/lib/supabase/server';
import { PLAN_TIERS, type PlanTier } from '@/modules/tenant/constants/plans';
import { createTenantUsing } from '@/modules/tenant/services/tenant-service';
import {
  writePlatformAuditInTransaction,
  writePlatformAuditUsing,
  type PlatformAuditInput,
} from './platform-audit-service';

export const NON_DELETED_TENANT_STATUSES = ['active', 'suspended'] as const;
export type NonDeletedTenantStatus = (typeof NON_DELETED_TENANT_STATUSES)[number];
export type PlatformManualOverride = {
  enabled: boolean;
  planOverride?: string;
  expiresAt?: string;
  customAiCredits?: number;
  customFeatures?: string[];
  reason: string;
  grantedBy: string;
  grantedAt: string;
  updatedAt: string;
};

type PlatformDatabase = PrismaClient;
type AuditBase = Omit<PlatformAuditInput, 'outcome'>;

function failureCode(error: unknown): string {
  return error instanceof AppError ? error.code : error instanceof Error ? error.name : 'UNKNOWN';
}

export async function runPlatformMutationWithAudit<T>(
  db: PlatformDatabase,
  audit: AuditBase,
  mutate: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await db.$transaction(async (tx) => {
      const result = await mutate(tx);
      await writePlatformAuditInTransaction(tx, { ...audit, outcome: 'success' });
      return result;
    });
  } catch (error) {
    await writePlatformAuditUsing(db, {
      ...audit,
      outcome: 'failure',
      metadata: { ...audit.metadata, failure_code: failureCode(error) },
    });
    throw error;
  }
}

export async function requireRetainedPlatformTenant(
  tx: Pick<Prisma.TransactionClient, 'tenant'>,
  tenantId: string,
) {
  const tenant = await tx.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, status: true, settings: true },
  });
  if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant not found');
  if (tenant.status === 'deleted') {
    throw new AppError('TENANT_DELETED_TERMINAL', 409, 'Deleted tenant is terminal');
  }
  return tenant;
}

export async function createPlatformTenantWithAudit(
  actorId: string,
  correlationId: string,
  input: { name: string; slug: string; plan: PlanTier; ownerId: string; ownerEmail: string; ownerName: string },
  db: PlatformDatabase = prisma,
) {
  const audit = {
    actorId,
    actorRole: 'platform_admin' as const,
    action: 'tenant.create',
    targetType: 'tenant',
    targetKey: input.slug,
    correlationId,
    metadata: { tenant_name: input.name },
  };
  try {
    return await db.$transaction(async (tx) => {
      const result = await createTenantUsing(tx, input);
      await writePlatformAuditInTransaction(tx, {
        ...audit,
        targetId: result.tenant.id,
        targetKey: result.tenant.id,
        outcome: 'success',
      });
      return result;
    });
  } catch (error) {
    await writePlatformAuditUsing(db, {
      ...audit,
      outcome: 'failure',
      metadata: { ...audit.metadata, failure_code: failureCode(error) },
    });
    throw error;
  }
}

export async function updatePlatformTenantWithAudit(
  actorId: string,
  tenantId: string,
  correlationId: string,
  data: { name?: string; slug?: string; plan?: PlanTier; status?: NonDeletedTenantStatus; maxMembers?: number; maxAiCalls?: number },
  db: PlatformDatabase = prisma,
) {
  if (data.status !== undefined && !NON_DELETED_TENANT_STATUSES.includes(data.status)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Tenant PATCH cannot enter deleted status');
  }
  return runPlatformMutationWithAudit(db, {
    actorId,
    actorRole: 'platform_admin',
    action: 'tenant.update',
    targetType: 'tenant',
    targetId: tenantId,
    targetKey: tenantId,
    correlationId,
  }, async (tx) => {
    const current = await requireRetainedPlatformTenant(tx, tenantId);
    const planConfig = data.plan ? PLAN_TIERS[data.plan] : null;
    const settings = current.settings && typeof current.settings === 'object' && !Array.isArray(current.settings)
      ? current.settings as Prisma.JsonObject
      : {};
    return tx.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.plan !== undefined && planConfig ? {
          plan: data.plan,
          maxMembers: data.maxMembers ?? planConfig.max_members,
          maxAiCalls: data.maxAiCalls ?? planConfig.max_ai_calls,
          settings: {
            ...settings,
            plan: data.plan,
            member_limit: data.maxMembers ?? planConfig.max_members,
            max_members: data.maxMembers ?? planConfig.max_members,
            ai_monthly_quota: data.maxAiCalls ?? planConfig.max_ai_calls,
            max_ai_calls: data.maxAiCalls ?? planConfig.max_ai_calls,
            storage_limit_mb: planConfig.max_storage_mb,
            max_storage_mb: planConfig.max_storage_mb,
            custom_branding: planConfig.custom_branding,
          } as Prisma.InputJsonValue,
        } : {
          ...(data.maxMembers !== undefined ? { maxMembers: data.maxMembers } : {}),
          ...(data.maxAiCalls !== undefined ? { maxAiCalls: data.maxAiCalls } : {}),
        }),
        updatedAt: new Date(),
      },
      select: { id: true, name: true, slug: true, plan: true, maxMembers: true, maxAiCalls: true, status: true },
    });
  });
}

export async function setPlatformOverrideWithAudit(
  actorId: string,
  tenantId: string,
  correlationId: string,
  override: PlatformManualOverride,
  db: PlatformDatabase = prisma,
): Promise<PlatformManualOverride> {
  return runPlatformMutationWithAudit(db, {
    actorId,
    actorRole: 'platform_admin',
    action: 'override.set',
    targetType: 'tenant',
    targetId: tenantId,
    targetKey: tenantId,
    correlationId,
  }, async (tx) => {
    const tenant = await requireRetainedPlatformTenant(tx, tenantId);
    const settings = tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
      ? tenant.settings as Prisma.JsonObject
      : {};
    const now = new Date().toISOString();
    const updated: PlatformManualOverride = {
      ...override,
      grantedBy: actorId,
      grantedAt: override.grantedAt || now,
      updatedAt: now,
    };
    await tx.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, manual_override: updated as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue },
    });
    return updated;
  });
}

export async function revokePlatformOverrideWithAudit(
  actorId: string,
  tenantId: string,
  correlationId: string,
  db: PlatformDatabase = prisma,
): Promise<void> {
  await runPlatformMutationWithAudit(db, {
    actorId,
    actorRole: 'platform_admin',
    action: 'override.revoke',
    targetType: 'tenant',
    targetId: tenantId,
    targetKey: tenantId,
    correlationId,
  }, async (tx) => {
    const tenant = await requireRetainedPlatformTenant(tx, tenantId);
    const settings = tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
      ? tenant.settings as Prisma.JsonObject
      : {};
    await tx.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, manual_override: null } as Prisma.InputJsonValue },
    });
  });
}

async function loadPlatformUserTarget(tx: Prisma.TransactionClient, actorId: string, userId: string) {
  const actor = await tx.user.findFirst({ where: { id: actorId, deletedAt: null }, select: { id: true, role: true } });
  if (!actor || actor.role !== 'platform_admin') throw new AppError('FORBIDDEN', 403, 'Platform administrator required');
  const target = await tx.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, tenantId: true, name: true, email: true, role: true, status: true },
  });
  if (!target) throw new AppError('NOT_FOUND', 404, 'User not found');
  if (actor.id === target.id) throw new AppError('FORBIDDEN', 403, 'You cannot modify your own platform account here');
  return target;
}

export async function updatePlatformUserWithAudit(
  actorId: string,
  userId: string,
  correlationId: string,
  data: { role?: 'member' | 'leader' | 'operator' | 'platform_admin'; status?: 'active' | 'pending' | 'suspended' },
  db: PlatformDatabase = prisma,
) {
  return runPlatformMutationWithAudit(db, {
    actorId,
    actorRole: 'platform_admin',
    action: 'user.update',
    targetType: 'user',
    targetId: userId,
    targetKey: userId,
    correlationId,
  }, async (tx) => {
    const target = await loadPlatformUserTarget(tx, actorId, userId);
    if (target.role === 'operator' && data.role !== undefined && data.role !== 'operator') {
      const count = await tx.user.count({ where: { tenantId: target.tenantId, role: 'operator', deletedAt: null } });
      if (count <= 1) throw new AppError('CONFLICT', 409, 'Cannot demote the last operator');
    }
    return tx.user.update({
      where: { id: userId },
      data: { ...data, updatedAt: new Date() },
      select: { id: true, tenantId: true, name: true, email: true, role: true, status: true, updatedAt: true },
    });
  });
}

export async function deletePlatformUserWithAudit(
  actorId: string,
  userId: string,
  correlationId: string = randomUUID(),
  db: PlatformDatabase = prisma,
) {
  let targetTenantId: string | null = null;
  try {
    await db.$transaction(async (tx) => {
      const target = await loadPlatformUserTarget(tx, actorId, userId);
      targetTenantId = target.tenantId;
      await writePlatformAuditInTransaction(tx, {
        actorId,
        actorRole: 'platform_admin',
        action: 'user.delete.intent',
        targetType: 'user',
        targetId: userId,
        targetKey: userId,
        outcome: 'success',
        correlationId,
        metadata: { target_tenant_id: target.tenantId, protocol: 'durable_intent_before_external_auth_delete' },
      });
    });

    let authDeletion: 'soft_deleted' | 'skipped_missing_service_role' | 'already_missing' = 'skipped_missing_service_role';
    if (hasServiceRoleSupabaseCredentials()) {
      const supabaseAdmin = createServiceRoleSupabaseClient();
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId, true);
      if (error) {
        const message = error.message.toLowerCase();
        const status = 'status' in error && typeof error.status === 'number' ? error.status : null;
        if (status === 404 || message.includes('not found') || message.includes('no user')) authDeletion = 'already_missing';
        else throw new AppError('AUTH_DELETE_FAILED', 400, error.message);
      } else authDeletion = 'soft_deleted';
    }

    return await db.$transaction(async (tx) => {
      const target = await loadPlatformUserTarget(tx, actorId, userId);
      const updated = await tx.user.update({
        where: { id: userId },
        data: { status: 'suspended', deletedAt: new Date(), updatedAt: new Date() },
        select: { id: true, tenantId: true, name: true, email: true, role: true, status: true, updatedAt: true },
      });
      await writePlatformAuditInTransaction(tx, {
        actorId,
        actorRole: 'platform_admin',
        action: 'user.delete',
        targetType: 'user',
        targetId: userId,
        targetKey: userId,
        outcome: 'success',
        correlationId,
        metadata: { target_tenant_id: target.tenantId, auth_deletion: authDeletion },
      });
      return updated;
    });
  } catch (error) {
    await writePlatformAuditUsing(db, {
      actorId,
      actorRole: 'platform_admin',
      action: 'user.delete',
      targetType: 'user',
      targetId: userId,
      targetKey: userId,
      outcome: 'failure',
      correlationId,
      metadata: { target_tenant_id: targetTenantId, failure_code: failureCode(error) },
    });
    throw error;
  }
}
