import type { GeneratedPost, ContentQualityResult } from './types';

export function validateContent(post: GeneratedPost): ContentQualityResult {
  const missingItems: string[] = [];
  const recommendations: string[] = [];

  // Brand alignment
  let brandAlignment = 70; // base score since generated from BrandContext
  if (post.body.length < 50) {
    brandAlignment -= 20;
    recommendations.push('内容太短，加入更多品牌相关元素');
  }

  // Audience relevance
  let audienceRelevance = 70;
  if (!post.body.includes('你')) {
    audienceRelevance -= 30;
    recommendations.push('内容缺少"你"字，加入直接对受众说的话');
  }

  // Hook strength
  let hookStrength = post.hook.length >= 15 ? 70 : 30;
  if (post.hook.includes('？') || post.hook.includes('?') || post.hook.includes('吗')) {
    hookStrength += 20;
  } else {
    recommendations.push('Hook 加入反问或悬念，更能吸引注意力');
  }

  // CTA clarity
  let ctaClarity = post.cta.trim() ? 80 : 0;
  if (!post.cta.trim()) {
    missingItems.push('cta');
    recommendations.push('每篇内容都需要一个轻 CTA，例如：想了解可以私信我');
  }

  // Platform fit
  let platformFit = 70;
  if (post.platform === 'tiktok' && post.body.length > 200) {
    platformFit -= 20;
    recommendations.push('TikTok 文案应该更短更直接');
  }
  if (post.platform === 'xhs' && !post.hashtags.some((h) => h.length > 2)) {
    platformFit -= 10;
  }

  // Beginner friendliness
  let beginnerFriendliness = 80;

  const overallScore = Math.round(
    brandAlignment * 0.2 +
    audienceRelevance * 0.2 +
    hookStrength * 0.2 +
    ctaClarity * 0.15 +
    platformFit * 0.15 +
    beginnerFriendliness * 0.1,
  );

  return {
    score: overallScore,
    brandAlignment,
    audienceRelevance,
    hookStrength,
    ctaClarity,
    platformFit,
    beginnerFriendliness,
    missingItems,
    recommendations: recommendations.slice(0, 4),
  };
}
