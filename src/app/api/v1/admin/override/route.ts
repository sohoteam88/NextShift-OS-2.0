import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { saasService } from '@/modules/saas/saasService';

const OverrideSchema = z.object({
  tenantId: z.string().min(1),
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
  const tenantId = searchParams.get('tenantId') || user.tenantId;
  const override = await saasService.getManualOverride(tenantId);
  const warnings = await saasService.getOverrideExpiryWarnings();
  return NextResponse.json({ data: { override, warnings } });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['platform_admin']);
  const body = OverrideSchema.parse(await req.json());
  const override = await saasService.setManualOverride(body.tenantId, {
    enabled: body.enabled,
    planOverride: body.planOverride,
    expiresAt: body.expiresAt,
    customAiCredits: body.customAiCredits,
    customFeatures: body.customFeatures as any,
    reason: body.reason,
    grantedBy: user.id,
    grantedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, user.id);
  return NextResponse.json({ data: override });
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['platform_admin']);
  const { tenantId } = z.object({ tenantId: z.string() }).parse(await req.json());
  await saasService.revokeOverride(tenantId, user.id);
  return NextResponse.json({ data: { revoked: true } });
});
