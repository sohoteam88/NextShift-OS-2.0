import prisma from '@/lib/prisma';
import { brandDnaService } from '@/modules/brand-dna/services/brandDnaService';
import type { BrandRegenerationSnapshot } from '../types/brand-regeneration';

const FIELD_PATHS = [
  'identity.brandName',
  'identity.personalName',
  'identity.brandPositioning',
  'identity.slogan',
  'audience.targetAudience',
  'audience.audiencePainPoints',
  'audience.audienceGoals',
  'audience.audienceObjections',
  'messaging.coreMessage',
  'messaging.uniqueAngle',
  'messaging.elevatorPitch',
  'content.contentTone',
  'content.contentPillars',
  'content.storytellingStyle',
  'offer.primaryOffer',
  'offer.secondaryOffer',
  'offer.transformationPromise',
  'visual.brandColors',
  'visual.profileImagePrompt',
  'visual.coverBannerPrompt',
  'meta.confidenceScore',
  'meta.generatedAt',
  'meta.updatedAt',
  'meta.version',
  'meta.publishedAt',
] as const;

function getPathValue(record: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[segment];
  }, record);
}

function collectChangedFields(before: unknown, after: unknown): string[] {
  return FIELD_PATHS.filter((path) => {
    const beforeValue = getPathValue(before, path);
    const afterValue = getPathValue(after, path);
    return JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
  });
}

function buildRecommendations(changedFields: string[]): string[] {
  const recommendations: string[] = [];

  if (changedFields.some((field) => field.startsWith('identity.'))) {
    recommendations.push('复核更新后的品牌身份字段，确认名称、定位和标语仍然符合你的当前方向。');
  }

  if (changedFields.some((field) => field.startsWith('audience.'))) {
    recommendations.push('检查目标受众是否更准确，再决定后续内容和漏斗应该面向谁。');
  }

  if (changedFields.some((field) => field.startsWith('messaging.'))) {
    recommendations.push('把新的核心信息带回到内容和介绍文案，避免旧说法继续留在系统里。');
  }

  if (changedFields.some((field) => field.startsWith('content.'))) {
    recommendations.push('确认内容支柱和语气更新后，再生成新的内容计划，避免继续沿用旧方向。');
  }

  if (changedFields.some((field) => field.startsWith('offer.'))) {
    recommendations.push('复核服务承诺和转变结果，确保新的品牌表达与当前产品一致。');
  }

  if (recommendations.length === 0) {
    recommendations.push('这次 regeneration 没有带来业务字段变化，只产生了版本更新。');
  }

  return recommendations;
}

export async function regenerateBrand(userId: string): Promise<BrandRegenerationSnapshot> {
  const before = await brandDnaService.getBrandDNA(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const interview = await prisma.brandInterview.findFirst({
    where: {
      userId,
      tenantId: user.tenantId,
      status: { in: ['extracted', 'confirmed'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!interview) {
    throw new Error('No completed interview found. Complete Brand Discovery first.');
  }

  const after = await brandDnaService.regenerateBrandDNA(userId, interview.id);
  const changedFields = collectChangedFields(before, after);

  return {
    before,
    after,
    changedFields,
    recommendations: buildRecommendations(changedFields),
  };
}

export const brandRegenerationService = {
  regenerateBrand,
};
