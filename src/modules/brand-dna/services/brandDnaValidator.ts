// ============================================================
// Brand DNA Validator
// Checks completeness of all 6 DNA dimensions.
// ============================================================

import type { BrandDNA, DNAHealthScore } from '../types';
import { EMPTY_BRAND_DNA } from '../types';

// ============================================================
// Dimension scoring functions
// ============================================================

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

// ============================================================
// Missing field detection
// ============================================================

interface MissingField {
  field: string;
  section: string;
  label: string;
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

// ============================================================
// Recommendation generation
// ============================================================

function generateFixRecommendations(missing: MissingField[]): string[] {
  const bySection = new Map<string, string[]>();
  for (const m of missing) {
    if (!bySection.has(m.section)) bySection.set(m.section, []);
    bySection.get(m.section)!.push(m.label);
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

// ============================================================
// Main validator
// ============================================================

export function validateBrandDNA(dna: BrandDNA): DNAHealthScore {
  const identityClarity = scoreIdentity(dna);
  const audienceClarity = scoreAudience(dna);
  const messagingClarity = scoreMessaging(dna);
  const contentClarity = scoreContent(dna);
  const offerClarity = scoreOffer(dna);
  const visualClarity = scoreVisual(dna);

  // Weighted overall score
  const overallScore = Math.round(
    identityClarity * 0.2 +
    audienceClarity * 0.2 +
    messagingClarity * 0.15 +
    contentClarity * 0.15 +
    offerClarity * 0.2 +
    visualClarity * 0.1,
  );

  const missing = findMissingFields(dna);
  const recommendations = generateFixRecommendations(missing);

  return {
    identityClarity,
    audienceClarity,
    messagingClarity,
    contentClarity,
    offerClarity,
    visualClarity,
    overallScore,
    missingFields: missing.map((m) => `${m.section}.${m.field}`),
    recommendations,
  };
}
