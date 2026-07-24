import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { brandDnaService } from '@/modules/brand-dna/services/brandDnaService';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const legacyProfile = (meta.brand_profile as Record<string, unknown>) ?? {};
  const dna = await brandDnaService.getBrandDNA(user.id);

  // Display callers historically read this legacy metadata object. Overlay the
  // canonical BrandProfile values so a saved Brand DNA update is immediately
  // reflected in every downstream module without copying the profile again.
  return NextResponse.json({
    data: {
      ...legacyProfile,
      identity: dna.identity.brandPositioning || dna.identity.brandName || dna.identity.personalName,
      brandName: dna.identity.brandName,
      personalName: dna.identity.personalName,
      brandPositioning: dna.identity.brandPositioning,
      targetAudience: dna.audience.targetAudience,
      target_audience: dna.audience.targetAudience,
      audiencePainPoints: dna.audience.audiencePainPoints,
      audience_pain_points: dna.audience.audiencePainPoints,
      coreMessage: dna.messaging.coreMessage,
      uniqueAngle: dna.messaging.uniqueAngle,
      offer: dna.offer.primaryOffer,
      primaryOffer: dna.offer.primaryOffer,
      secondaryOffer: dna.offer.secondaryOffer,
      transformationPromise: dna.offer.transformationPromise,
      // Brand DNA currently has no trustProof/socialProof/credentials field.
      // Keep the legacy response shape mapped to the closest canonical
      // messaging signal until that dedicated field exists.
      trust_proof: dna.messaging.uniqueAngle,
      brandDnaVersion: dna.meta.version,
    },
  });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const updates = (await request.json()) as Record<string, unknown>;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const existingMeta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const existingProfile = (existingMeta.brand_profile as Record<string, unknown>) ?? {};

  const newMeta = {
    ...existingMeta,
    brand_profile: { ...existingProfile, ...updates },
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { metadata: newMeta as Prisma.InputJsonValue },
  });

  const missionResults = [];
  if (updates.contentStrategy) {
    missionResults.push(await notifyMissionProgress(user, 'positioning_completed'));
  }
  if (updates.username || updates.bios) {
    missionResults.push(await notifyMissionProgress(user, 'social_setup_completed'));
  }
  if (updates.bios) {
    missionResults.push(await notifyMissionProgress(user, 'bio_generated'));
    missionResults.push(await notifyMissionProgress(user, 'first_bio_completed'));
  }
  if (updates.avatar_completed || updates.avatarCompleted) {
    missionResults.push(await notifyMissionProgress(user, 'avatar_completed'));
  }

  return NextResponse.json({ data: newMeta.brand_profile, mission: missionResults.find((result) => result.isNewMilestone) ?? missionResults[0] });
});
