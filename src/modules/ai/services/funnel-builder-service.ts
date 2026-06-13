import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getRouterForTenant } from '../router';
import { validateAIOutput } from '../prompt/validator';
import { logAIUsage } from '../usage/tracker';
import { enforceQuota } from '../usage/quota';
import type { AIGenerateResult } from '../providers/types';
import type { RoutingDecision } from '../router';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import type { FunnelConfig } from '@/modules/funnel/types';
import type { StrategyContext } from '@/modules/funnel/types/strategy-context';
import { qualityGateService, type QualityGateSummary } from '@/modules/funnel/services/quality-gate-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export interface FunnelBuilderInput {
  businessType: string;
  productOrService: string;
  targetAudience: string;
  marketLocation: string;
  language: 'zh' | 'en' | 'ms';
  mainCustomerPain: string;
  desiredResult: string;
  offerPrice?: string;
  funnelGoal: string;
  trafficSource?: string;
  closingMethod: string;
  brandTone?: string;
  strategyContext?: StrategyContext;
}

export interface FunnelBuilderOutput {
  funnelSummary: {
    funnelType: string;
    reason: string;
    primaryGoal: string;
    closingChannel: string;
  };
  customerAvatar: {
    name: string;
    ageRange: string;
    gender: string;
    location: string;
    currentSituation: string;
    mainPain: string;
    hiddenFear: string;
    desiredOutcome: string;
    biggestObjection: string;
    buyingTrigger: string;
    emotionalHook: string;
    logicalHook: string;
    bestPlatform: string;
    bestCta: string;
  };
  painDesireMap: {
    surfacePain: string;
    deepPain: string;
    dailyFrustration: string;
    emotionalCost: string;
    financialCost: string;
    socialCost: string;
    dreamOutcome: string;
    fastWin: string;
    longTermTransformation: string;
  };
  offerPositioning: {
    formula: string;
    whatIsIt: string;
    whoIsItFor: string;
    problemSolved: string;
    resultPromised: string;
    whyDifferent: string;
    whyNow: string;
  };
  landingPage: {
    hero: { headline: string; subheadline: string; ctaButton: string; trustLine: string; visualDirection: string };
    problem: { mainProblem: string; painBullets: string[]; mistakes: string[]; emotionalFrustration: string };
    desire: { dreamOutcome: string; before: string; after: string; newPossibility: string };
    solution: { systemName: string; uniqueMechanism: string; howItWorks: string[]; whyItWorks: string };
    leadMagnet: { name: string; whatTheyGet: string[]; whyValuable: string; cta: string };
    faq: { question: string; answer: string }[];
    finalCta: { headline: string; urgencyLine: string; ctaButton: string; whatsappMessage: string };
  };
  leadMagnets: { title: string; format: string; targetAudience: string; problemSolved: string; cta: string }[];
  whatsappSystem: {
    welcomeMessage: string;
    qualificationQuestions: string[];
    leadScoring: { a: string; b: string; c: string; d: string };
    followUpSequence: { day: number; message: string }[];
  };
  emailSequence: { email: number; subject: string; preview: string; body: string; cta: string }[];
  adAngles: { type: string; angle: string }[];
  videoHooks: string[];
  objectionHandling: { objection: string; realMeaning: string; response: string; softCta: string }[];
  analyticsTrackingPlan: {
    metrics: string[];
    benchmarks: { optInRate: string; whatsappClickRate: string; replyRate: string; appointmentRate: string; closeRate: string };
  };
  optimizationChecklist: string[];
}

const LANGUAGE_MAP = { zh: 'Chinese', en: 'English', ms: 'Bahasa Malaysia' };

const SYSTEM_PROMPT = `You are a world-class funnel strategist, direct response copywriter, offer architect, and WhatsApp conversion expert specializing in the Malaysian market.

Your task: convert business information into a complete high-converting funnel system.

Rules:
- No income guarantees or specific earnings claims
- No fake medical claims or cure promises
- No manipulative scarcity or false urgency
- Use specific, relatable, local market language
- Be practical and implementation-ready
- Return ONLY valid JSON, no other text`;

const JSON_REPAIR_PROMPT = `You are a JSON repair engine.

Rules:
- Return ONLY valid JSON.
- Do not add markdown, comments, explanations, or code fences.
- Preserve the provided content as much as possible.
- If a field is missing because the source was truncated, complete it with practical funnel copy.
- The final JSON must match the requested funnel schema exactly.`;

const AI_GENERATION_TIMEOUT_MS = 35_000;

type FunnelGenerationResult = {
  funnel: FunnelBuilderOutput;
  tokensUsed: number;
  provider: string;
  model: string;
  savedFunnelId?: string;
  strategyContext?: StrategyContext;
  qualityGateResults?: QualityGateSummary;
};

