// ============================================================
// Social Setup Validator — Readiness Scoring
// ============================================================

import type { SocialSetup, SocialReadinessResult } from './types';

export function validateSocialSetup(setup: SocialSetup): SocialReadinessResult {
  const missingItems: string[] = [];
  const recommendations: string[] = [];

  // Facebook completeness
  let facebookCompleteness = 0;
  if (setup.facebook.pageName.trim()) facebookCompleteness += 25;
  if (setup.facebook.about.trim()) facebookCompleteness += 25;
  if (setup.facebook.cta.trim()) facebookCompleteness += 30;
  if (setup.facebook.firstPostDirection.trim()) facebookCompleteness += 20;

  if (!setup.facebook.pageName.trim()) {
    missingItems.push('facebook.pageName');
    recommendations.push('设置 Facebook 主页名称');
  }
  if (!setup.facebook.about.trim()) {
    missingItems.push('facebook.about');
    recommendations.push('填写 Facebook 关于信息');
  }
  if (!setup.facebook.cta.trim()) {
    missingItems.push('facebook.cta');
    recommendations.push('选择一个主要行动按钮（比如 WhatsApp 询问）');
  }

  // Instagram completeness
  let instagramCompleteness = 0;
  if (setup.instagram.username.trim()) instagramCompleteness += 20;
  if (setup.instagram.displayName.trim()) instagramCompleteness += 15;
  if (setup.instagram.bio.trim()) instagramCompleteness += 35;
  if (setup.instagram.highlights.length > 0) instagramCompleteness += 15;
  if (setup.instagram.linkCta.trim()) instagramCompleteness += 15;

  if (!setup.instagram.bio.trim()) {
    missingItems.push('instagram.bio');
    recommendations.push('生成一个清楚说明你帮助谁的 IG BIO');
  }
  if (setup.instagram.highlights.length === 0) {
    recommendations.push('设置 3-4 个 IG Highlights 分类');
  }

  // BIO clarity
  let bioClarity = 0;
  const bio = setup.instagram.bio;
  if (bio.includes('帮助')) bioClarity += 30;
  if (bio.length >= 50) bioClarity += 30;
  if (bio.includes('👇') || bio.includes('点击') || bio.includes('链接')) bioClarity += 40;

  if (bioClarity < 50) {
    recommendations.push('先生成一个清楚说明你帮助谁的 BIO');
  }

  // CTA clarity
  let ctaClarity = 0;
  if (setup.facebook.cta.trim()) ctaClarity += 50;
  if (setup.instagram.linkCta.trim()) ctaClarity += 50;

  if (ctaClarity < 50) {
    recommendations.push('先选择一个主要动作，比如 WhatsApp 询问');
  }

  // Visual consistency
  let visualConsistency = 0;
  if (setup.visual.brandColors.length >= 2) visualConsistency += 30;
  if (setup.visual.profilePicturePrompt.trim()) visualConsistency += 35;
  if (setup.visual.coverBannerPrompt.trim()) visualConsistency += 35;

  if (visualConsistency < 50) {
    recommendations.push('先准备头像和封面方向，避免账号看起来像空壳');
  }

  // Link strategy
  let linkStrategy = 0;
  if (setup.linkStrategy.trim()) linkStrategy += 100;

  if (!setup.linkStrategy.trim()) {
    missingItems.push('linkStrategy');
    recommendations.push('选择 Link in Bio 的主要目标');
  }

  // Overall score (weighted)
  const overallScore = Math.round(
    facebookCompleteness * 0.2 +
    instagramCompleteness * 0.25 +
    bioClarity * 0.2 +
    ctaClarity * 0.15 +
    visualConsistency * 0.1 +
    linkStrategy * 0.1,
  );

  return {
    score: overallScore,
    facebookCompleteness,
    instagramCompleteness,
    bioClarity,
    ctaClarity,
    visualConsistency,
    linkStrategy,
    missingItems,
    recommendations: recommendations.slice(0, 5),
  };
}
