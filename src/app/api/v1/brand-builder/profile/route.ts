import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { brandDnaService } from '@/modules/brand-dna/services/brandDnaService';
import type { BrandDNA, BrandDnaPatch } from '@/modules/brand-dna/types';

export const dynamic = 'force-dynamic';

function stringUpdate(updates: Record<string, unknown>, ...keys: string[]) {
  const value = keys.map((key) => updates[key]).find((candidate) => typeof candidate === 'string');
  return typeof value === 'string' ? value : undefined;
}

/** Maps only known DNA aliases; unrelated legacy profile keys remain metadata-only. */
function profileUpdatesToDnaPatch(updates: Record<string, unknown>): BrandDnaPatch {
  const explicitlyEdited = Array.isArray(updates.__dnaEditedFields)
    ? new Set(updates.__dnaEditedFields.filter((key): key is string => typeof key === 'string'))
    : null;
  const includes = (...keys: string[]) => !explicitlyEdited || keys.some((key) => explicitlyEdited.has(key));
  const identity = {
    brandName: includes('brandName') ? stringUpdate(updates, 'brandName') : undefined,
    personalName: includes('personalName') ? stringUpdate(updates, 'personalName') : undefined,
    brandPositioning: includes('brandPositioning', 'positioning', 'identity') ? stringUpdate(updates, 'brandPositioning', 'positioning', 'identity') : undefined,
    slogan: includes('slogan') ? stringUpdate(updates, 'slogan') : undefined,
  };
  const audience = {
    targetAudience: includes('targetAudience', 'target_audience') ? stringUpdate(updates, 'targetAudience', 'target_audience') : undefined,
    audiencePainPoints: includes('audiencePainPoints', 'audience_pain_points') && Array.isArray(updates.audiencePainPoints) ? updates.audiencePainPoints as string[] : includes('audiencePainPoints', 'audience_pain_points') && Array.isArray(updates.audience_pain_points) ? updates.audience_pain_points as string[] : undefined,
    audienceGoals: includes('audienceGoals') && Array.isArray(updates.audienceGoals) ? updates.audienceGoals as string[] : undefined,
    audienceObjections: includes('audienceObjections') && Array.isArray(updates.audienceObjections) ? updates.audienceObjections as string[] : undefined,
  };
  const messaging = {
    coreMessage: includes('coreMessage', 'value_proposition') ? stringUpdate(updates, 'coreMessage', 'value_proposition') : undefined,
    uniqueAngle: includes('uniqueAngle', 'differentiator') ? stringUpdate(updates, 'uniqueAngle', 'differentiator') : undefined,
    elevatorPitch: includes('elevatorPitch', 'story') ? stringUpdate(updates, 'elevatorPitch', 'story') : undefined,
  };
  const content = {
    contentTone: includes('contentTone', 'content_voice') ? stringUpdate(updates, 'contentTone', 'content_voice') : undefined,
    contentPillars: includes('contentPillars') && Array.isArray(updates.contentPillars) ? updates.contentPillars as BrandDNA['content']['contentPillars'] : undefined,
    storytellingStyle: includes('storytellingStyle') ? stringUpdate(updates, 'storytellingStyle') : undefined,
  };
  const offer = {
    primaryOffer: includes('primaryOffer', 'offer') ? stringUpdate(updates, 'primaryOffer', 'offer') : undefined,
    secondaryOffer: includes('secondaryOffer') ? stringUpdate(updates, 'secondaryOffer') : undefined,
    transformationPromise: includes('transformationPromise') ? stringUpdate(updates, 'transformationPromise') : undefined,
  };
  const visual = {
    brandColors: includes('brandColors') && Array.isArray(updates.brandColors) ? updates.brandColors as string[] : undefined,
    profileImagePrompt: includes('profileImagePrompt') ? stringUpdate(updates, 'profileImagePrompt') : undefined,
    coverBannerPrompt: includes('coverBannerPrompt') ? stringUpdate(updates, 'coverBannerPrompt') : undefined,
  };
  const populated = <T extends Record<string, unknown>>(section: T) => Object.fromEntries(
    Object.entries(section).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
  return {
    ...(Object.keys(populated(identity)).length ? { identity: populated(identity) } : {}),
    ...(Object.keys(populated(audience)).length ? { audience: populated(audience) } : {}),
    ...(Object.keys(populated(messaging)).length ? { messaging: populated(messaging) } : {}),
    ...(Object.keys(populated(content)).length ? { content: populated(content) } : {}),
    ...(Object.keys(populated(offer)).length ? { offer: populated(offer) } : {}),
    ...(Object.keys(populated(visual)).length ? { visual: populated(visual) } : {}),
  };
}

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { metadata: true, phone: true, avatarUrl: true },
  });
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
      phone: dbUser?.phone ?? '',
      avatarUrl: dbUser?.avatarUrl ?? '',
    },
  });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const updates = (await request.json()) as Record<string, unknown>;
  const legacyUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => key !== '__dnaEditedFields'));

  const dnaPatch = profileUpdatesToDnaPatch(updates);
  const hasDnaPatch = Object.values(dnaPatch).some((section) => section && Object.keys(section).length > 0);
  const savedDna = hasDnaPatch ? await brandDnaService.updateBrandDNA(user.id, dnaPatch) : null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const existingMeta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const existingProfile = (existingMeta.brand_profile as Record<string, unknown>) ?? {};

  const newMeta = {
    ...existingMeta,
    brand_profile: { ...existingProfile, ...legacyUpdates },
  };

  const phone = typeof updates.phone === 'string' ? updates.phone.trim() : undefined;
  const avatarUrl = typeof updates.avatarUrl === 'string' ? updates.avatarUrl.trim() : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      metadata: newMeta as Prisma.InputJsonValue,
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    },
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

  return NextResponse.json({
    data: { ...newMeta.brand_profile, ...(savedDna ? { brandDnaVersion: savedDna.meta.version } : {}) },
    mission: missionResults.find((result) => result.isNewMilestone) ?? missionResults[0],
  });
});