function copyFor(input: FunnelBuilderInput) {
  if (input.language === 'en') {
    return {
      funnelType: `${input.closingMethod} lead capture funnel`,
      reason: `This funnel turns ${input.trafficSource ?? 'social media'} traffic into qualified conversations before asking for a purchase.`,
      primaryGoal: input.funnelGoal,
      headline: `A practical way for ${input.targetAudience} to move from ${input.mainCustomerPain} to ${input.desiredResult}`,
      subheadline: `See the simple system behind ${input.productOrService}, built for ${input.marketLocation}.`,
      cta: `Start on ${input.closingMethod}`,
      trust: `Clear steps, local examples, no pressure.`,
      visual: `Show the before-after journey and the simple steps of the system.`,
      leadMagnet: `${input.productOrService} Quick Start Checklist`,
      welcome: `Hi, I’m interested in ${input.productOrService}. Can you show me the next step?`,
      urgency: `Start with the checklist today and decide after you understand the system.`,
      noTime: 'You want progress without adding another complicated routine.',
      expensive: 'You need to see clear value before you commit.',
      think: 'You want confidence that this fits your situation.',
      spouse: 'You need a simple explanation to discuss with your family.',
      failed: 'You want a more guided process than what you tried before.',
      scam: 'You need proof, clarity, and transparent next steps.',
      fit: 'You want to know whether this can work for your current stage.',
    };
  }

  if (input.language === 'ms') {
    return {
      funnelType: `Funnel prospek melalui ${input.closingMethod}`,
      reason: `Funnel ini menukar trafik ${input.trafficSource ?? 'media sosial'} kepada perbualan yang layak sebelum jualan.`,
      primaryGoal: input.funnelGoal,
      headline: `Cara praktikal untuk ${input.targetAudience} bergerak daripada ${input.mainCustomerPain} kepada ${input.desiredResult}`,
      subheadline: `Lihat sistem mudah di sebalik ${input.productOrService}, sesuai untuk ${input.marketLocation}.`,
      cta: `Mula di ${input.closingMethod}`,
      trust: `Langkah jelas, contoh tempatan, tanpa tekanan.`,
      visual: `Tunjukkan perjalanan sebelum-selepas dan langkah sistem.`,
      leadMagnet: `Senarai Semak Mula Pantas ${input.productOrService}`,
      welcome: `Hi, saya berminat dengan ${input.productOrService}. Boleh tunjuk langkah seterusnya?`,
      urgency: `Mulakan dengan senarai semak hari ini dan buat keputusan selepas faham sistemnya.`,
      noTime: 'Anda mahu kemajuan tanpa rutin yang rumit.',
      expensive: 'Anda perlu nampak nilai yang jelas sebelum membuat keputusan.',
      think: 'Anda mahu yakin bahawa ini sesuai dengan keadaan anda.',
      spouse: 'Anda perlukan penerangan mudah untuk bincang dengan keluarga.',
      failed: 'Anda mahu proses yang lebih terpandu daripada percubaan sebelum ini.',
      scam: 'Anda perlukan bukti, kejelasan, dan langkah yang telus.',
      fit: 'Anda mahu tahu sama ada ini sesuai untuk tahap anda sekarang.',
    };
  }

  return {
    funnelType: `${input.closingMethod} 名单收集成交漏斗`,
    reason: `这个漏斗先把 ${input.trafficSource ?? '社媒'} 流量转成有意向的对话，再通过 ${input.closingMethod} 做筛选和成交。`,
    primaryGoal: input.funnelGoal,
    headline: `帮助${input.targetAudience}从「${input.mainCustomerPain}」走向「${input.desiredResult}」`,
    subheadline: `一套围绕 ${input.productOrService} 的简单行动系统，适合 ${input.marketLocation} 市场。`,
    cta: `通过 ${input.closingMethod} 了解下一步`,
    trust: `步骤清楚，本地化案例，不夸大承诺。`,
    visual: `展示客户从痛点到结果的前后对比，以及系统的 3 个步骤。`,
    leadMagnet: `${input.productOrService} 快速开始清单`,
    welcome: `你好，我想了解 ${input.productOrService}，可以发我下一步吗？`,
    urgency: `先领取清单，了解清楚后再决定是否适合你。`,
    noTime: '对方想要进步，但不想增加复杂负担。',
    expensive: '对方需要先看见价值，再决定是否投入。',
    think: '对方想确认这套方式是否真的适合自己。',
    spouse: '对方需要一个简单说法，方便和家人讨论。',
    failed: '对方过去试过但没有方法或陪跑。',
    scam: '对方需要透明流程、证明和安全感。',
    fit: '对方想知道自己目前阶段能不能开始。',
  };
}

