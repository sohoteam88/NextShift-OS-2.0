// Lead Magnet Generators — all deterministic, powered by BrandContext
import type { BrandContext } from '@/modules/brand-dna/types';
import type { LeadMagnetType, LeadMagnetConfig, AssessmentQuestion, QuizQuestion, ChecklistItem, ScoreCategory, ResultPage, CTABlock, LeadSegment } from './types';
import { EMPTY_CTA } from './types';

let _id = 0; const uid = () => `${++_id}`;

// ---- CTA Generator ----
export function generateCTA(ctx: BrandContext): CTABlock {
  return {
    headline: ctx.offer.primary ? `获取专属${ctx.offer.primary}方案` : '获取专属行动计划',
    buttonText: ctx.offer.primary ? `了解${ctx.offer.primary}` : '立即获取',
    description: ctx.messaging.coreMessage || '填写信息获取定制化的下一步建议。',
    whatsappCta: `你好，我完成了评测，想了解更多关于${ctx.offer.primary || '你的服务'}的信息。`,
    funnelCta: ctx.offer.primary ? `查看${ctx.offer.primary}详情` : '查看完整方案',
  };
}

// ---- Assessment Builder ----
export function generateAssessment(ctx: BrandContext, audiencePain: string): LeadMagnetConfig {
  const title = `${ctx.brandName || '个人品牌'}准备度评估`;
  const questions: AssessmentQuestion[] = [
    { id: uid(), question: `你是否清楚自己想帮谁？(${ctx.audience || '目标受众'})`, options: [{ label: '非常清楚', value: 25 }, { label: '大概知道', value: 15 }, { label: '还不确定', value: 5 }] },
    { id: uid(), question: '你目前在社交媒体上有多少关注者？', options: [{ label: '1000+', value: 25 }, { label: '100-1000', value: 15 }, { label: '少于100', value: 5 }] },
    { id: uid(), question: '你多久发布一次内容？', options: [{ label: '每周3次以上', value: 25 }, { label: '偶尔发', value: 15 }, { label: '几乎不发', value: 5 }] },
    { id: uid(), question: `你有明确的${ctx.offer.primary || '服务产品'}吗？`, options: [{ label: '有，已经有人买单', value: 25 }, { label: '有方向但不确定', value: 15 }, { label: '还没有', value: 5 }] },
    { id: uid(), question: '你是否有一个系统来跟进潜在客户？', options: [{ label: '有CRM或跟进系统', value: 25 }, { label: '手动跟进', value: 15 }, { label: '没有跟进', value: 5 }] },
  ];

  const categories: ScoreCategory[] = [
    { range: [0, 40], label: '刚起步', description: '你正在建立基础，这是最好的起点。', segment: 'C', recommendation: '先完成品牌发现和定位，建立清晰的方向。' },
    { range: [41, 70], label: '需要明确方向', description: '你有一定基础但还缺少系统。', segment: 'B', recommendation: '重点建立内容系统和引流机制。' },
    { range: [71, 90], label: '准备就绪', description: '你已经有不错的基础，就差临门一脚。', segment: 'A', recommendation: '优化你的漏斗和跟进系统，准备放大。' },
    { range: [91, 100], label: '增长就绪', description: '系统完整，可以开始规模化。', segment: 'A', recommendation: '增加流量渠道，扩展团队。' },
  ];

  const cta = generateCTA(ctx);
  return buildConfig('assessment', title, `3分钟了解你在个人品牌建设上处于哪个阶段`, audiencePain, cta, categories, questions, undefined);
}

