// ============================================================
// Social Prompt Generator
// Generates FB/IG/BIO/Visual content from BrandContext.
// Deterministic — no AI API calls.
// ============================================================

import type { BrandContext } from '@/modules/brand-dna/types';
import type { FacebookSetup, InstagramSetup, VisualBrandSetup } from './types';

// ============================================================
// Facebook Generator
// ============================================================

function pickCTA(offerPrimary: string): FacebookSetup['ctaType'] {
  const text = offerPrimary.toLowerCase();
  if (text.includes('whatsapp') || text.includes('咨询') || text.includes('询问')) return 'whatsapp';
  if (text.includes('预约') || text.includes('book') || text.includes('appointment')) return 'book';
  if (text.includes('注册') || text.includes('sign') || text.includes('报名')) return 'sign_up';
  if (text.includes('购买') || text.includes('shop') || text.includes('产品')) return 'shop';
  return 'learn_more';
}

function ctaLabel(ctaType: FacebookSetup['ctaType']): string {
  switch (ctaType) {
    case 'whatsapp': return '发送 WhatsApp 消息';
    case 'learn_more': return '了解更多';
    case 'sign_up': return '立即注册';
    case 'book': return '预约咨询';
    case 'shop': return '查看产品';
  }
}

export function generateFacebookSetup(ctx: BrandContext): FacebookSetup {
  const pageName = ctx.brandName || `${ctx.personalName || 'Your'} 的品牌主页`;
  const ctaType = pickCTA(ctx.offer.primary);
  const cta = ctaLabel(ctaType);

  const about = [
    ctx.positioning ? `${ctx.positioning}` : '',
    ctx.audience ? `帮助${ctx.audience}实现目标。` : '',
    ctx.messaging.coreMessage ? `核心理念：${ctx.messaging.coreMessage}` : '',
  ].filter(Boolean).join('\n');

  const firstPost = ctx.personalName
    ? `大家好，我是${ctx.personalName}。欢迎来到我的主页！我在这里分享关于${ctx.contentPillars.slice(0, 2).map((p) => p.name).join('和')}的内容。关注我，一起成长！`
    : '欢迎来到我的主页！关注获取最新内容和更新。';

  return { pageName, about, cta, ctaType, firstPostDirection: firstPost };
}

// ============================================================
// Instagram Generator
// ============================================================

export function generateInstagramSetup(ctx: BrandContext): InstagramSetup {
  const username = ctx.brandName
    ? ctx.brandName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : (ctx.personalName || 'user').toLowerCase().replace(/\s+/g, '_');

  const displayName = ctx.brandName || ctx.personalName || '';

  // IG BIO format: who you help → transformation → proof → CTA
  const bioLines: string[] = [];

  // Line 1: Who you help
  if (ctx.audience) {
    bioLines.push(`帮助${ctx.audience}`);
  } else if (ctx.positioning) {
    bioLines.push(ctx.positioning);
  }

  // Line 2: Transformation
  if (ctx.offer.transformation) {
    bioLines.push(ctx.offer.transformation);
  } else if (ctx.messaging.coreMessage) {
    bioLines.push(ctx.messaging.coreMessage);
  }

  // Line 3: Personality / proof
  if (ctx.tone) {
    bioLines.push(`${ctx.tone} | 真实分享`);
  }

  // Line 4: CTA
  bioLines.push('👇 点击下方链接');

  const bio = bioLines.join('\n');

  const highlights = ctx.contentPillars.slice(0, 4).map((p) => `${p.emoji} ${p.name}`);

  const linkCta = ctx.offer.primary ? `了解${ctx.offer.primary}` : '了解更多';
  const whatsappPrefilled = `你好，我对${ctx.offer.primary || '你的服务'}感兴趣，想了解更多。`;

  return {
    username,
    displayName,
    bio,
    highlights,
    linkInBio: '',
    linkCta,
    whatsappPrefilled,
  };
}

// ============================================================
// Visual Generator
// ============================================================

export function generateVisualSetup(ctx: BrandContext): VisualBrandSetup {
  const colors = ctx.visualIdentity.colors.length >= 2
    ? ctx.visualIdentity.colors
    : ['#2563eb', '#1e40af', '#f59e0b'];

  const profilePrompt = [
    '专业头像',
    ctx.tone ? `风格：${ctx.tone}` : '',
    '干净背景，自然光线，正面微笑',
    ctx.personalName ? `人物：${ctx.personalName}` : '',
    '适合社交媒体使用',
  ].filter(Boolean).join('。');

  const bannerPrompt = [
    '社交媒体封面图',
    ctx.brandName ? `标题：${ctx.brandName}` : '',
    ctx.positioning ? `副标题：${ctx.positioning}` : '',
    ctx.tone ? `风格：${ctx.tone}` : '',
    `配色：${colors.slice(0, 2).join('、')}`,
    '适合 Canva 或 AI 图片生成器使用',
  ].filter(Boolean).join('。');

  return {
    profilePicturePrompt: profilePrompt,
    coverBannerPrompt: bannerPrompt,
    brandColors: colors,
  };
}
