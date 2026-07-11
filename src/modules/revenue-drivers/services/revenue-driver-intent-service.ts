import prisma from '@/lib/prisma';
import { runtimeFallbackLogger } from '@/lib/runtime-fallback-logger';
import {
  resolveRevenueRuntimeIntent,
  type RevenueRuntimeMetadata,
} from '../runtime';

export type RevenueDriverIntentAuditInput = {
  route: string;
  intent?: string | null;
  status: 'resolved' | 'invalid' | 'fallback';
  resolvedTool?: string | null;
  timestamp?: string;
};

type RevenueDriverIntentAuditUser = {
  id: string;
  tenantId: string;
};

type RevenueDriverIntentAuditLog = Pick<typeof prisma.auditLog, 'create'>;

export type RevenueDriverIntentAuditOptions = {
  auditLog?: RevenueDriverIntentAuditLog;
  onRuntimeResolved?: (runtime: RevenueRuntimeMetadata) => void;
  resolveRuntimeIntent?: typeof resolveRevenueRuntimeIntent;
};

export async function recordRevenueDriverIntentAudit(
  user: RevenueDriverIntentAuditUser,
  input: RevenueDriverIntentAuditInput,
  options: RevenueDriverIntentAuditOptions = {},
) {
  const runtimeOutput = (options.resolveRuntimeIntent ?? resolveRevenueRuntimeIntent)({
    route: input.route,
    intent: input.intent ?? null,
    tenantId: user.tenantId,
    userId: user.id,
    source: 'api',
  }, {
    logger: runtimeFallbackLogger,
  });
  options.onRuntimeResolved?.(runtimeOutput.runtime);

  const action = actionForStatus(input.status);

  const metadata: Record<string, string | null> = {
    route: input.route,
    intent: input.intent ?? null,
    resolvedTool: input.resolvedTool ?? null,
    status: input.status,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  if (runtimeOutput.runtime.enabled) {
    metadata.runtimeResolution = runtimeOutput.resolution.status;
  }

  await (options.auditLog ?? prisma.auditLog).create({
    data: {
      tenantId: user.tenantId,
      actorId: user.id,
      action,
      targetType: 'revenue_driver_intent',
      metadata,
    },
  });

  return { action };
}

function actionForStatus(status: RevenueDriverIntentAuditInput['status']) {
  if (status === 'resolved') return 'intent.resolved';
  if (status === 'invalid') return 'intent.invalid';
  return 'intent.fallback';
}
