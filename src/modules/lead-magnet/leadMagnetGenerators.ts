// Lead Magnet Generators — deterministic creation flow powered by BrandContext.
import type { BrandContext } from '@/modules/brand-dna/types';
import type {
  CTABlock,
  ChecklistItem,
  LeadMagnetAuthorityContext,
  LeadMagnetConfig,
  LeadMagnetLandingPage,
  LeadMagnetSection,
  LeadMagnetType,
} from './types';

let idCounter = 0;
const uid = () => `${++idCounter}`;

function firstNonEmpty(...values: Array<string | undefined | null>) {
  return values.find((value) => value && value.trim().length > 0)?.trim() ?? '';
}

function getAudience(ctx: BrandContext) {
  return firstNonEmpty(ctx.audience, '想要开始建立个人品牌的人');
}

function getAudiencePain(ctx: BrandContext) {
  return firstNonEmpty(
    ctx.audiencePainPoints[0],
    ctx.messaging.coreMessage,
    '知道自己需要行动，但不确定第一步应该怎么做',
  );
}

function getOffer(ctx: BrandContext) {
  return firstNonEmpty(ctx.offer.primary, '一套清晰的行动方案');
}

function getPromise(ctx: BrandContext) {
  return firstNonEmpty(
    ctx.offer.transformation,
    ctx.positioning,
    `帮助${getAudience(ctx)}从混乱变成有清晰下一步`,
  );
}

function getBrandName(ctx: BrandContext) {
  return firstNonEmpty(ctx.brandName, ctx.personalName, 'NextShift');
}

export function buildAuthorityContext(ctx: BrandContext): LeadMagnetAuthorityContext {
  return {
    sources: ['interview_authority', 'brand_dna', 'business_state'],
    brandName: getBrandName(ctx),
    audience: getAudience(ctx),
    audiencePain: getAudiencePain(ctx),
    offer: getOffer(ctx),
    promise: getPromise(ctx),
  };
}

export function generateCTA(ctx: BrandContext): CTABlock {
  const offer = getOffer(ctx);
  return {
    headline: `领取你的${offer}行动资源`,
    buttonText: '免费领取资源',
    description: '留下联系方式，系统会把资源和下一步行动发送给你。',
    whatsappCta: `你好，我想领取「${offer}」相关资源，并了解下一步怎么开始。`,
    funnelCta: '打开领取页面',
  };
}

function buildLandingPage(ctx: BrandContext, title: string, promise: string, type: LeadMagnetType): LeadMagnetLandingPage {
  const audience = getAudience(ctx);
  const pain = getAudiencePain(ctx);
  const offer = getOffer(ctx);
  const mechanism = firstNonEmpty(
    ctx.messaging.uniqueAngle,
    ctx.messaging.elevatorPitch,
    `用一个简单资源先帮${audience}厘清问题、看到路径，再决定下一步行动。`,
  );
  const benefitBullets = [
    `看清${pain}背后的真正卡点`,
    `用${type === 'template' ? '可直接套用的模板' : type === 'checklist' ? '逐步清单' : '简明指南'}整理下一步`,
    `知道什么时候应该进一步了解${offer}`,
  ];

  return {
    headline: title,
    subheadline: promise,
    painBullets: ctx.audiencePainPoints.length > 0 ? ctx.audiencePainPoints.slice(0, 3) : [pain],
    mechanism,
    benefitBullets,
    formTitle: '免费领取这份资源',
    ctaText: '免费领取',
  };
}

