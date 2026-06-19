import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const context = await businessContextMemoryService.getBusinessContext(user.id, user.tenantId);

  return NextResponse.json({
    data: {
      recentActivities: context.recentActivities,
      currentFocus: context.currentFocus,
      blockedAreas: context.blockedAreas,
      completedMilestones: context.completedMilestones,
      executionPattern: context.executionPattern,
      recommendedFocus: context.recommendedFocus,
    },
  });
});
