// ============================================================
// Content Generators — Pillars, Calendar, Posts
// All deterministic, powered by BrandContext.
// ============================================================

import type { BrandContext, ContentPillar } from '@/modules/brand-dna/types';
import type { Platform, ContentFormat, FunnelStage, GeneratedPost, ContentCalendarItem } from './types';

// ---- Pillars ----
export function generateContentPillars(ctx: BrandContext): ContentPillar[] {
  if (ctx.contentPillars.length > 0) return ctx.contentPillars;

  return [
    { name: '个人故事', emoji: '📖', percentage: 25, description: '你的经历、动机和背后故事' },
    { name: '教育内容', emoji: '📚', percentage: 35, description: '分享专业知识和实用技巧' },
    { name: '客户见证', emoji: '🏆', percentage: 20, description: '客户成果和转变故事' },
    { name: '幕后花絮', emoji: '🎬', percentage: 10, description: '日常工作、真实一面' },
    { name: '互动问答', emoji: '💬', percentage: 10, description: '回答常见问题，建立信任' },
  ];
}

// ---- Calendar ----
const FORMATS: ContentFormat[] = ['text_post', 'carousel', 'reel', 'short_video', 'story'];
const PLATFORMS: Platform[] = ['facebook', 'instagram', 'tiktok', 'xhs'];
const FUNNEL_STAGES: FunnelStage[] = ['awareness', 'awareness', 'consideration', 'consideration', 'conversion', 'retention'];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

export function generateCalendar(
  ctx: BrandContext,
  pillars: ContentPillar[],
  days: 30 | 90 | 180,
): ContentCalendarItem[] {
  const items: ContentCalendarItem[] = [];
  const startDate = new Date();

  const hooks = [
    `你知道${ctx.audience || '很多人'}最大的困扰是什么吗？`,
    `我花了很长时间才明白这个道理...`,
    `${ctx.personalName || '我'}的故事，从一次失败开始。`,
    `如果你也在${ctx.audience || '这个领域'}，这篇文章是写给你的。`,
    `客户问我最多的问题之一是...`,
  ];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const pillar = pick(pillars, i);
    const platform = pick(PLATFORMS, i);
    const format = pick(FORMATS, Math.floor(i / 3));
    const funnelStage = pick(FUNNEL_STAGES, i);
    const hook = pick(hooks, i);

    items.push({
      date: date.toISOString().split('T')[0],
      pillar: pillar.name,
      pillarEmoji: pillar.emoji,
      title: `${pillar.name}: ${hook.slice(0, 30)}...`,
      hook,
      format,
      platform,
      cta: i % 3 === 0 ? '💬 你怎么看？评论区告诉我' : '🔗 想了解更多？私信我',
      funnelStage,
    });
  }

  return items;
}

// ---- Platform Post Generator ----
function generateFacebookPost(ctx: BrandContext, pillar: ContentPillar): { body: string; hashtags: string[] } {
  const body = [
    `${pillar.emoji} ${pillar.name}`,
    '',
    `大家好，我是${ctx.personalName || '我'}。今天想跟你聊聊关于${pillar.name}的话题。`,
    '',
    ctx.messaging.coreMessage || `我专注帮助${ctx.audience || '更多人'}实现目标。`,
    '',
    `如果你觉得有帮助，点赞分享给需要的人。`,
    `想了解更多？私信我 👇`,
  ].join('\n');

  return { body, hashtags: ['#个人品牌', '#成长', '#分享'] };
}

function generateInstagramPost(ctx: BrandContext, pillar: ContentPillar): { body: string; hashtags: string[] } {
  const body = [
    `${pillar.emoji} ${pillar.name}`,
    '',
    `${ctx.positioning || ''}`,
    '',
    `💡 关键点：`,
    `• 你的${pillar.name}决定了你的品牌方向`,
    `• 不要等完美才开始`,
    `• 先发再说`,
    '',
    `👇 双击支持，收藏以后看`,
  ].join('\n');

  const hashtags = [
    '#个人品牌', '#社交媒体', '#内容创作',
    pillar.name ? `#${pillar.name}` : '',
  ].filter(Boolean);

  return { body, hashtags };
}

