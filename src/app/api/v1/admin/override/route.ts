import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { saasService } from '@/modules/saas/saasService';
import { AppError } from '@/lib/errors';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';

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
  const tenantId = searchParams.get('tenantId');
  if (!tenantId) throw new AppError('VALIDATION_ERROR', 400, 'Explicit tenantId is required');
  const override = await saasService.getManualOverride(tenantId);
  const warnings = await saasService.getOverrideExpiryWarnings();
  return NextResponse.json({ data: { override, warnings } });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['platform_admin']);
  requireCanonicalMutationPath(req, '/api/v1/superadmin/override');
  const body = OverrideSchema.parse(await req.json());
  try {
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
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'override.set', targetType: 'tenant', targetId: body.tenantId, targetKey: body.tenantId, outcome: 'success' });
    return NextResponse.json({ data: override });
  } catch (error) {
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'override.set', targetType: 'tenant', targetId: body.tenantId, targetKey: body.tenantId, outcome: 'failure', metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } });
    throw error;
  }
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['platform_admin']);
  requireCanonicalMutationPath(req, '/api/v1/superadmin/override');
  const { tenantId } = z.object({ tenantId: z.string() }).parse(await req.json());
  try {
    await saasService.revokeOverride(tenantId, user.id);
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'override.revoke', targetType: 'tenant', targetId: tenantId, targetKey: tenantId, outcome: 'success' });
    return NextResponse.json({ data: { revoked: true } });
  } catch (error) {
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'override.revoke', targetType: 'tenant', targetId: tenantId, targetKey: tenantId, outcome: 'failure', metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } });
    throw error;
  }
});
