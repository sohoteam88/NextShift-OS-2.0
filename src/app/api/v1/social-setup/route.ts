import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { socialSetupService } from '@/modules/social-setup/socialSetupService';

/**
 * GET /api/v1/social-setup
 * Returns the current social setup + readiness score.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const setup = await socialSetupService.getSetup(user.id);
  const readiness = await socialSetupService.getReadiness(user.id);

  return NextResponse.json({ data: setup, readiness });
});

/**
 * PUT /api/v1/social-setup
 * Saves a social setup.
 */
export const PUT = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const saved = await socialSetupService.saveSetup(user.id, body.setup);
  const readiness = await socialSetupService.getReadiness(user.id);

  return NextResponse.json({ data: saved, readiness });
});
