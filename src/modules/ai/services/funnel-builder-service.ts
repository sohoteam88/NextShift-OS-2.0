import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getRouterForTenant } from '../router';
import { validateAIOutput } from '../prompt/validator';
import { logAIUsage } from '../usage/tracker';
import { enforceQuota } from '../usage/quota';
import type { AIGenerateResult } from '../providers/types';
import type { RoutingDecision } from '../router';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import type { FunnelConfig } from '@/modules/funnel/types';

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

const AI_GENERATION_TIMEOUT_MS = 20_000;

type FunnelGenerationResult = {
  funnel: FunnelBuilderOutput;
  tokensUsed: number;
  provider: string;
  model: string;
  savedFunnelId?: string;
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
    emailSequence: [1, 2, 3, 4, 5].map((email) => ({
      email,
      subject: `${input.productOrService}: 第 ${email} 步行动建议`,
      preview: `帮你从${input.mainCustomerPain}走向${input.desiredResult}`,
      body: `今天的重点是把目标拆小。先确认你目前的情况，再选择一个最容易执行的行动。`,
      cta: copy.cta,
    })),
    adAngles: [
      '痛点', '结果', '错误', '迷思', '故事', '清单', '测验', '转变', '本地场景', '新手入门',
    ].map((type) => ({ type, angle: `${type}角度：${input.targetAudience} 如何用 ${input.productOrService} 改善 ${input.mainCustomerPain}` })),
    videoHooks: Array.from({ length: 20 }, (_, index) =>
      `${index + 1}. 如果你正在面对「${input.mainCustomerPain}」，先别急着买任何东西，先看这一步。`),
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
  };
}

function buildSavedFunnelTitle(input: FunnelBuilderInput, funnel: FunnelBuilderOutput): string {
  const name = funnel.landingPage.leadMagnet.name || input.productOrService;
  return `${input.productOrService} - ${name}`.slice(0, 180);
}

function toSavedFunnelConfig(input: FunnelBuilderInput, funnel: FunnelBuilderOutput): FunnelConfig & {
  ai_generated?: Record<string, unknown>;
} {
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
      input,
      output: funnel,
      generated_at: new Date().toISOString(),
    },
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
      config: toSavedFunnelConfig(input, result.funnel) as unknown as Record<string, unknown>,
    });

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
