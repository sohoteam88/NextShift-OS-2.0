// Funnel Generators — deterministic, from BrandContext + Lead Magnet / Webinar contexts
import type { BrandContext } from '@/modules/brand-dna/types';
import type { FunnelType, FunnelPackage, LandingPage, ThankYouPage, WhatsAppFlow, EmailMessage, AdAngle, LaunchDay } from './types';
import { FUNNEL_TYPES } from './types';

export function generateLandingPage(ctx: BrandContext, funnelType: FunnelType, lmTitle?: string, webinarTitle?: string): LandingPage {
  const offer = lmTitle || webinarTitle || ctx.offer.primary || '免费资源';
  return {
    headline: ctx.offer.transformation || `在30天内建立你的${ctx.audience || '个人品牌'}系统`,
    subheadline: `即使你${ctx.audiencePainPoints?.[0] || '很忙'}，也能建立自动化的客户获取系统`,
    heroCta: FUNNEL_TYPES[funnelType].cta,
    problem: `你是否也这样？想做个人品牌但不知道从哪开始、没时间做内容、不知道怎么变现。`,
    solution: `${ctx.brandName || '我们'}的${FUNNEL_TYPES[funnelType].label}，帮你从0到1建立完整的获客系统。`,
    benefits: [`✅ ${ctx.messaging.coreMessage || '清晰的品牌定位'}`, `✅ AI辅助的自动化系统`, `✅ 从流量到成交的完整路径`, `✅ 适合${ctx.audience || '忙碌的在职人士'}`],
    credibility: ctx.personalName ? `${ctx.personalName}已经帮助多位${ctx.audience || '客户'}实现了${ctx.offer.transformation || '目标'}。` : '真实案例和数据支撑。',
    leadBlock: funnelType === 'webinar' ? `📅 免费讲座: ${webinarTitle || offer}` : `📥 免费下载: ${offer}`,
    faq: [{ q: '免费吗？', a: '是的，完全免费。' }, { q: `适合${ctx.audience || '谁'}？`, a: `适合想建立个人品牌的${ctx.audience || '在职人士'}。` }, { q: '需要什么基础？', a: '零基础也可以，系统会一步步引导你。' }],
    finalCta: `准备好了吗？点击下方按钮，${FUNNEL_TYPES[funnelType].action.split('→')[0]}`,
  };
}

export function generateThankYouPage(ctx: BrandContext): ThankYouPage {
  return {
    confirmation: `感谢你！${ctx.personalName || '我们'}已经收到了你的信息。`,
    nextStep: '下一步：点击下方 WhatsApp 链接，获取你的专属行动建议。',
    whatsappCta: `你好${ctx.personalName ? `，我是${ctx.personalName}` : ''}，我刚完成了注册，想了解更多信息。`,
    calendarPlaceholder: '或者预约一个15分钟的策略通话',
    expectation: '你会收到一封确认邮件，包含所有你需要的信息。',
    bonusReminder: '🎁 作为Bonus，你还会收到我们整理的《个人品牌起步指南》。',
  };
}

export function generateWhatsAppFlow(ctx: BrandContext): WhatsAppFlow {
  return {
    prefilledMessage: `你好，我对${ctx.offer.primary || '你的服务'}感兴趣。`,
    firstReply: `你好！感谢你的兴趣。我是${ctx.personalName || '团队'}。先问你几个问题了解你的情况：`,
    qualificationQuestions: [`你目前在做什么？`, `你最大的挑战是什么？`, `你希望在多长时间内看到结果？`],
    followUpFlow: `Day 0: 自动确认 → Day 1: 发送更多信息 → Day 2: 询问是否需要帮助 → Day 3: 案例分享 → Day 4: 预约提醒`,
    objectionHandling: [`"我还没准备好" → 没关系，可以先从免费内容开始了解`, `"太贵了" → 比起继续浪费时间，投资系统是值得的`, `"我需要想想" → 当然，有什么具体的问题我可以帮你解答？`],
    appointmentCta: `如果你准备好了，可以预约一个15分钟的策略通话，我们聊聊你的具体情况。`,
  };
}

