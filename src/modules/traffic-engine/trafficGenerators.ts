// Traffic Generators — all deterministic, powered by BrandContext
import type { BrandContext } from '@/modules/brand-dna/types';
import type { TrafficGoal, TrafficPlatform, BudgetTier, FacebookCampaign, InstagramCampaign, TikTokCampaign, XhsCampaign, BudgetPlan, Campaign, LaunchChecklistItem, TrafficReadiness, TrafficPackage } from './types';
import { TRAFFIC_GOALS } from './types';

export function generateFacebookCampaign(ctx: BrandContext, goal: TrafficGoal, budget: BudgetTier): FacebookCampaign {
  const gi = TRAFFIC_GOALS[goal];
  return {
    campaignName: `${ctx.brandName || 'Brand'} - ${gi.objective}`,
    objective: gi.objective,
    audience: `${ctx.audience || '25-45在职人士'}，对个人品牌和副业收入感兴趣`,
    adAngles: [`痛点: ${ctx.audiencePainPoints?.[0] || '不知道从哪开始'}`, `故事: ${ctx.personalName || '我'}从零开始的经历`, `结果: ${ctx.offer.transformation || '30天建立系统'}`],
    creativeDirection: budget === 'starter' ? '简单图文+文字叠层' : budget === 'growth' ? '短视频+客户证言' : '专业拍摄+多版本A/B测试',
    headlines: [`${ctx.audience || '在职人士'}注意`, `${ctx.personalName || ''}: 我用了这个方法`, `免费${gi.recommendedCta}`],
    primaryText: `你是否也在想${ctx.audiencePainPoints?.[0] || '如何建立个人品牌'}？${ctx.personalName || '我'}花了很长时间才找到方法。现在你可以免费获取完整系统。${gi.recommendedCta} 👇`,
    cta: gi.recommendedCta,
    funnelPath: '广告 → 领取页 → 引流资源 → 客户跟进 → CRM',
    trafficType: 'cold',
  };
}

export function generateInstagramCampaign(ctx: BrandContext): InstagramCampaign {
  return {
    reelConcept: `${ctx.personalName || '我'}分享: ${ctx.offer.transformation || '如何建立个人品牌系统'}（15-30秒快节奏）`,
    storyConcept: '投票互动: "你最想解决什么？" + 链接滑动',
    carouselConcept: `${ctx.offer.primary || '个人品牌'}的5个步骤，每张卡片一个步骤+CTA`,
    headline: `${ctx.personalName || '我'}帮你建立${ctx.audience || '个人品牌'}系统`,
    cta: '点击链接获取免费资源',
    audience: `${ctx.audience || '25-40岁'}，关注个人成长和副业`,
  };
}

export function generateTikTokCampaign(ctx: BrandContext): TikTokCampaign {
  return {
    hook: `还在烦恼${ctx.audiencePainPoints?.[0] || '个人品牌'}？看这个`,
    openingScene: '直接看向镜头，手中拿手机展示工具',
    creatorAngle: `${ctx.personalName || '创业者'}的真实经历 — 不做作、有干货`,
    caption: `${ctx.personalName || ''}: ${ctx.offer.transformation || '30天从0到1'} 🔥 #个人品牌 #副业`,
    cta: '关注我，每天一个技巧 👆',
    retentionStrategy: 'Hook(0-3s) → 痛点(3-5s) → 方法(5-20s) → 结果(20-25s) → CTA(25-30s)',
  };
}

export function generateXhsCampaign(ctx: BrandContext): XhsCampaign {
  return {
    contentAngle: `${ctx.personalName || '博主'}: ${ctx.audience || '新人'}如何从0到1建立个人品牌`,
    educationalAngle: `${ctx.positioning || '个人品牌专家'}分享：${ctx.offer.transformation || '30天系统化方法'}（附模板）`,
    keywordDirection: `${ctx.audience || '个人品牌'}、副业、AI工具、内容创作、社交媒体`,
    titles: [`📌 ${ctx.audience || '新人'}必看：个人品牌从0到1全攻略`, `💡 ${ctx.personalName || '我'}的${ctx.offer.primary || '方法'}，30天见效`, `🔥 适合${ctx.audience || '忙碌人士'}的个人品牌系统`],
    ctaStrategy: '收藏+关注，评论区留言获取完整模板',
  };
}