function createFallbackFunnel(input: FunnelBuilderInput): FunnelBuilderOutput {
  const copy = copyFor(input);
  const price = input.offerPrice ? `，价格/形式：${input.offerPrice}` : '';
  const leadMagnets = [
    copy.leadMagnet,
    `${input.mainCustomerPain} 自我检查表`,
    `${input.desiredResult} 7 天行动表`,
    `${input.productOrService} 常见错误清单`,
    `${input.marketLocation} 入门案例拆解`,
  ];
  const objections = [
    ['没时间', copy.noTime],
    ['太贵了', copy.expensive],
    ['要想一想', copy.think],
    ['要问老公/老婆', copy.spouse],
    ['试过失败', copy.failed],
    ['怕被骗', copy.scam],
    ['不适合我', copy.fit],
  ];
  const adAngles = [
    { type: 'pain', angle: `还在被「${input.mainCustomerPain}」拖着走？先用一个简单检查，找出你卡住的真正原因。` },
    { type: 'desire', angle: `如果你想要的是「${input.desiredResult}」，不要先追复杂技巧，先建立一条清楚路径。` },
    { type: 'mistake', angle: `多数人做 ${input.productOrService} 失败，不是因为不努力，而是一开始就选错行动顺序。` },
    { type: 'myth', angle: `你不需要等到全部准备好，先完成第一步诊断，就能知道自己是否适合开始。` },
    { type: 'story', angle: `从不知道怎么开始，到有一套可跟进的系统，改变通常是从一个小决定开始。` },
    { type: 'checklist', angle: `领取「${copy.leadMagnet}」，用 5 分钟确认你现在最该做的下一步。` },
    { type: 'quiz', angle: `测一测：你现在面对的最大障碍，是方向不清、方法不对，还是缺少跟进？` },
    { type: 'transformation', angle: `把「${input.mainCustomerPain}」变成一个可执行计划，先从 ${input.productOrService} 的入门步骤开始。` },
    { type: 'local', angle: `专为 ${input.marketLocation} 的 ${input.targetAudience} 设计，避免套用不适合本地市场的方法。` },
    { type: 'beginner', angle: `新手也能看懂：不用一次做很多，先完成一份检查表，再决定下一步。` },
  ];
  const videoHooks = [
    `如果你现在最大的问题是「${input.mainCustomerPain}」，先别急着买课程，先看这个检查方法。`,
    `很多人想要「${input.desiredResult}」，但第一步就做错了。`,
    `我会用 30 秒告诉你，为什么 ${input.targetAudience} 最容易卡在这里。`,
    `你以为是没资源，其实可能是没有一套简单的行动顺序。`,
    `如果你来自 ${input.marketLocation}，这个做法会比照搬国外方法更实际。`,
    `先问自己一个问题：你现在缺的是机会，还是缺一个可以执行的系统？`,
    `不要再凭感觉尝试，先用这份清单判断你适合走哪一步。`,
    `如果你已经试过但没有结果，可能不是你不行，是流程太乱。`,
    `${input.productOrService} 不应该一开始就复杂化，先从这 3 个判断开始。`,
    `想改善「${input.mainCustomerPain}」，先停止做这一个常见错误。`,
    `我最建议新手先做的，不是成交，而是先确认客户痛点。`,
    `你的客户不会因为功能买单，他们会因为「${input.desiredResult}」行动。`,
    `如果你要用 ${input.closingMethod} 成交，第一句话应该这样设计。`,
    `这不是让你硬卖，而是让客户自己看见下一步。`,
    `一个好的 lead magnet，不是资料越多越好，而是让人马上有方向。`,
    `如果广告一直没人回复，先检查你的角度是不是太像产品介绍。`,
    `把痛点讲清楚，比把产品讲完整更重要。`,
    `今天先做一件事：把你的客户痛点写成一句能被理解的话。`,
    `如果你只有 10 分钟，就先完成这个漏斗入口。`,
    `想要更稳定的询问，不要只发内容，要设计可跟进的路径。`,
  ];
  const emailSequence = [
    {
      email: 1,
      subject: `先别急着开始 ${input.productOrService}`,
      preview: `第一步是确认你真正卡在「${input.mainCustomerPain}」的哪一层`,
      body: `今天先做诊断：你面对的是方向问题、方法问题，还是执行跟进问题。确认之后，再决定下一步会更稳。`,
      cta: copy.cta,
    },
    {
      email: 2,
      subject: `为什么你一直想改变，却迟迟没有进展`,
      preview: `多数人不是没有动力，而是缺少一个小到能开始的步骤`,
      body: `如果目标太大，大脑会自动拖延。先把「${input.desiredResult}」拆成一个今天能完成的小行动。`,
      cta: copy.cta,
    },
    {
      email: 3,
      subject: `${input.productOrService} 最常见的 3 个错误`,
      preview: `避免一开始就走弯路`,
      body: `常见错误包括：太快推销、没有筛选客户、没有跟进节奏。先修正入口，后面的成交才会更自然。`,
      cta: copy.cta,
    },
    {
      email: 4,
      subject: `适合 ${input.targetAudience} 的简单路径`,
      preview: `不用复杂工具，也可以先建立清楚流程`,
      body: `你的第一条路径可以很简单：吸引注意 -> 领取清单 -> ${input.closingMethod} 沟通 -> 判断是否适合。`,
      cta: copy.cta,
    },
    {
      email: 5,
      subject: `如果你准备好了，这是下一步`,
      preview: `先用低风险方式判断是否适合`,
      body: `你不需要马上做重大决定。先通过清单和简短沟通，看这套方式是否真的适合你当前阶段。`,
      cta: copy.cta,
    },
  ];

  return {
    funnelSummary: {
      funnelType: copy.funnelType,
      reason: copy.reason,
      primaryGoal: copy.primaryGoal,
      closingChannel: input.closingMethod,
    },
    customerAvatar: {
      name: '核心潜在客户',
      ageRange: '25-45',
      gender: '不限',
      location: input.marketLocation,
      currentSituation: `正在面对${input.mainCustomerPain}，但还没有一套清楚可执行的方法。`,
      mainPain: input.mainCustomerPain,
      hiddenFear: '担心继续拖延会错过改变机会，也担心再次尝试失败。',
      desiredOutcome: input.desiredResult,
      biggestObjection: '不确定这是否真的适合自己。',
      buyingTrigger: '看到一个低风险、步骤清楚、可以马上开始的小行动。',
      emotionalHook: `不用再被${input.mainCustomerPain}困住。`,
      logicalHook: `用清楚步骤了解 ${input.productOrService}${price}。`,
      bestPlatform: input.trafficSource ?? '社交媒体',
      bestCta: copy.cta,
    },
    painDesireMap: {
      surfacePain: input.mainCustomerPain,
      deepPain: '缺少方向、方法和持续行动的信心。',
      dailyFrustration: '每天都想改变，但不知道从哪里开始。',
      emotionalCost: '焦虑、拖延、自我怀疑。',
      financialCost: '继续花时间试错，机会成本越来越高。',
      socialCost: '不好意思让身边人知道自己一直没有进展。',
      dreamOutcome: input.desiredResult,
      fastWin: '先完成一份自我检查，找出最适合自己的下一步。',
      longTermTransformation: `建立围绕 ${input.productOrService} 的稳定行动系统。`,
    },
    offerPositioning: {
      formula: `帮助 ${input.targetAudience} 通过 ${input.productOrService} 达到 ${input.desiredResult}`,
      whatIsIt: input.productOrService,
      whoIsItFor: input.targetAudience,
      problemSolved: input.mainCustomerPain,
      resultPromised: input.desiredResult,
      whyDifferent: '重点放在清楚步骤、真实执行和本地化场景。',
      whyNow: '越早厘清方向，越早减少试错成本。',
    },
    landingPage: {
      hero: {
        headline: copy.headline,
        subheadline: copy.subheadline,
        ctaButton: copy.cta,
        trustLine: copy.trust,
        visualDirection: copy.visual,
      },
      problem: {
        mainProblem: input.mainCustomerPain,
        painBullets: ['不知道从哪里开始', '试了很多方法但无法持续', '担心投入后没有结果'],
        mistakes: ['一开始就想做太多', '没有筛选真正适合自己的方法', '没有跟进和复盘机制'],
        emotionalFrustration: '明明想改变，却一直停在原地。',
      },
      desire: {
        dreamOutcome: input.desiredResult,
        before: `被${input.mainCustomerPain}影响，每天都在拖延。`,
        after: `知道下一步怎么做，并开始看到清楚进展。`,
        newPossibility: '先从一个简单低风险的步骤开始。',
      },
      solution: {
        systemName: `${input.productOrService} 行动系统`,
        uniqueMechanism: '诊断现状 -> 选择路径 -> 跟进成交 -> 数据复盘',
        howItWorks: ['填写快速检查表', '收到适合你的建议', `进入 ${input.closingMethod} 沟通`, '根据情况安排下一步'],
        whyItWorks: '它把复杂决定拆成小步骤，让潜在客户先理解、再行动。',
      },
      leadMagnet: {
        name: copy.leadMagnet,
        whatTheyGet: ['现状检查表', '常见错误提醒', '下一步行动建议', `${input.closingMethod} 咨询入口`],
        whyValuable: '潜在客户不用马上购买，也能先厘清自己是否适合。',
        cta: copy.cta,
      },
      faq: [
        { question: '这个适合新手吗？', answer: '适合。流程会从基础检查开始，不需要一次做完所有事情。' },
        { question: '需要马上付款吗？', answer: '不需要。先领取资料，了解清楚后再决定。' },
        { question: '多久可以看到方向？', answer: '通常完成检查后，就能知道下一步该怎么走。' },
        { question: '如果我很忙怎么办？', answer: '系统会先安排最小行动，避免增加太多负担。' },
        { question: '如何开始？', answer: `点击按钮，通过 ${input.closingMethod} 获取下一步。` },
      ],
      finalCta: {
        headline: `准备好解决「${input.mainCustomerPain}」了吗？`,
        urgencyLine: copy.urgency,
        ctaButton: copy.cta,
        whatsappMessage: copy.welcome,
      },
    },
    leadMagnets: leadMagnets.map((title) => ({
      title,
      format: 'Checklist',
      targetAudience: input.targetAudience,
      problemSolved: input.mainCustomerPain,
      cta: copy.cta,
    })),
    whatsappSystem: {
      welcomeMessage: copy.welcome,
      qualificationQuestions: [
        `你现在最想解决的是不是：${input.mainCustomerPain}？`,
        `你希望达到的结果是不是：${input.desiredResult}？`,
        '你之前试过什么方法？',
        `如果适合，你想通过 ${input.closingMethod} 了解下一步吗？`,
      ],
      leadScoring: {
        a: '痛点明确，愿意沟通，有明确行动时间。',
        b: '有兴趣但需要更多证明和解释。',
        c: '还在了解阶段，适合内容培育。',
        d: '需求不匹配或暂时没有行动意愿。',
      },
      followUpSequence: [0, 1, 2, 3, 5, 7].map((day) => ({
        day,
        message: day === 0
          ? copy.welcome
          : `第 ${day} 天跟进：你看完资料了吗？如果你现在最想解决「${input.mainCustomerPain}」，我可以帮你判断下一步。`,
      })),
    },
    emailSequence,
    adAngles,
    videoHooks,
    objectionHandling: objections.map(([objection, realMeaning]) => ({
      objection,
      realMeaning,
      response: `我明白。我们先不急着决定，先用清单确认你是否适合 ${input.productOrService}。`,
      softCta: copy.cta,
    })),
    analyticsTrackingPlan: {
      metrics: ['页面访问', 'CTA 点击', '名单提交', 'WhatsApp 点击', '回复率', '合格率', '预约率', '成交率', '每条 lead 成本', '跟进完成率'],
      benchmarks: {
        optInRate: '20-35%',
        whatsappClickRate: '30-50%',
        replyRate: '40-70%',
        appointmentRate: '10-25%',
        closeRate: '5-15%',
      },
    },
    optimizationChecklist: [
      '检查 headline 是否直接说中痛点',
      '确认 CTA 足够清楚',
      '测试 lead magnet 名称',
      '记录 WhatsApp 回复率',
      '优化第一句欢迎语',
      '补充本地化案例',
      '减少表单字段',
      '建立 7 天跟进',
      '每周复盘广告角度',
      '淘汰低回复来源',
      '更新 FAQ',
      '整理高频异议',
    ],
  };
}

