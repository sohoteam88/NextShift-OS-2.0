import prisma from '@/lib/prisma';
import { mapLegacyProfileToDNA, type BrandDNA } from '@/modules/brand-dna/types';
import type { BrandHealthSnapshot } from '../types/brand-intelligence';

type MissingField = {
  field: string;
  section: string;
  label: string;
};

function scoreIdentity(dna: BrandDNA): number {
  let score = 0;
  if (dna.identity.brandName.trim()) score += 25;
  if (dna.identity.personalName.trim()) score += 25;
  if (dna.identity.brandPositioning.trim()) score += 30;
  if (dna.identity.slogan.trim()) score += 20;
  return score;
}

function scoreAudience(dna: BrandDNA): number {
  let score = 0;
  if (dna.audience.targetAudience.trim()) score += 40;
  if (dna.audience.audiencePainPoints.length > 0) score += 25;
  if (dna.audience.audienceGoals.length > 0) score += 20;
  if (dna.audience.audienceObjections.length > 0) score += 15;
  return score;
}

function scoreMessaging(dna: BrandDNA): number {
  let score = 0;
  if (dna.messaging.coreMessage.trim()) score += 40;
  if (dna.messaging.uniqueAngle.trim()) score += 30;
  if (dna.messaging.elevatorPitch.trim()) score += 30;
  return score;
}

function scoreContent(dna: BrandDNA): number {
  let score = 0;
  if (dna.content.contentTone.trim()) score += 20;
  if (dna.content.contentPillars.length >= 3) {
    score += 40;
  } else if (dna.content.contentPillars.length > 0) {
    score += 20;
  }
  if (dna.content.storytellingStyle.trim()) score += 40;
  return score;
}

function scoreOffer(dna: BrandDNA): number {
  let score = 0;
  if (dna.offer.primaryOffer.trim()) score += 40;
  if (dna.offer.secondaryOffer.trim()) score += 20;
  if (dna.offer.transformationPromise.trim()) score += 40;
  return score;
}

function scoreVisual(dna: BrandDNA): number {
  let score = 0;
  if (dna.visual.brandColors.length >= 2) score += 30;
  if (dna.visual.profileImagePrompt.trim()) score += 35;
  if (dna.visual.coverBannerPrompt.trim()) score += 35;
  return score;
}

function findMissingFields(dna: BrandDNA): MissingField[] {
  const missing: MissingField[] = [];

  if (!dna.identity.brandName.trim()) missing.push({ field: 'brandName', section: 'identity', label: '品牌名称' });
  if (!dna.identity.personalName.trim()) missing.push({ field: 'personalName', section: 'identity', label: '个人姓名' });
  if (!dna.identity.brandPositioning.trim()) missing.push({ field: 'brandPositioning', section: 'identity', label: '品牌定位' });
  if (!dna.identity.slogan.trim()) missing.push({ field: 'slogan', section: 'identity', label: '标语' });

  if (!dna.audience.targetAudience.trim()) missing.push({ field: 'targetAudience', section: 'audience', label: '目标受众' });
  if (dna.audience.audiencePainPoints.length === 0) missing.push({ field: 'audiencePainPoints', section: 'audience', label: '受众痛点' });
  if (dna.audience.audienceGoals.length === 0) missing.push({ field: 'audienceGoals', section: 'audience', label: '受众目标' });

  if (!dna.messaging.coreMessage.trim()) missing.push({ field: 'coreMessage', section: 'messaging', label: '核心信息' });
  if (!dna.messaging.uniqueAngle.trim()) missing.push({ field: 'uniqueAngle', section: 'messaging', label: '独特角度' });
  if (!dna.messaging.elevatorPitch.trim()) missing.push({ field: 'elevatorPitch', section: 'messaging', label: '电梯演讲' });

  if (dna.content.contentPillars.length < 3) missing.push({ field: 'contentPillars', section: 'content', label: '内容支柱（至少3个）' });
  if (!dna.content.storytellingStyle.trim()) missing.push({ field: 'storytellingStyle', section: 'content', label: '讲故事风格' });

  if (!dna.offer.primaryOffer.trim()) missing.push({ field: 'primaryOffer', section: 'offer', label: '主要服务' });
  if (!dna.offer.transformationPromise.trim()) missing.push({ field: 'transformationPromise', section: 'offer', label: '转变承诺' });

  if (dna.visual.brandColors.length < 2) missing.push({ field: 'brandColors', section: 'visual', label: '品牌颜色（至少2个）' });
  if (!dna.visual.profileImagePrompt.trim()) missing.push({ field: 'profileImagePrompt', section: 'visual', label: '头像提示词' });

  return missing;
}

function generateFixRecommendations(missing: MissingField[]): string[] {
  const bySection = new Map<string, string[]>();

  for (const item of missing) {
    if (!bySection.has(item.section)) bySection.set(item.section, []);
    bySection.get(item.section)!.push(item.label);
  }

  const recs: string[] = [];
  const sectionOrder = ['identity', 'audience', 'messaging', 'content', 'offer', 'visual'];
  const sectionNames: Record<string, string> = {
    identity: '品牌身份',
    audience: '受众定位',
    messaging: '信息传达',
    content: '内容策略',
    offer: '服务产品',
    visual: '视觉形象',
  };

  for (const section of sectionOrder) {
    const fields = bySection.get(section);
    if (fields && fields.length > 0) {
      recs.push(`补充「${sectionNames[section] ?? section}」: ${fields.join('、')}`);
    }
  }

  return recs;
}