export function generateEmailSequence(ctx: BrandContext): EmailMessage[] {
  return [
    { order: 1, type: 'delivery', subject: `这是你的${ctx.brandName || '免费资源'}`, preview: '点击查看', body: `你好！这是你申请的${ctx.brandName || '免费资源'}。\n\n${ctx.messaging.coreMessage || ''}`, cta: '立即查看' },
    { order: 2, type: 'story', subject: `${ctx.personalName || '我'}的故事`, preview: '从零开始的真实经历', body: `今天想跟你分享${ctx.personalName || '我'}的故事...`, cta: '了解更多' },
    { order: 3, type: 'education', subject: `关于${ctx.audience || '个人品牌'}你必须知道的3件事`, preview: '实用干货', body: `${ctx.positioning || ''}\n\n以下是3个最常被问到的问题...`, cta: '开始学习' },
    { order: 4, type: 'case_study', subject: '案例：如何在30天内实现第一笔成交', preview: '真实案例和数据', body: `分享一个学员的真实案例...`, cta: '看完整案例' },
    { order: 5, type: 'objection', subject: '"我没时间" — 这其实不是问题', preview: '常见疑虑解答', body: `很多人说没时间做${ctx.audience || '个人品牌'}...`, cta: '了解方法' },
    { order: 6, type: 'offer', subject: `${ctx.offer.primary || '专属优惠'} — 限时开放`, preview: '不要错过', body: `${ctx.offer.transformation || ''}\n\n限时开放${ctx.offer.primary || '专属优惠'}。`, cta: '立即查看' },
    { order: 7, type: 'last_call', subject: '⏰ 最后提醒', preview: '即将关闭', body: '这是最后的提醒...', cta: '最后机会' },
  ];
}

export function generateAdAngles(ctx: BrandContext): AdAngle[] {
  return [
    { platform: 'facebook', hook: `${ctx.audience || '在职人士'}注意：你的个人品牌可能少了这一步`, painPoint: ctx.audiencePainPoints?.[0] || '不知道从哪开始', promise: ctx.offer.transformation || '30天建立系统', creativeDirection: '对比图: 左=混乱，右=系统化', cta: '立即获取免费资源', funnelStage: 'awareness' },
    { platform: 'instagram', hook: `${ctx.personalName || ''}: 我用这个方法30天做到第一笔成交`, painPoint: '没时间做内容', promise: 'AI帮你做内容，每天只花15分钟', creativeDirection: '卷轴/Reel格式，展示AI工作流', cta: '点击链接获取', funnelStage: 'awareness' },
    { platform: 'tiktok', hook: `还在想怎么做个人品牌？看这个`, painPoint: '不知道怎么做', promise: '免费评测你的准备度', creativeDirection: '快节奏剪辑+文字叠层', cta: '点击主页链接', funnelStage: 'awareness' },
    { platform: 'xhs', hook: `📌 ${ctx.audience || '新人'}必看：个人品牌从0到1全流程`, painPoint: '没有方向', promise: '完整框架+模板+案例', creativeDirection: '高质量图文，步骤截图', cta: '收藏+关注获取', funnelStage: 'consideration' },
  ];
}

export function generateLaunchPlan(): LaunchDay[] {
  return [
    { day: 1, title: '最终确认着陆页', task: '检查所有文案、CTA和链接是否正常' },
    { day: 2, title: '准备感谢页', task: '确认感谢页的WhatsApp链接和预设消息' },
    { day: 3, title: '设置WhatsApp CTA', task: '测试WhatsApp预设消息和自动回复' },
    { day: 4, title: '检查邮件序列', task: '确认7封邮件的主题、内容和CTA' },
    { day: 5, title: '准备3个广告角度', task: '根据平台准备不同的Hook和素材方向' },
    { day: 6, title: '软启动', task: '先发给暖场受众（好友/已有粉丝），收集反馈' },
    { day: 7, title: '查看数据并优化', task: '分析前一天的转化数据，调整弱项' },
  ];
}

export function generateFullFunnel(ctx: BrandContext, funnelType: FunnelType, lmTitle?: string, webinarTitle?: string): FunnelPackage {
  const fi = FUNNEL_TYPES[funnelType];
  return {
    id: `funnel-${Date.now()}`, funnelType, title: fi.label,
    landingPage: generateLandingPage(ctx, funnelType, lmTitle, webinarTitle),
    thankYouPage: generateThankYouPage(ctx),
    whatsappFlow: generateWhatsAppFlow(ctx),
    emailSequence: generateEmailSequence(ctx),
    adAngles: generateAdAngles(ctx),
    launchPlan: generateLaunchPlan(),
    healthScore: 78, nextBestAction: '检查 Thank You Page 的 WhatsApp CTA',
    status: 'ready', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}