// ---- Quiz Builder ----
export function generateQuiz(ctx: BrandContext, audiencePain: string): LeadMagnetConfig {
  const title = `${ctx.brandName || '你'}适合哪种${ctx.offer.primary || '个人品牌'}模式？`;
  const questions: QuizQuestion[] = [
    { id: uid(), question: '你最喜欢用什么方式分享内容？', options: [{ label: '写文章', value: 10, segment: 'B' }, { label: '拍视频', value: 10, segment: 'A' }, { label: '录音频', value: 10, segment: 'C' }, { label: '做图片', value: 10, segment: 'D' }] },
    { id: uid(), question: '你的目标客户最常在哪里？', options: [{ label: 'Facebook', value: 10, segment: 'B' }, { label: 'Instagram', value: 10, segment: 'A' }, { label: 'TikTok', value: 10, segment: 'A' }, { label: '微信/小红书', value: 10, segment: 'C' }] },
    { id: uid(), question: `关于${audiencePain}，你最大的困扰是？`, options: [{ label: '不知道怎么做', value: 10, segment: 'C' }, { label: '做了但没效果', value: 10, segment: 'B' }, { label: '没时间做', value: 10, segment: 'D' }, { label: '想做得更好', value: 10, segment: 'A' }] },
  ];

  const categories: ScoreCategory[] = [
    { range: [0, 15], label: '内容型', description: '你适合通过持续内容输出建立品牌。', segment: 'B', recommendation: '重点做内容引擎和视频引擎。' },
    { range: [16, 30], label: '互动型', description: '你适合通过直播和互动建立信任。', segment: 'A', recommendation: '准备你的Webinar和直播内容。' },
  ];

  const cta = generateCTA(ctx);
  return buildConfig('quiz', title, `2分钟测出最适合你的${ctx.audience || '个人品牌'}模式`, audiencePain, cta, categories, questions, undefined);
}

// ---- Checklist Builder ----
export function generateChecklist(ctx: BrandContext, audiencePain: string): LeadMagnetConfig {
  const title = `${ctx.brandName || '个人品牌'}起号清单`;
  const items: ChecklistItem[] = [
    { id: uid(), text: '明确定位 — 我是谁、帮谁、怎么帮', completed: false },
    { id: uid(), text: '建立 Facebook Page — 填写完整资料', completed: false },
    { id: uid(), text: '建立 Instagram 账号 — 专业头像 + BIO', completed: false },
    { id: uid(), text: '发布第一篇内容 — 介绍你是谁、为什么做', completed: false },
    { id: uid(), text: '发布第一支视频 — 短视频脚本 + AI生成', completed: false },
    { id: uid(), text: '创建引流磁铁 — 免费资源吸引潜在客户', completed: false },
    { id: uid(), text: '设置 WhatsApp AI 跟进 — 自动回复询盘', completed: false },
    { id: uid(), text: 'CRM 设置 — 追踪每个潜在客户状态', completed: false },
  ];

  const cta = generateCTA(ctx);
  return buildConfig('checklist', title, '跟着清单一步步建立你的个人品牌系统', audiencePain, cta, [], undefined, items);
}

// ---- Result Page ----
function buildResultPage(ctx: BrandContext, categories: ScoreCategory[], cta: CTABlock): ResultPage {
  const topCat = categories[categories.length - 1];
  return {
    scoreLabel: `你的${ctx.brandName || '个人品牌'}准备度`,
    categoryLabel: topCat?.label || '准备中',
    explanation: topCat?.description || '继续努力，方向已经在。',
    recommendations: [topCat?.recommendation || '完成下一步任务。'],
    nextAction: topCat?.segment === 'A' ? '准备好预约策略咨询' : '完成品牌定位后继续',
    cta,
  };
}

function buildConfig(type: LeadMagnetType, title: string, promise: string, audiencePain: string, cta: CTABlock, categories: ScoreCategory[], questions?: AssessmentQuestion[] | QuizQuestion[], checklistItems?: ChecklistItem[]): LeadMagnetConfig {
  return {
    id: `lm-${Date.now()}`, type, title, promise, description: promise, audiencePain,
    questions, checklistItems, scoreCategories: categories,
    resultPage: buildResultPage({ audience: audiencePain } as BrandContext, categories, cta), cta,
    segmentation: { leadScore: 'B', nextAction: '完成评测分享结果', followUpStrategy: '根据结果发送定制化WhatsApp消息' },
    qualityScore: 75, status: 'generated', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}
