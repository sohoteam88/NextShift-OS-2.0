import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const authority = await getInterviewAuthorityProjection(user.id);

  return NextResponse.json({
    data: {
      businessMode: authority.businessMode,
      experienceLevel: authority.experienceLevel,
      authorityScore: authority.authorityScore,
      readinessScore: authority.readinessScore,
      recommendedJourney: authority.recommendedJourney,
      recommendedMission: authority.recommendedMission,
      offerStatus: authority.offerStatus,
      audienceStatus: authority.audienceStatus,
      contentReadiness: authority.contentReadiness,
      trafficReadiness: authority.trafficReadiness,
      revenueStatus: authority.revenueStatus,
      primaryOffer: authority.primaryOffer,
      revenueModel: authority.revenueModel,
      primaryGrowthChannel: authority.primaryGrowthChannel,
      brandArchetype: authority.brandArchetype,
      personalStoryVector: authority.personalStoryVector,
    },
  });
});