export function generateBudgetPlan(budget: BudgetTier): BudgetPlan {
  const plans: Record<BudgetTier, BudgetPlan> = {
    starter: { tier: 'starter', dailyBudget: 'RM20-50/天', monthlyBudget: 'RM600-1,500/月', expectedLeads: '30-80 leads/月', riskLevel: 'low' },
    growth: { tier: 'growth', dailyBudget: 'RM50-150/天', monthlyBudget: 'RM1,500-4,500/月', expectedLeads: '100-300 leads/月', riskLevel: 'medium' },
    scale: { tier: 'scale', dailyBudget: 'RM150-500/天', monthlyBudget: 'RM4,500-15,000/月', expectedLeads: '300-1000+ leads/月', riskLevel: 'high' },
  };
  return plans[budget];
}

export function generateCampaign(ctx: BrandContext, goal: TrafficGoal, platform: TrafficPlatform, budget: BudgetTier): Campaign {
  const gi = TRAFFIC_GOALS[goal];
  return {
    name: `${ctx.brandName || 'Campaign'} - ${gi.objective}`,
    objective: goal, platform, audience: ctx.audience || '目标受众',
    creative: `${platform}广告素材 — ${budget === 'starter' ? '简单图文' : '短视频'}`,
    offer: ctx.offer.primary || '免费资源', cta: gi.recommendedCta,
    funnelDestination: '/funnel', trackingNotes: '使用UTM参数追踪来源',
    status: 'draft', budgetTier: budget, readinessScore: 0,
  };
}

export function generateLaunchChecklist(): LaunchChecklistItem[] {
  return [
    { id: 'funnel', label: '漏斗就绪', checked: false },
    { id: 'landing', label: '着陆页就绪', checked: false },
    { id: 'thankyou', label: '感谢页就绪', checked: false },
    { id: 'whatsapp', label: 'WhatsApp就绪', checked: false },
    { id: 'leadmagnet', label: '引流磁铁就绪', checked: false },
    { id: 'tracking', label: '追踪设置就绪', checked: false },
    { id: 'budget', label: '预算确认', checked: false },
    { id: 'creative', label: '创意素材就绪', checked: false },
    { id: 'cta', label: 'CTA测试通过', checked: false },
  ];
}

export function calculateReadiness(funnelExists: boolean, lmExists: boolean, contentCount: number): TrafficReadiness {
  let funnelReady = funnelExists ? 80 : 0;
  let landingPageReady = funnelExists ? 75 : 0;
  let thankYouReady = funnelExists ? 70 : 0;
  let ctaReady = funnelExists ? 70 : 0;
  let whatsappReady = funnelExists ? 60 : 0;
  let leadMagnetReady = lmExists ? 80 : 0;
  let contentAssetsReady = contentCount >= 5 ? 80 : contentCount >= 2 ? 50 : 10;
  let trackingReady = 30;
  const missing: string[] = []; const recs: string[] = [];
  if (!funnelExists) { missing.push('funnel'); recs.push('先完成漏斗页面。'); }
  if (!lmExists) { missing.push('lead_magnet'); recs.push('先完成引流资源。'); }
  if (contentCount < 5) { recs.push('至少准备5支短视频再启动广告。'); }
  if (contentCount < 2) { recs.push('建议先做内容积累再投广告。'); }
  const score = Math.round(funnelReady*0.25+landingPageReady*0.1+thankYouReady*0.05+ctaReady*0.15+whatsappReady*0.1+leadMagnetReady*0.2+contentAssetsReady*0.1+trackingReady*0.05);
  return { score, level: score>=80?'high':score>=50?'medium':'low', funnelReady, landingPageReady, thankYouReady, ctaReady, whatsappReady, leadMagnetReady, contentAssetsReady, trackingReady, missingItems: missing, recommendations: recs.slice(0,4) };
}

export function generateTrafficPackage(ctx: BrandContext, goal: TrafficGoal, platform: TrafficPlatform, budget: BudgetTier, funnelExists: boolean, lmExists: boolean, contentCount: number): TrafficPackage {
  return {
    goal,
    readiness: calculateReadiness(funnelExists, lmExists, contentCount),
    facebook: platform === 'facebook' ? generateFacebookCampaign(ctx, goal, budget) : undefined,
    instagram: platform === 'instagram' ? generateInstagramCampaign(ctx) : undefined,
    tiktok: platform === 'tiktok' ? generateTikTokCampaign(ctx) : undefined,
    xhs: platform === 'xhs' ? generateXhsCampaign(ctx) : undefined,
    budget: generateBudgetPlan(budget),
    campaign: generateCampaign(ctx, goal, platform, budget),
    checklist: generateLaunchChecklist(),
    analyticsConfig: { impressions: '曝光量', reach: '覆盖人数', ctr: '点击率', cpc: '每次点击成本', cpl: '每个Lead成本', leads: 'Lead数', conversations: '对话数', sales: '成交数' },
    status: 'draft', createdAt: new Date().toISOString(),
  };
}
