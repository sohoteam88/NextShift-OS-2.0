import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandDnaService } from '@/modules/brand-dna/services/brandDnaService';
import { validateBrandDNA } from '@/modules/brand-dna/services/brandDnaValidator';

/**
 * GET /api/v1/brand-dna
 * Returns the current Brand DNA + health score.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const dna = await brandDnaService.getBrandDNA(user.id);
  const health = validateBrandDNA(dna);

  return NextResponse.json({ data: dna, health });
});

/**
 * PUT /api/v1/brand-dna
 * Saves (full replace) the Brand DNA.
 */
export const PUT = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const dna = body.dna;

  if (!dna) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'dna is required' } }, { status: 400 });
  }

  const saved = await brandDnaService.saveBrandDNA(user.id, dna);
  const health = validateBrandDNA(saved);

  return NextResponse.json({ data: saved, health });
});
