// Funnel Generators — deterministic, from BrandContext + Lead Magnet / Webinar contexts
import type { BrandContext } from '@/modules/brand-dna/types';
import type { FunnelBuilderType, FunnelPackage, FunnelTrack, LandingPage, ThankYouPage, WhatsAppFlow, EmailMessage, AdAngle, LaunchDay } from '../types/funnel-builder';
import { FUNNEL_TYPES } from '../types/funnel-builder';

function trackLabel(track: FunnelTrack) {
  return track === 'recruitment' ? '招募伙伴' : '零售客户';
}

export function generateLandingPage(ctx: BrandContext, funnelType: FunnelBuilderType, lmTitle?: string, webinarTitle?: string, track: FunnelTrack = 'retail'): LandingPage {
  const offer = lmTitle || webinarTitle || ctx.offer.primary || '免费资源';
  const retail = track === 'retail';
  return {
    headline: retail
      ? (ctx.offer.transformation || `找到适合你的${ctx.offer.primary || '产品'}方案`)
      : `了解如何跟着${ctx.personalName || ctx.brandName || '我们'}建立一份可复制的副业系统`,
    subheadline: retail
      ? `即使你${ctx.audiencePainPoints?.[0] || '不知道从哪里开始'}，也能先获得清晰建议和下一步行动。`
      : '适合想增加收入、学习线上获客、并加入团队一起成长的人。',
    heroCta: retail ? '领取客户建议' : '了解加入机会',
    problem: retail
      ? `你是否也这样？${ctx.audiencePainPoints?.[0] || '想改善现状，但不知道该选择什么方案，也担心买错。'}`
      : '你是否也想多一份收入或转型线上，但不知道怎么开始、怕没人带、也不确定自己适不适合？',
    solution: retail
      ? `${ctx.brandName || '我们'}会根据你的情况，给你一个清晰的产品/服务建议和后续跟进。`
      : `${ctx.personalName || ctx.brandName || '我们'}的团队系统会带你理解机会、学习内容获客，并一步步建立自己的客户来源。`,
    benefits: retail
      ? [`✅ ${ctx.messaging.coreMessage || '根据你的情况给出建议'}`, '✅ 先了解问题，再推荐方案', '✅ 有 WhatsApp 后续跟进，不需要自己摸索', `✅ 适合${ctx.audience || '想改善现状的人'}`]
      : ['✅ 了解这份事业机会是否适合你', '✅ 学习如何用内容和漏斗获得客户', '✅ 有团队跟进和复制系统', '✅ 适合想增加收入、愿意学习和行动的人'],
    credibility: ctx.personalName ? `${ctx.personalName}会用真实经验带你理解${trackLabel(track)}路径，而不是只给你一套空泛说法。` : '真实经验和系统流程支撑。',
    leadBlock: retail ? `📥 免费领取: ${offer}` : '📥 免费领取: 副业/团队机会说明',
    faq: retail
      ? [{ q: '免费吗？', a: '是的，先领取建议和资料。' }, { q: `适合${ctx.audience || '谁'}？`, a: `适合${ctx.audience || '想先了解方案的人'}。` }, { q: '我需要马上购买吗？', a: '不需要，先了解是否适合你。' }]
      : [{ q: '需要经验吗？', a: '不需要，适合愿意学习和行动的新手。' }, { q: '一定要加入吗？', a: '不用，先了解模式和要求，再决定是否适合。' }, { q: '会有人带吗？', a: '会，重点是跟着团队系统一步步执行。' }],
    finalCta: `准备好了吗？点击下方按钮，${FUNNEL_TYPES[funnelType].action.split('→')[0]}`,
  };
}

export function generateThankYouPage(ctx: BrandContext, track: FunnelTrack = 'retail'): ThankYouPage {
  return {
    confirmation: `感谢你！${ctx.personalName || '我们'}已经收到了你的信息。`,
    nextStep: track === 'retail' ? '下一步：我们会了解你的情况，并给你适合的建议。' : '下一步：我们会先了解你的目标，再说明团队机会和启动方式。',
    whatsappCta: track === 'retail'
      ? `你好${ctx.personalName ? `，我是${ctx.personalName}` : ''}，我想领取客户建议。`
      : `你好${ctx.personalName ? `，我是${ctx.personalName}` : ''}，我想了解加入团队/副业机会。`,
    calendarPlaceholder: '或者预约一个15分钟的策略通话',
    expectation: '你会收到一封确认邮件，包含所有你需要的信息。',
    bonusReminder: track === 'retail' ? '🎁 你也会收到后续实用建议。' : '🎁 你也会收到团队启动路线说明。',
  };
}