function buildStrategyPromptBlock(input: FunnelBuilderInput): string {
  const context = input.strategyContext;
  if (!context) return '';

  return `

Shared Strategy Context - this is mandatory and must guide every section:
${JSON.stringify(context, null, 2)}

Generation rules based on Strategy Context:
- Every major section must connect back to strategy.core_narrative.
- Use real_material.case_studies for testimonials, story hooks, social proof, emails, and WhatsApp follow-up.
- Use real_material.common_objections as the primary objectionHandling list.
- Do not repeat the same sentence frame across hooks, ad angles, objections, emails, or WhatsApp messages.
- Generate 20 video hooks as 5 groups of 4: pain, curiosity, story, numbers, contrarian.
- Generate adAngles as 10 distinct frames: pain, result, mistake, myth, story, checklist, test, transformation, local, beginner.
- WhatsApp followUpSequence length must follow strategy.sequence_length_days and every day needs a distinct purpose.
- Lead magnets must use 5 different formats across TOFU/MOFU/BOFU, not five checklists.
- If case studies exist, landing page must include testimonial-style proof inside the copy and FAQ.`;
}

function buildPrompt(input: FunnelBuilderInput): string {
  const lang = LANGUAGE_MAP[input.language];
  return `Generate a complete funnel system for this business. Respond entirely in ${lang}.

Business Information:
- Business Type: ${input.businessType}
- Product/Service: ${input.productOrService}
- Target Audience: ${input.targetAudience}
- Market: ${input.marketLocation}
- Main Pain: ${input.mainCustomerPain}
- Desired Result: ${input.desiredResult}
- Offer Price: ${input.offerPrice ?? 'Not specified'}
- Funnel Goal: ${input.funnelGoal}
- Traffic Source: ${input.trafficSource ?? 'Social media ads'}
- Closing Method: ${input.closingMethod}
- Brand Tone: ${input.brandTone ?? 'Warm and relatable'}
${buildStrategyPromptBlock(input)}

Return this exact JSON structure (all strings in ${lang}):
{
  "funnelSummary": { "funnelType": "", "reason": "", "primaryGoal": "", "closingChannel": "" },
  "customerAvatar": { "name": "", "ageRange": "", "gender": "", "location": "", "currentSituation": "", "mainPain": "", "hiddenFear": "", "desiredOutcome": "", "biggestObjection": "", "buyingTrigger": "", "emotionalHook": "", "logicalHook": "", "bestPlatform": "", "bestCta": "" },
  "painDesireMap": { "surfacePain": "", "deepPain": "", "dailyFrustration": "", "emotionalCost": "", "financialCost": "", "socialCost": "", "dreamOutcome": "", "fastWin": "", "longTermTransformation": "" },
  "offerPositioning": { "formula": "", "whatIsIt": "", "whoIsItFor": "", "problemSolved": "", "resultPromised": "", "whyDifferent": "", "whyNow": "" },
  "landingPage": {
    "hero": { "headline": "", "subheadline": "", "ctaButton": "", "trustLine": "", "visualDirection": "" },
    "problem": { "mainProblem": "", "painBullets": ["","",""], "mistakes": ["","",""], "emotionalFrustration": "" },
    "desire": { "dreamOutcome": "", "before": "", "after": "", "newPossibility": "" },
    "solution": { "systemName": "", "uniqueMechanism": "", "howItWorks": ["","","",""], "whyItWorks": "" },
    "leadMagnet": { "name": "", "whatTheyGet": ["","","",""], "whyValuable": "", "cta": "" },
    "faq": [{"question":"","answer":""},{"question":"","answer":""},{"question":"","answer":""},{"question":"","answer":""},{"question":"","answer":""}],
    "finalCta": { "headline": "", "urgencyLine": "", "ctaButton": "", "whatsappMessage": "" }
  },
  "leadMagnets": [
    {"title":"","format":"","targetAudience":"","problemSolved":"","cta":""},
    {"title":"","format":"","targetAudience":"","problemSolved":"","cta":""},
    {"title":"","format":"","targetAudience":"","problemSolved":"","cta":""},
    {"title":"","format":"","targetAudience":"","problemSolved":"","cta":""},
    {"title":"","format":"","targetAudience":"","problemSolved":"","cta":""}
  ],
  "whatsappSystem": {
    "welcomeMessage": "",
    "qualificationQuestions": ["","","",""],
    "leadScoring": { "a": "", "b": "", "c": "", "d": "" },
    "followUpSequence": [
      {"day":0,"message":""},{"day":1,"message":""},{"day":2,"message":""},
      {"day":3,"message":""},{"day":5,"message":""},{"day":7,"message":""}
    ]
  },
  "emailSequence": [
    {"email":1,"subject":"","preview":"","body":"","cta":""},
    {"email":2,"subject":"","preview":"","body":"","cta":""},
    {"email":3,"subject":"","preview":"","body":"","cta":""},
    {"email":4,"subject":"","preview":"","body":"","cta":""},
    {"email":5,"subject":"","preview":"","body":"","cta":""}
  ],
  "adAngles": [
    {"type":"pain","angle":""},{"type":"desire","angle":""},{"type":"mistake","angle":""},
    {"type":"myth","angle":""},{"type":"story","angle":""},{"type":"checklist","angle":""},
    {"type":"quiz","angle":""},{"type":"transformation","angle":""},
    {"type":"local","angle":""},{"type":"beginner","angle":""}
  ],
  "videoHooks": ["","","","","","","","","","","","","","","","","","","",""],
  "objectionHandling": [
    {"objection":"没时间","realMeaning":"","response":"","softCta":""},
    {"objection":"太贵了","realMeaning":"","response":"","softCta":""},
    {"objection":"要想一想","realMeaning":"","response":"","softCta":""},
    {"objection":"要问老公/老婆","realMeaning":"","response":"","softCta":""},
    {"objection":"试过失败","realMeaning":"","response":"","softCta":""},
    {"objection":"怕被骗","realMeaning":"","response":"","softCta":""},
    {"objection":"不适合我","realMeaning":"","response":"","softCta":""}
  ],
  "analyticsTrackingPlan": {
    "metrics": ["","","","","","","","","",""],
    "benchmarks": { "optInRate": "", "whatsappClickRate": "", "replyRate": "", "appointmentRate": "", "closeRate": "" }
  },
  "optimizationChecklist": ["","","","","","","","","","","",""]
}`;
}

function stripCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

function extractJsonCandidate(text: string): string | null {
  const cleaned = stripCodeFence(text);
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = firstBrace; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = inString;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return cleaned.slice(firstBrace, index + 1);
    }
  }

  return cleaned.slice(firstBrace);
}

function tryParseOutput(text: string): FunnelBuilderOutput | null {
  const candidate = extractJsonCandidate(text);
  if (!candidate) return null;

  try {
    return JSON.parse(candidate) as FunnelBuilderOutput;
  } catch {
    return null;
  }
}

function combineResults<T extends AIGenerateResult & { routing: RoutingDecision }>(first: T, second: T): T {
  return {
    ...second,
    tokensIn: first.tokensIn + second.tokensIn,
    tokensOut: first.tokensOut + second.tokensOut,
    durationMs: first.durationMs + second.durationMs,
  };
}

function buildRepairPrompt(input: FunnelBuilderInput, rawOutput: string): string {
  return `${buildPrompt(input)}

Malformed JSON output to repair:
${stripCodeFence(rawOutput).slice(0, 24000)}`;
}

function createFallbackResult(input: FunnelBuilderInput): FunnelGenerationResult {
  return {
    funnel: createFallbackFunnel(input),
    tokensUsed: 0,
    provider: 'fallback',
    model: 'deterministic-funnel-template',
    strategyContext: input.strategyContext,
  };
}

