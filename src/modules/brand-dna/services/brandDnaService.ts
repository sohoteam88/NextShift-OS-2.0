// ============================================================
// Brand DNA Service
// Canonical source: BrandProfile table. Falls back to metadata.
// ============================================================

import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { type BrandDNA, type BrandDNASnapshot, EMPTY_BRAND_DNA, mapLegacyProfileToDNA } from '../types';
import { validateBrandDNA } from './brandDnaValidator';
import { generateBrandDNA } from '@/modules/brand-discovery/brandDnaGenerator';

function dnaToBrandProfileRow(dna: BrandDNA, tenantId: string, userId: string) {
  return {
    tenantId, userId,
    brandName: dna.identity.brandName,
    personalName: dna.identity.personalName,
    brandPositioning: dna.identity.brandPositioning,
    slogan: dna.identity.slogan,
    targetAudience: dna.audience.targetAudience,
    audiencePainPoints: dna.audience.audiencePainPoints as unknown as Prisma.InputJsonValue,
    audienceGoals: dna.audience.audienceGoals as unknown as Prisma.InputJsonValue,
    audienceObjections: dna.audience.audienceObjections as unknown as Prisma.InputJsonValue,
    coreMessage: dna.messaging.coreMessage,
    uniqueAngle: dna.messaging.uniqueAngle,
    elevatorPitch: dna.messaging.elevatorPitch,
    contentTone: dna.content.contentTone,
    contentPillars: dna.content.contentPillars as unknown as Prisma.InputJsonValue,
    storytellingStyle: dna.content.storytellingStyle,
    primaryOffer: dna.offer.primaryOffer,
    secondaryOffer: dna.offer.secondaryOffer,
    transformationPromise: dna.offer.transformationPromise,
    brandColors: dna.visual.brandColors as unknown as Prisma.InputJsonValue,
    profileImagePrompt: dna.visual.profileImagePrompt,
    coverBannerPrompt: dna.visual.coverBannerPrompt,
    confidenceScore: dna.meta.confidenceScore,
    version: dna.meta.version,
    publishedAt: dna.meta.publishedAt ? new Date(dna.meta.publishedAt) : null,
  };
}