export function generateWhatsAppFlow(ctx: BrandContext, track: FunnelTrack = 'retail'): WhatsAppFlow {
  return {
    prefilledMessage: track === 'retail' ? `你好，我对${ctx.offer.primary || '你的服务'}感兴趣。` : '你好，我想了解加入团队/副业机会。',
    firstReply: `你好！感谢你的兴趣。我是${ctx.personalName || '团队'}。先问你几个问题了解你的情况：`,
    qualificationQuestions: track === 'retail'
      ? ['你目前最想改善的问题是什么？', '你之前尝试过什么方法？', '你希望多久看到改变？']
      : ['你现在的工作/收入状态是怎样？', '你想增加收入的主要原因是什么？', '你愿意每周投入多少时间学习和行动？'],
    followUpFlow: `Day 0: 自动确认 → Day 1: 发送更多信息 → Day 2: 询问是否需要帮助 → Day 3: 案例分享 → Day 4: 预约提醒`,
    objectionHandling: [`"我还没准备好" → 没关系，可以先从免费内容开始了解`, `"太贵了" → 比起继续浪费时间，投资系统是值得的`, `"我需要想想" → 当然，有什么具体的问题我可以帮你解答？`],
    appointmentCta: `如果你准备好了，可以预约一个15分钟的策略通话，我们聊聊你的具体情况。`,
  };
}

export function generateEmailSequence(ctx: BrandContext, track: FunnelTrack = 'retail'): EmailMessage[] {
  if (track === 'recruitment') {
    return [
      { order: 1, type: 'delivery', subject: '这是你的副业/团队机会说明', preview: '先了解模式，再决定是否适合', body: `你好！这是你申请的机会说明。\n\n${ctx.messaging.coreMessage || ''}`, cta: '立即查看' },
      { order: 2, type: 'story', subject: `${ctx.personalName || '我'}为什么开始做这件事`, preview: '从现实压力到寻找第二曲线', body: `今天想分享${ctx.personalName || '我'}为什么开始...`, cta: '了解更多' },
      { order: 3, type: 'education', subject: '普通人做副业最容易卡住的3件事', preview: '先避开错误起步方式', body: '很多人不是不努力，而是没有系统...', cta: '开始学习' },
      { order: 4, type: 'case_study', subject: '案例：从不会线上获客到有第一批咨询', preview: '真实启动路径', body: '分享一个团队伙伴的启动路径...', cta: '看完整案例' },
      { order: 5, type: 'objection', subject: '"我没经验" — 其实可以从这里开始', preview: '常见疑虑解答', body: '经验不是门槛，愿意学习和执行才是...', cta: '了解方法' },
      { order: 6, type: 'offer', subject: '下一步：了解团队启动方式', preview: '看看是否适合你', body: '如果你想认真了解，我们可以聊聊你的情况...', cta: '预约了解' },
      { order: 7, type: 'last_call', subject: '最后提醒：先了解，再决定', preview: '不需要马上承诺', body: '这是最后提醒，你可以先了解是否适合...', cta: '最后机会' },
    ];
  }
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

export function generateAdAngles(ctx: BrandContext, track: FunnelTrack = 'retail'): AdAngle[] {
  if (track === 'recruitment') {
    return [
      { platform: 'facebook', hook: '想多一份收入，但不知道从哪里开始？', painPoint: '没有方向和系统', promise: '了解可复制的团队启动路径', creativeDirection: '故事帖: 现实压力 → 发现机会 → 被系统带着走', cta: '了解加入机会', funnelStage: 'awareness' },
      { platform: 'instagram', hook: `${ctx.personalName || '我'}: 普通人也能学习线上获客`, painPoint: '怕不会卖、怕没人带', promise: '团队系统一步步教', creativeDirection: 'Reel: 一天学习/执行片段', cta: '点击了解', funnelStage: 'awareness' },
      { platform: 'tiktok', hook: '副业不是乱做，先看你适不适合', painPoint: '怕踩坑', promise: '3分钟判断启动方向', creativeDirection: '快节奏 Q&A + 真实日常', cta: '留言了解', funnelStage: 'consideration' },
      { platform: 'xhs', hook: '📌 新手副业避坑：先找系统，不要只找产品', painPoint: '没有复制流程', promise: '团队带练 + 内容获客', creativeDirection: '图文笔记: 步骤/清单/误区', cta: '私信了解', funnelStage: 'consideration' },
    ];
  }
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

export function generateFullFunnel(ctx: BrandContext, funnelType: FunnelBuilderType, lmTitle?: string, webinarTitle?: string, track: FunnelTrack = 'retail'): FunnelPackage {
  const fi = FUNNEL_TYPES[funnelType];
  return {
    id: `funnel-${track}-${Date.now()}`, funnelType, track, title: `${trackLabel(track)} - ${fi.label}`,
    landingPage: generateLandingPage(ctx, funnelType, lmTitle, webinarTitle, track),
    thankYouPage: generateThankYouPage(ctx, track),
    whatsappFlow: generateWhatsAppFlow(ctx, track),
    emailSequence: generateEmailSequence(ctx, track),
    adAngles: generateAdAngles(ctx, track),
    launchPlan: generateLaunchPlan(),
    healthScore: 78, nextBestAction: '检查 Thank You Page 的 WhatsApp CTA',
    status: 'ready', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}