function baseConfig(ctx: BrandContext, type: LeadMagnetType, title: string, promise: string): Omit<LeadMagnetConfig, 'sections' | 'checklistItems'> {
  const cta = generateCTA(ctx);
  const authorityContext = buildAuthorityContext(ctx);
  return {
    id: `lm-${Date.now()}`,
    type,
    title,
    promise,
    description: promise,
    audiencePain: authorityContext.audiencePain,
    authorityContext,
    landingPage: buildLandingPage(ctx, title, promise, type),
    resultPage: {
      scoreLabel: '你的下一步',
      categoryLabel: '资源已准备好',
      explanation: promise,
      recommendations: ['下载资源', '完成第一步', '需要帮助时通过 WhatsApp 联系'],
      nextAction: '领取资源后执行第一步',
      cta,
    },
    cta,
    segmentation: {
      leadScore: 'B',
      nextAction: '领取资源并进入 WhatsApp 跟进',
      followUpStrategy: '发送资源后，用品牌定位和受众痛点引导用户回复当前卡点。',
    },
    qualityScore: 75,
    status: 'generated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function generateGuide(ctx: BrandContext): LeadMagnetConfig {
  const audience = getAudience(ctx);
  const title = `${getBrandName(ctx)}给${audience}的启动指南`;
  const promise = `用 10 分钟看清当前卡点，并知道下一步怎么开始${getOffer(ctx)}。`;
  const sections: LeadMagnetSection[] = [
    {
      id: uid(),
      title: '你现在真正卡住的地方',
      body: getAudiencePain(ctx),
      bullets: ctx.audiencePainPoints.slice(0, 3),
    },
    {
      id: uid(),
      title: '为什么过去的方法没有持续',
      body: firstNonEmpty(ctx.messaging.coreMessage, '不是你不努力，而是缺少一个能重复执行的清晰路径。'),
      bullets: ['方向不够具体', '行动太零散', '没有后续跟进系统'],
    },
    {
      id: uid(),
      title: '下一步行动',
      body: getPromise(ctx),
      bullets: ['完成一个最小行动', '记录结果', '需要帮助时回复 WhatsApp'],
    },
  ];

  return { ...baseConfig(ctx, 'guide', title, promise), sections };
}

export function generateChecklist(ctx: BrandContext): LeadMagnetConfig {
  const title = `${getBrandName(ctx)}行动清单`;
  const promise = `跟着清单完成第一轮行动，不需要重新整理资料。`;
  const checklistItems: ChecklistItem[] = [
    { id: uid(), text: `确认目标受众：${getAudience(ctx)}`, completed: false },
    { id: uid(), text: `写下主要痛点：${getAudiencePain(ctx)}`, completed: false },
    { id: uid(), text: `选择一个最容易开始的行动`, completed: false },
    { id: uid(), text: `准备一句清楚的介绍：${firstNonEmpty(ctx.positioning, ctx.messaging.elevatorPitch, getPromise(ctx))}`, completed: false },
    { id: uid(), text: `通过 WhatsApp 询问下一步`, completed: false },
  ];

  return { ...baseConfig(ctx, 'checklist', title, promise), checklistItems };
}

export function generateTemplate(ctx: BrandContext): LeadMagnetConfig {
  const title = `${getBrandName(ctx)}快速启动模板`;
  const promise = `直接套用这份模板，把想法整理成可以发送、发布或跟进的内容。`;
  const sections: LeadMagnetSection[] = [
    {
      id: uid(),
      title: '一句话定位模板',
      body: `我帮助 ${getAudience(ctx)} 解决「${getAudiencePain(ctx)}」，通过 ${getOffer(ctx)} 达到「${getPromise(ctx)}」。`,
      bullets: ['我帮助谁', '解决什么问题', '用什么方法', '得到什么结果'],
    },
    {
      id: uid(),
      title: '首条内容模板',
      body: `如果你也遇到「${getAudiencePain(ctx)}」，先不要急着做更多。第一步是看清楚自己现在卡在哪里。`,
      bullets: ['痛点开场', '简单解释', '给一个可执行动作', '邀请私聊'],
    },
    {
      id: uid(),
      title: 'WhatsApp 跟进模板',
      body: generateCTA(ctx).whatsappCta,
      bullets: ['确认对方目标', '问当前卡点', '给一个简单建议', '邀请下一步'],
    },
  ];

  return { ...baseConfig(ctx, 'template', title, promise), sections };
}

export function generateLeadMagnet(ctx: BrandContext, type: LeadMagnetType): LeadMagnetConfig {
  switch (type) {
    case 'guide':
      return generateGuide(ctx);
    case 'checklist':
      return generateChecklist(ctx);
    case 'template':
      return generateTemplate(ctx);
    case 'assessment':
    case 'quiz':
      return generateGuide(ctx);
    default:
      return generateGuide(ctx);
  }
}
