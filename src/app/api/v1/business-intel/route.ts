import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { ceoAdvisorEngine } from '@/modules/business-intelligence/ceoAdvisorEngine';
import { cooPlanService } from '@/modules/ai-coo/services/COOPlanService';
import { toBusinessIntelViewModel } from '@/modules/ai-coo/view-models/BusinessIntelViewModelAdapter';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const [cooPlan, fallbackReport] = await Promise.all([
    cooPlanService.getCOOPlan(user.id),
    ceoAdvisorEngine.generateCEOReport(user.id, user.tenantId),
  ]);

  return NextResponse.json({ data: toBusinessIntelViewModel(cooPlan, fallbackReport) });
});