const HOOK_PREFIXES = ['痛点', '好奇', '故事', '数字', '反直觉'];
const LEAD_MAGNET_FORMATS = ['Checklist', 'Guide', 'Template', 'Case Study', 'Quiz'];
const WHATSAPP_PURPOSES = [
  '欢迎+交付',
  '教育',
  '案例故事',
  '克服异议',
  '社会证明',
  '软成交',
  '明确邀约',
];

function firstCase(input: FunnelBuilderInput) {
  return input.strategyContext?.real_material.case_studies[0];
}

function diversifyFunnel(input: FunnelBuilderInput, funnel: FunnelBuilderOutput): FunnelBuilderOutput {
  const context = input.strategyContext;
  if (!context) return funnel;

  const caseStudy = firstCase(input);
  const caseText = caseStudy ? `${caseStudy.name} 从「${caseStudy.before_state}」经过「${caseStudy.process}」，最后达到「${caseStudy.after_result}」` : context.strategy.core_narrative;
  const cta = funnel.landingPage.finalCta.ctaButton || funnel.landingPage.leadMagnet.cta || `通过 ${input.closingMethod} 了解下一步`;

  const adAngles = [
    { type: 'pain', angle: `痛点角度：如果「${input.mainCustomerPain}」已经影响生活，先用一个低风险清单找出卡点。` },
    { type: 'result', angle: `结果角度：想要「${input.desiredResult}」，重点不是更努力，而是先走对第一步。` },
    { type: 'mistake', angle: `错误角度：多数 ${input.targetAudience} 不是机会太少，而是一开始就用错行动顺序。` },
    { type: 'myth', angle: `迷思角度：不需要等到完全准备好，先完成诊断就能知道自己适不适合。` },
    { type: 'story', angle: `故事角度：${caseText}，改变不是靠冲动，而是靠清楚路径。` },
    { type: 'checklist', angle: `清单角度：领取 ${funnel.landingPage.leadMagnet.name}，5 分钟确认你现在最该做什么。` },
    { type: 'test', angle: `测试角度：测一测你卡在方向、方法，还是跟进系统。` },
    { type: 'transformation', angle: `转变角度：把「${input.mainCustomerPain}」变成可执行计划，从一个小入口开始。` },
    { type: 'local', angle: `本地角度：专为 ${input.marketLocation} 的 ${input.targetAudience} 设计，避免套用不适合本地市场的方法。` },
    { type: 'beginner', angle: `新手角度：不用懂复杂工具，先看懂自己的现状和下一步。` },
  ];

  const videoHooks = HOOK_PREFIXES.flatMap((prefix) =>
    [0, 1, 2, 3].map((offset) => {
      const detail = [input.mainCustomerPain, input.desiredResult, caseText, input.marketLocation][offset];
      return `${prefix}Hook ${offset + 1}：${detail}，这就是 ${input.productOrService} 漏斗第一步要解决的问题。`;
    }),
  ).slice(0, 20);

  const objections = [...context.real_material.common_objections];
  const defaults = ['没时间', '太贵了', '怕被骗', '我之前试过失败了', '不确定适不适合我', '要再想一想'];
  for (const item of defaults) if (objections.length < 6 && !objections.includes(item)) objections.push(item);

  const objectionHandling = objections.slice(0, 6).map((objection) => ({
    objection,
    realMeaning: `客户真正担心的是：${objection} 背后会不会让自己再次浪费时间、钱或信任。`,
    response: `我理解你会这样想。我们不急着决定，先用 ${caseStudy?.name ?? '真实案例'} 的路径看：从「${caseStudy?.before_state ?? input.mainCustomerPain}」到「${caseStudy?.after_result ?? input.desiredResult}」中间靠的不是硬冲，而是先确认是否适合你当前阶段。`,
    softCta: cta,
  }));

  const sequenceLength = Math.max(3, Math.min(7, context.strategy.sequence_length_days));
  const followUpSequence = Array.from({ length: sequenceLength + 1 }, (_, day) => ({
    day,
    message: `Day ${day}｜${WHATSAPP_PURPOSES[day] ?? '跟进'}：${day === 0 ? `这是你的 ${funnel.landingPage.leadMagnet.name}，先看第一步。` : `今天用「${context.strategy.core_narrative.slice(0, 48)}」这个角度，帮你判断是否适合继续了解。`} ${cta}`,
  }));

  return {
    ...funnel,
    adAngles,
    videoHooks,
    objectionHandling,
    leadMagnets: funnel.leadMagnets.slice(0, 5).map((item, index) => ({
      ...item,
      format: LEAD_MAGNET_FORMATS[index] ?? item.format,
      title: item.title || `${input.productOrService} ${LEAD_MAGNET_FORMATS[index]}`,
    })),
    whatsappSystem: { ...funnel.whatsappSystem, followUpSequence },
  };
}

