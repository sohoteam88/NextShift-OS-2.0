// Webinar Generators — all deterministic, from BrandContext
import type { BrandContext } from '@/modules/brand-dna/types';
import type { WebinarPackage, WebinarStrategy, WebinarTopic, WebinarOutline, SlideOutline, RegistrationPage, ReplayPage, FollowupMessage } from './types';
import { randomUUID } from 'node:crypto';

export function generateStrategy(ctx: BrandContext): WebinarStrategy {
  return {
    targetAudience: ctx.audience || '希望建立个人品牌行动节奏的人',
    desiredOutcome: ctx.offer.transformation || '掌握一套简单的AI辅助商业系统',
    trustBuildingAngle: ctx.personalName ? `${ctx.personalName}的亲身经历和转变故事` : '真实案例和数据',
    authorityPositioning: ctx.positioning || '个人品牌与AI系统专家',
    conversionObjective: `预约${ctx.offer.primary || '策略咨询'}`,
  };
}

export function generateTopic(ctx: BrandContext): WebinarTopic {
  return {
    title: `${ctx.personalName || ctx.brandName || 'NextShift'}：用 AI 建立个人品牌行动系统`,
    promise: `即使你${ctx.audiencePainPoints?.[0] || '很忙'}，也能建立自动运转的客户获取系统`,
    subtitle: `${ctx.messaging.coreMessage || '不需要辞职，不需要大预算，只需要一套系统。'}`,
  };
}

export function generateOutline(ctx: BrandContext, topic: WebinarTopic): WebinarOutline {
  return {
    opening: `欢迎！今天我会分享如何在30天内建立一套AI辅助的${ctx.audience || '个人品牌'}系统。`,
    story: `我是${ctx.personalName || '[你的名字]'}。${ctx.positioning || '我做这件事的原因是...'} 今天我要分享我如何从零开始。`,
    problem: `大多数${ctx.audience || '人'}的问题是：想建立个人品牌但不知道从哪开始、没时间做内容、不知道如何变现。`,
    opportunity: `AI改变了游戏规则。现在你可以用AI写内容、做视频、跟进客户——把原来需要团队的事情，一个人搞定。`,
    framework: `${ctx.brandName || '我'}的3步框架：1. Brand DNA（明确定位）→ 2. Content Engine（自动内容）→ 3. Funnel（自动成交）`,
    caseStudy: '案例：一位学员用这套方法整理内容与跟进节奏，并持续完成每周行动。',
    offer: `如果你想更快实现，我提供${ctx.offer.primary || '1对1策略咨询'}。${ctx.offer.transformation || ''}`,
    qa: '现在可以提问。常见问题：需要什么准备？适合什么阶段？如何开始？',
    cta: `点击下方链接预约${ctx.offer.primary || '免费策略咨询'}，名额有限。`,
    recommendedDuration: '45分钟',
  };
}

export function generateLoomScript(outline: WebinarOutline, ctx: BrandContext): string {
  return [
    `【开场 0-5分钟】${outline.opening}\n→ 说话要点：微笑、自信、介绍自己和今天的承诺`,
    `【故事 5-10分钟】${outline.story}\n→ 说话要点：真实、有细节、有情绪起伏`,
    `【问题 10-15分钟】${outline.problem}\n→ 说话要点：让观众点头、举例、互动提问："你是不是也这样？"`,
    `【机会 15-20分钟】${outline.opportunity}\n→ 说话要点：展示可能性、引用趋势、给出数据`,
    `【框架 20-30分钟】${outline.framework}\n→ 说话要点：每一步讲清楚、展示工具截图、给具体方法`,
    `【案例 30-35分钟】${outline.caseStudy}\n→ 说话要点：具体数字、前后对比、真实感受`,
    `【Offer 35-40分钟】${outline.offer}\n→ 说话要点：清楚说明价值、限定名额/时间、强调转变`,
    `【Q&A 40-43分钟】${outline.qa}\n→ 说话要点：回答3-5个预设问题`,
    `【CTA 43-45分钟】${outline.cta}\n→ 说话要点：明确指令、倒计时、重复链接`,
  ].join('\n\n');
}

