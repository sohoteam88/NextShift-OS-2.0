import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { aiCOODecisionEngine } from '@/modules/ai-coo/services/ai-coo-decision-engine';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const decision = await aiCOODecisionEngine.getDecision(user.id, user.tenantId);

  return NextResponse.json({
    data: {
      currentFocus: decision.currentFocus,
      nextBestAction: decision.nextBestAction,
      primaryRisk: decision.primaryRisk,
      primaryOpportunity: decision.primaryOpportunity,
      decisionReason: decision.decisionReason,
      priority: decision.priority,
      confidence: decision.confidence,
      decisionId: decision.decisionId,
      recommendedMission: decision.recommendedMission,
      successMetric: decision.successMetric,
    },
  });
});