export const brandDnaService = {
  async getBrandDNA(userId: string): Promise<BrandDNA> {
    // PRIMARY: BrandProfile table
    const bp = await prisma.brandProfile.findUnique({ where: { userId } });
    if (bp) {
      return mapLegacyProfileToDNA({
        brandName: bp.brandName, personalName: bp.personalName,
        brandPositioning: bp.brandPositioning, slogan: bp.slogan,
        target_audience: bp.targetAudience, targetAudience: bp.targetAudience,
        audience_pain_points: bp.audiencePainPoints,
        audienceGoals: bp.audienceGoals,
        audienceObjections: bp.audienceObjections,
        coreMessage: bp.coreMessage, uniqueAngle: bp.uniqueAngle,
        elevatorPitch: bp.elevatorPitch, contentTone: bp.contentTone,
        content_pillars: bp.contentPillars, storytellingStyle: bp.storytellingStyle,
        primaryOffer: bp.primaryOffer, secondaryOffer: bp.secondaryOffer,
        transformationPromise: bp.transformationPromise,
        brandColors: bp.brandColors, profileImagePrompt: bp.profileImagePrompt,
        coverBannerPrompt: bp.coverBannerPrompt,
        confidenceScore: bp.confidenceScore, version: bp.version,
        publishedAt: bp.publishedAt?.toISOString() ?? null,
        generatedAt: bp.createdAt.toISOString(), updatedAt: bp.updatedAt.toISOString(),
      });
    }
    // FALLBACK
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    return mapLegacyProfileToDNA((user?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown> | null);
  },

  async saveBrandDNA(userId: string, dna: BrandDNA): Promise<BrandDNA> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!user) throw new Error('User not found');
    const updated: BrandDNA = { ...dna, meta: { ...dna.meta, updatedAt: new Date().toISOString(), version: (dna.meta.version ?? 0) + 1 } };
    await this.createSnapshot(userId, updated);

    // PRIMARY: Upsert into BrandProfile table
    await prisma.brandProfile.upsert({
      where: { userId },
      create: dnaToBrandProfileRow(updated, user.tenantId, userId),
      update: dnaToBrandProfileRow(updated, user.tenantId, userId),
    });

    // BACKWARD COMPAT: Also update metadata for legacy readers
    const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const existingMeta = (existingUser?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({
      where: { id: userId },
      data: { metadata: { ...existingMeta, brand_profile: updated as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue },
    });

    return updated;
  },

  async updateBrandDNA(userId: string, patch: Partial<BrandDNA>): Promise<BrandDNA> {
    const current = await this.getBrandDNA(userId);
    return this.saveBrandDNA(userId, {
      identity: { ...current.identity, ...patch.identity },
      audience: { ...current.audience, ...patch.audience },
      messaging: { ...current.messaging, ...patch.messaging },
      content: { ...current.content, ...patch.content },
      offer: { ...current.offer, ...patch.offer },
      visual: { ...current.visual, ...patch.visual },
      meta: { ...current.meta, ...patch.meta, updatedAt: new Date().toISOString(), version: current.meta.version + 1 },
    });
  },

  async regenerateBrandDNA(userId: string, interviewId: string): Promise<BrandDNA> {
    const interview = await prisma.brandInterview.findUnique({ where: { id: interviewId } });
    if (!interview?.extractedProfile) throw new Error('No extracted profile found');
    const extracted = interview.extractedProfile as Record<string, unknown>;
    const generated = generateBrandDNA({
      identity: extracted.identity as string, expertise: extracted.expertise as string[],
      story: extracted.story as string, audience: extracted.audience as string,
      positioning: extracted.positioning as string, target_audience: extracted.target_audience as string,
      audience_pain_points: extracted.audience_pain_points as string[],
      personality: extracted.personality as string, value_proposition: extracted.value_proposition as string,
      differentiator: extracted.differentiator as string,
      content_pillars: extracted.content_pillars as any,
      content_direction: extracted.content_direction as string,
    });
    const current = await this.getBrandDNA(userId);
    const merged: BrandDNA = {
      identity: { brandName: generated.brandName || current.identity.brandName, personalName: current.identity.personalName, brandPositioning: generated.brandPositioning || current.identity.brandPositioning, slogan: generated.slogan || current.identity.slogan },
      audience: { ...current.audience, targetAudience: generated.targetAudience || current.audience.targetAudience },
      messaging: { coreMessage: generated.coreMessage || current.messaging.coreMessage, uniqueAngle: current.messaging.uniqueAngle, elevatorPitch: current.messaging.elevatorPitch },
      content: { contentTone: generated.contentTone || current.content.contentTone, contentPillars: generated.contentPillars.length > 0 ? generated.contentPillars : current.content.contentPillars, storytellingStyle: current.content.storytellingStyle },
      offer: { ...current.offer, transformationPromise: generated.offerDirection || current.offer.transformationPromise },
      visual: current.visual,
      meta: { ...current.meta, confidenceScore: 75, generatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: current.meta.version + 1 },
    };
    return this.saveBrandDNA(userId, merged);
  },

  async validateBrandDNA(userId: string) { return validateBrandDNA(await this.getBrandDNA(userId)); },

  async publishBrandDNA(userId: string): Promise<BrandDNA> {
    const dna = await this.getBrandDNA(userId);
    return this.saveBrandDNA(userId, { ...dna, meta: { ...dna.meta, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: dna.meta.version + 1 } });
  },

  async createSnapshot(userId: string, dna: BrandDNA): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
      const existingMeta = (user?.metadata as Record<string, unknown>) ?? {};
      const versions: BrandDNASnapshot[] = Array.isArray(existingMeta.brand_dna_versions) ? (existingMeta.brand_dna_versions as BrandDNASnapshot[]) : [];
      versions.push({ version: dna.meta.version, snapshot: dna, createdAt: new Date().toISOString(), label: dna.meta.publishedAt ? 'Published' : 'Auto-saved' });
      await prisma.user.update({ where: { id: userId }, data: { metadata: { ...existingMeta, brand_dna_versions: versions.slice(-20) as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
    } catch { /* non-critical */ }
  },

  async getVersions(userId: string): Promise<BrandDNASnapshot[]> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    return (Array.isArray((user?.metadata as Record<string, unknown>)?.brand_dna_versions) ? (user?.metadata as Record<string, unknown>).brand_dna_versions as BrandDNASnapshot[] : []);
  },

  async restoreVersion(userId: string, version: number): Promise<BrandDNA> {
    const versions = await this.getVersions(userId);
    const target = versions.find((v) => v.version === version);
    if (!target) throw new Error(`Version ${version} not found`);
    return this.saveBrandDNA(userId, { ...target.snapshot, meta: { ...target.snapshot.meta, updatedAt: new Date().toISOString(), version: (await this.getBrandDNA(userId)).meta.version + 1 } });
  },
};
