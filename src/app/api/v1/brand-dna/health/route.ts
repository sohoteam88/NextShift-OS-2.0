import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getBrandDNAHealth } from '@/modules/brand-dna/services/BrandContextProvider';

/**
 * GET /api/v1/brand-dna/health
 * Returns Brand DNA health score for the dashboard.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const health = await getBrandDNAHealth(user.id);

  return NextResponse.json({ data: health });
});
