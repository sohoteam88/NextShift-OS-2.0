import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { saasService } from '@/modules/saas/saasService';
import { AppError } from '@/lib/errors';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';
import prisma from '@/lib/prisma';
import {
  requireRetainedPlatformTenant,
  revokePlatformOverrideWithAudit,
  setPlatformOverrideWithAudit,
} from '@/modules/admin/services/platform-mutation-service';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';

const OverrideSchema = z.object({
  tenantId: z.string().uuid(),
  enabled: z.boolean(),
  planOverride: z.enum(['starter', 'pro', 'agency']).optional(),
  expiresAt: z.string().optional(),
  customAiCredits: z.number().min(0).optional(),
  customFeatures: z.array(z.string()).optional(),
  reason: z.string().min(1),
});

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['platform_admin']);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  if (!tenantId || !z.string().uuid().safeParse(tenantId).success) throw new AppError('VALIDATION_ERROR', 400, 'Explicit UUID tenantId is required');
  await requireRetainedPlatformTenant(prisma, tenantId);
  const override = await saasService.getManualOverride(tenantId);
  const warnings = await saasService.getOverrideExpiryWarnings();
  return NextResponse.json({ data: { override, warnings } });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['platform_admin']);
  requireCanonicalMutationPath(req, '/api/v1/superadmin/override');
  const body = OverrideSchema.parse(await req.json());
  const override = await setPlatformOverrideWithAudit(user.id, body.tenantId, resolvePlatformCorrelationId(req), {
      enabled: body.enabled,
      planOverride: body.planOverride,
      expiresAt: body.expiresAt,
      customAiCredits: body.customAiCredits,
      customFeatures: body.customFeatures as any,
      reason: body.reason,
      grantedBy: user.id,
      grantedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ data: override });
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['platform_admin']);
  requireCanonicalMutationPath(req, '/api/v1/superadmin/override');
  const { tenantId } = z.object({ tenantId: z.string().uuid() }).parse(await req.json());
  await revokePlatformOverrideWithAudit(user.id, tenantId, resolvePlatformCorrelationId(req));
  return NextResponse.json({ data: { revoked: true } });
});