function runQualityGate(funnel: FunnelBuilderOutput): QualityGateSummary {
  const emailItems = funnel.emailSequence.map((email) => `${email.subject} ${email.body}`);
  const objectionItems = funnel.objectionHandling.map((item) => `${item.objection} ${item.response}`);
  const whatsappItems = funnel.whatsappSystem.followUpSequence.map((item) => item.message);
  const leadMagnetItems = funnel.leadMagnets.map((item) => `${item.format} ${item.title} ${item.problemSolved}`);
  return qualityGateService.summarize({
    video_hooks: funnel.videoHooks,
    ad_angles: funnel.adAngles.map((item) => item.angle),
    objections: objectionItems,
    whatsapp: whatsappItems,
    emails: emailItems,
    lead_magnets: leadMagnetItems,
  });
}

function buildSavedFunnelTitle(input: FunnelBuilderInput, funnel: FunnelBuilderOutput): string {
  const name = funnel.landingPage.leadMagnet.name || input.productOrService;
  return `${input.productOrService} - ${name}`.slice(0, 180);
}

function toSavedFunnelConfig(input: FunnelBuilderInput, funnel: FunnelBuilderOutput, qualityGateResults: QualityGateSummary): FunnelConfig & {
  ai_generated?: Record<string, unknown>;
  strategy_context?: StrategyContext;
  quality_gate_results?: QualityGateSummary;
} {
  const firstStudy = input.strategyContext?.real_material.case_studies[0];
  const { strategyContext: _strategyContext, ...savedInput } = input;
  return {
    type: 'landing',
    theme: {
      primary_color: '#2563eb',
      bg_color: '#f8fafc',
      font: input.language === 'zh' ? 'noto-sans-sc' : 'inter',
    },
    sections: [
      {
        type: 'hero',
        headline: funnel.landingPage.hero.headline,
        subheadline: funnel.landingPage.hero.subheadline,
        cta_text: funnel.landingPage.hero.ctaButton,
        cta_type: input.closingMethod.toLowerCase().includes('whatsapp') ? 'whatsapp' : 'form',
        cta_target: funnel.landingPage.finalCta.whatsappMessage,
      },
      {
        type: 'pain',
        title: funnel.landingPage.problem.mainProblem,
        items: funnel.landingPage.problem.painBullets.map((text) => ({ text })),
      },
      {
        type: 'benefits',
        title: funnel.landingPage.desire.dreamOutcome,
        items: funnel.landingPage.solution.howItWorks.map((step, index) => ({
          icon: ['target', 'sparkles', 'message-circle', 'check-circle'][index] ?? 'check-circle',
          title: step,
          description: index === 0 ? funnel.landingPage.solution.uniqueMechanism : funnel.landingPage.solution.whyItWorks,
        })),
      },
      {
        type: 'mechanism',
        title: funnel.landingPage.solution.systemName,
        description: `${funnel.landingPage.solution.uniqueMechanism}\n\n${funnel.landingPage.solution.whyItWorks}`,
      },
      ...(firstStudy ? [{
        type: 'testimonial' as const,
        title: '真实案例',
        items: [{
          name: firstStudy.name,
          text: `从「${firstStudy.before_state}」，经过「${firstStudy.process}」，最后达到「${firstStudy.after_result}」。`,
        }],
      }] : []),
      {
        type: 'faq',
        title: '常见问题',
        items: funnel.landingPage.faq,
      },
      {
        type: 'cta',
        headline: funnel.landingPage.finalCta.headline,
        subheadline: funnel.landingPage.finalCta.urgencyLine,
        button_text: funnel.landingPage.finalCta.ctaButton,
        button_type: input.closingMethod.toLowerCase().includes('whatsapp') ? 'whatsapp' : 'form',
        button_target: funnel.landingPage.finalCta.whatsappMessage,
      },
    ],
    ai_generated: {
      source: 'world_class_funnel_builder',
      input: savedInput,
      output: funnel,
      generated_at: new Date().toISOString(),
    },
    strategy_context: input.strategyContext,
    quality_gate_results: qualityGateResults,
  };
}