export function generateSlideOutline(): SlideOutline[] {
  return [
    { slideNumber: 1, title: '欢迎', objective: '建立第一印象', keyMessage: '今天你会学到如何在30天内建立AI品牌系统', suggestedVisual: '品牌Logo + 标题' },
    { slideNumber: 2, title: '我的故事', objective: '建立信任', keyMessage: '从零开始的真实经历', suggestedVisual: '前后对比照片' },
    { slideNumber: 3, title: '问题', objective: '共鸣痛点', keyMessage: '大多数人的三大困扰', suggestedVisual: '数据图表/痛点列表' },
    { slideNumber: 4, title: '机会', objective: '展示可能性', keyMessage: 'AI如何改变规则', suggestedVisual: '趋势图/对比表' },
    { slideNumber: 5, title: '框架', objective: '展示方法论', keyMessage: '3步系统的每一步', suggestedVisual: '流程图/步骤图' },
    { slideNumber: 6, title: '案例', objective: '提供证据', keyMessage: '真实案例和结果', suggestedVisual: '案例截图/对比' },
    { slideNumber: 7, title: 'Offer', objective: '转化', keyMessage: '限时专属优惠', suggestedVisual: '价格对比/包含内容' },
    { slideNumber: 8, title: 'CTA', objective: '行动', keyMessage: '立即点击链接', suggestedVisual: '大按钮/二维码' },
  ];
}

export function generateRegistrationPage(ctx: BrandContext, topic: WebinarTopic): RegistrationPage {
  return {
    headline: topic.title,
    subheadline: topic.promise,
    bulletPoints: [`✅ ${ctx.offer.transformation || '清晰的个人品牌方向'}`, '✅ AI辅助内容系统', '✅ 30天行动计划', '✅ 限时专属优惠'],
    benefits: [ctx.messaging.coreMessage || '建立自动运转的客户系统', `适合忙碌的${ctx.audience || '在职人士'}`],
    cta: '立即注册 · 免费',
    urgency: '名额有限，仅开放50个席位',
    faq: [{ q: '什么时候？', a: '注册后收到具体时间和链接' }, { q: '免费吗？', a: '是的，完全免费。' }, { q: '适合谁？', a: `适合想建立个人品牌的${ctx.audience || '在职人士'}` }],
  };
}

export function generateReplayPage(ctx: BrandContext, topic: WebinarTopic, outline: WebinarOutline): ReplayPage {
  return {
    headline: `回放: ${topic.title}`,
    summary: `在这场${outline.recommendedDuration}的讲座中，${ctx.personalName || '主讲人'}分享了${ctx.brandName || '品牌'}的完整方法和真实案例。`,
    cta: `看完还想了解更多？预约${ctx.offer.primary || '策略咨询'}`,
    deadline: '回放链接48小时后失效',
  };
}

export function generateFollowupSequence(ctx: BrandContext): FollowupMessage[] {
  return [
    { day: 0, label: '注册确认', message: `感谢注册${ctx.brandName || '我'}的Webinar！讲座链接稍后发送。先想想：你最大的挑战是什么？` },
    { day: 1, label: '提醒', message: `明天就是${ctx.brandName || '我'}的Webinar了！准备好纸笔，内容很干货。` },
    { day: 2, label: '回放提醒', message: `错过了直播？没关系，这里有回放链接。看完回复我，聊聊你的想法。` },
    { day: 3, label: '案例分享', message: '分享一个学员案例：她用这套方法建立了更稳定的内容与行动节奏。想看完整故事吗？' },
    { day: 4, label: 'Offer介绍', message: `很多人问${ctx.offer.primary || '这个服务'}包含什么？我整理了详细方案，发给你看看？` },
    { day: 5, label: '紧迫感', message: `提醒一下：${ctx.offer.primary || '专属优惠'}还剩24小时。如果还在考虑，有什么问题我可以解答？` },
    { day: 6, label: '最后机会', message: `最后一天！${ctx.offer.primary || '优惠'}即将结束。决定好了吗？` },
  ];
}

export function generateFullWebinar(ctx: BrandContext): WebinarPackage {
  const strategy = generateStrategy(ctx);
  const topic = generateTopic(ctx);
  const outline = generateOutline(ctx, topic);
  const now = new Date().toISOString();
  return {
    id: `webinar-${randomUUID()}`, createdAt: now, updatedAt: now,
    strategy, topic, outline,
    loomScript: generateLoomScript(outline, ctx),
    slideOutline: generateSlideOutline(),
    registrationPage: generateRegistrationPage(ctx, topic),
    replayPage: generateReplayPage(ctx, topic, outline),
    followupSequence: generateFollowupSequence(ctx),
    qualityScore: 80, status: 'generated',
  };
}