function toBrandDnaInput(profile: Record<string, unknown>) {
  return {
    brandName: (profile.brandName as string) ?? (profile.identity as string) ?? '',
    personalName: (profile.personalName as string) ?? '',
    brandPositioning: (profile.positioning as string) ?? (profile.brandPositioning as string) ?? '',
    slogan: (profile.slogan as string) ?? '',
    targetAudience: (profile.target_audience as string) ?? (profile.targetAudience as string) ?? '',
    target_audience: (profile.target_audience as string) ?? (profile.targetAudience as string) ?? '',
    audience_pain_points: Array.isArray(profile.audience_pain_points) ? profile.audience_pain_points : [],
    audienceGoals: Array.isArray(profile.audienceGoals) ? profile.audienceGoals : [],
    audienceObjections: Array.isArray(profile.audienceObjections) ? profile.audienceObjections : [],
    coreMessage: (profile.coreMessage as string) ?? (profile.value_proposition as string) ?? '',
    uniqueAngle: (profile.differentiator as string) ?? (profile.uniqueAngle as string) ?? '',
    elevatorPitch: (profile.elevatorPitch as string) ?? '',
    contentTone: (profile.contentTone as string) ?? (profile.personality as string) ?? '温暖亲切',
    content_pillars: Array.isArray(profile.content_pillars) ? profile.content_pillars : [],
    storytellingStyle: (profile.storytellingStyle as string) ?? '',
    primaryOffer: (profile.primaryOffer as string) ?? '',
    secondaryOffer: (profile.secondaryOffer as string) ?? '',
    transformationPromise: (profile.transformationPromise as string) ?? (profile.value_proposition as string) ?? '',
    brandColors: Array.isArray(profile.brandColors) ? profile.brandColors : ['#2563eb', '#1e40af', '#f59e0b'],
    profileImagePrompt: (profile.profileImagePrompt as string) ?? '',
    coverBannerPrompt: (profile.coverBannerPrompt as string) ?? '',
    confidenceScore: (profile.confidenceScore as number) ?? 0,
    version: (profile.version as number) ?? 1,
    publishedAt: (profile.publishedAt as string) ?? null,
    generatedAt: (profile.generatedAt as string) ?? new Date().toISOString(),
    updatedAt: (profile.updatedAt as string) ?? new Date().toISOString(),
  };
}

async function resolveBrandDNA(userId: string): Promise<BrandDNA> {
  const bp = await prisma.brandProfile.findUnique({ where: { userId } });
  if (bp) {
    return mapLegacyProfileToDNA(
      toBrandDnaInput({
        brandName: bp.brandName,
        personalName: bp.personalName,
        brandPositioning: bp.brandPositioning,
        slogan: bp.slogan,
        targetAudience: bp.targetAudience,
        target_audience: bp.targetAudience,
        audience_pain_points: bp.audiencePainPoints,
        audienceGoals: bp.audienceGoals,
        audienceObjections: bp.audienceObjections,
        coreMessage: bp.coreMessage,
        uniqueAngle: bp.uniqueAngle,
        elevatorPitch: bp.elevatorPitch,
        contentTone: bp.contentTone,
        content_pillars: bp.contentPillars,
        storytellingStyle: bp.storytellingStyle,
        primaryOffer: bp.primaryOffer,
        secondaryOffer: bp.secondaryOffer,
        transformationPromise: bp.transformationPromise,
        brandColors: bp.brandColors,
        profileImagePrompt: bp.profileImagePrompt,
        coverBannerPrompt: bp.coverBannerPrompt,
        confidenceScore: bp.confidenceScore,
        version: bp.version,
        publishedAt: bp.publishedAt?.toISOString() ?? null,
        generatedAt: bp.createdAt.toISOString(),
        updatedAt: bp.updatedAt.toISOString(),
      }),
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const profile = (user?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown> | null;
  return mapLegacyProfileToDNA(profile);
}

export async function getBrandHealthSnapshot(userId: string): Promise<BrandHealthSnapshot> {
  const dna = await resolveBrandDNA(userId);

  const identity = scoreIdentity(dna);
  const audience = scoreAudience(dna);
  const messaging = scoreMessaging(dna);
  const content = scoreContent(dna);
  const offer = scoreOffer(dna);
  const visual = scoreVisual(dna);

  const overallScore = Math.round(
    identity * 0.2 +
    audience * 0.2 +
    messaging * 0.15 +
    content * 0.15 +
    offer * 0.2 +
    visual * 0.1,
  );

  const missing = findMissingFields(dna);
  const recommendations = generateFixRecommendations(missing);

  return {
    overallScore,
    isComplete: overallScore >= 80,
    nextRecommendation: recommendations[0] ?? null,
    categoryScores: {
      identity,
      audience,
      messaging,
      content,
      offer,
      visual,
    },
    missingFields: missing.map((item) => `${item.section}.${item.field}`),
    recommendations,
  };
}