async function saveGeneratedFunnel(
  user: AuthUser,
  input: FunnelBuilderInput,
  result: FunnelGenerationResult,
): Promise<FunnelGenerationResult> {
  try {
    const saved = await funnelService.create(user, {
      title: buildSavedFunnelTitle(input, result.funnel),
      config: toSavedFunnelConfig(input, result.funnel, result.qualityGateResults ?? runQualityGate(result.funnel)) as unknown as Record<string, unknown>,
    });

    if (
      result.strategyContext?.real_material.case_studies.length &&
      (result.qualityGateResults?.pass_rate ?? 0) >= 80
    ) {
      await notifyMissionProgress(user, 'lead_magnet_created');
    }

    return { ...result, savedFunnelId: saved.id };
  } catch (error) {
    console.error('Funnel builder: failed to save generated funnel record.', error);
    return result;
  }
}

export const funnelBuilderService = {
  async generateWorldClassFunnel(
    user: AuthUser,
    input: FunnelBuilderInput,
  ): Promise<FunnelGenerationResult> {
    await enforceQuota(user.tenantId);

    const router = await getRouterForTenant(user.tenantId);

    const aiGeneration = (async (): Promise<FunnelGenerationResult> => {
      const result = await router.generate(
        {
          systemPrompt: SYSTEM_PROMPT,
          userMessage: buildPrompt(input),
          temperature: 0.55,
          maxTokens: 8000,
        },
        'funnel_copy',
      );

      const validation = validateAIOutput(result.text);
      let finalResult = result;

      if (!validation.valid) {
        const retry = await router.generate(
          {
            systemPrompt: SYSTEM_PROMPT + '\n\nIMPORTANT: Do NOT mention specific income amounts, medical cures, or guarantees. Return only valid JSON.',
            userMessage: buildPrompt(input),
            temperature: 0.35,
            maxTokens: 8000,
          },
          'funnel_copy',
        );
        finalResult = combineResults(result, retry);
      }

      let funnel = tryParseOutput(finalResult.text);

      if (!funnel) {
        const repair = await router.generate(
          {
            systemPrompt: JSON_REPAIR_PROMPT,
            userMessage: buildRepairPrompt(input, finalResult.text),
            temperature: 0.1,
            maxTokens: 8000,
          },
          'funnel_copy',
        );
        finalResult = combineResults(finalResult, repair);
        funnel = tryParseOutput(repair.text);
      }

      if (!funnel) {
        console.warn('Funnel builder: AI returned malformed JSON after repair, using fallback output.');
        funnel = createFallbackFunnel(input);
      }

      funnel = diversifyFunnel(input, funnel);
      const qualityGateResults = runQualityGate(funnel);

      await logAIUsage({
        tenantId: user.tenantId,
        userId: user.id,
        feature: 'world_class_funnel_builder',
        result: finalResult,
        routing: finalResult.routing,
      });

      return {
        funnel,
        tokensUsed: finalResult.tokensIn + finalResult.tokensOut,
        provider: finalResult.provider,
        model: finalResult.model,
        strategyContext: input.strategyContext,
        qualityGateResults,
      };
    })().catch((error) => {
      console.error('Funnel builder: AI generation failed, using fallback output.', error);
      return createFallbackResult(input);
    });

    const timeoutFallback = new Promise<FunnelGenerationResult>((resolve) => {
      setTimeout(() => {
        console.warn(`Funnel builder: AI generation exceeded ${AI_GENERATION_TIMEOUT_MS}ms, using fallback output.`);
        resolve(createFallbackResult(input));
      }, AI_GENERATION_TIMEOUT_MS);
    });

    const result = await Promise.race([aiGeneration, timeoutFallback]);
    return saveGeneratedFunnel(user, input, result);
  },
};