function generateTikTokCaption(ctx: BrandContext, pillar: ContentPillar): { body: string; hashtags: string[] } {
  const hook = `还在烦恼${pillar.name}吗？`;
  const body = [
    hook,
    '',
    `${ctx.personalName || ''}教你一招 👆`,
    '',
    '你试过了吗？评论区告诉我 👇',
    '',
    '关注我，每天学一点品牌打造 💪',
  ].join('\n');

  return { body, hashtags: ['#个人品牌', '#成长', '#fyp', '#教程'] };
}

function generateXHSPost(ctx: BrandContext, pillar: ContentPillar): { body: string; hashtags: string[] } {
  const body = [
    `📌 ${pillar.emoji} 关于${pillar.name}你必须知道的3件事`,
    '',
    '1️⃣ 第一：从自己的故事开始，真实最有力量',
    '2️⃣ 第二：持续输出，不要断更',
    '3️⃣ 第三：先完成再完美',
    '',
    `${ctx.positioning ? `我是${ctx.personalName || ''}，${ctx.positioning}` : ''}`,
    '',
    '觉得有用记得 ❤️ + 收藏 ⭐',
  ].join('\n');

  return { body, hashtags: ['#个人品牌', '#内容创作', '#成长', '#学习', '#自我提升'] };
}

function generateThreadsPost(ctx: BrandContext, pillar: ContentPillar): { body: string; hashtags: string[] } {
  const body = [
    `关于${pillar.name}，我有一个不太主流的看法 🧵`,
    '',
    `${ctx.messaging.coreMessage || '做品牌，真实比专业重要。'}`,
    '',
    '同意吗？',
  ].join('\n');

  return { body, hashtags: [] };
}

function generateEmail(ctx: BrandContext, pillar: ContentPillar): { body: string; hashtags: string[] } {
  return {
    body: [
      `主题：${pillar.emoji} 关于${pillar.name}，这篇文章送给你`,
      '',
      `你好，`,
      '',
      `我是${ctx.personalName || '我'}。`,
      `分享一篇关于${pillar.name}的内容，希望能帮到你。`,
      '',
      `${pillar.description}`,
      '',
      `如果对你有用，回复我聊聊。`,
      '',
      `${ctx.personalName || ''}`,
    ].join('\n'),
    hashtags: [],
  };
}

function generateBlogOutline(ctx: BrandContext, pillar: ContentPillar): { body: string; hashtags: string[] } {
  return {
    body: [
      `SEO 标题：${pillar.emoji} ${pillar.name}完全指南 | ${ctx.personalName || '博主'}分享`,
      '',
      `大纲：`,
      `1. 引言：为什么${pillar.name}重要`,
      `2. 核心观点 1：${pillar.description}`,
      `3. 核心观点 2：常见误区和解决方法`,
      `4. 核心观点 3：案例分享`,
      `5. 总结 + CTA`,
      '',
      `关键词：${pillar.name}, 个人品牌, ${ctx.audience || '成长'}`,
    ].join('\n'),
    hashtags: [],
  };
}

const PLATFORM_GENERATORS: Record<Platform, (ctx: BrandContext, pillar: ContentPillar) => { body: string; hashtags: string[] }> = {
  facebook: generateFacebookPost,
  instagram: generateInstagramPost,
  tiktok: generateTikTokCaption,
  xhs: generateXHSPost,
  threads: generateThreadsPost,
  email: generateEmail,
  blog: generateBlogOutline,
};

export function generatePost(
  ctx: BrandContext,
  pillar: ContentPillar,
  platform: Platform,
  format: ContentFormat,
  funnelStage: FunnelStage,
): GeneratedPost {
  const gen = PLATFORM_GENERATORS[platform] ?? generateInstagramPost;
  const { body, hashtags } = gen(ctx, pillar);

  const hooks = [
    `你知道${ctx.audience || '很多人'}最大的困扰是什么吗？`,
    `我花了很长时间才明白...`,
    `${ctx.personalName || '我'}的故事从一次失败开始。`,
    `如果只能给${ctx.audience || '新手'}一个建议...`,
  ];

  return {
    id: `post-${Date.now()}`,
    pillar: pillar.name,
    pillarEmoji: pillar.emoji,
    title: `${pillar.emoji} ${pillar.name} - ${platform} 帖子`,
    hook: hooks[Math.floor(Math.random() * hooks.length)],
    body,
    cta: '💬 你怎么看？评论区告诉我 👇',
    hashtags,
    platform,
    format,
    funnelStage,
    status: 'generated',
    qualityScore: 75,
    createdAt: new Date().toISOString(),
  };
}
