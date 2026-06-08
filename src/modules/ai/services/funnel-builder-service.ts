import type { AuthUser } from '@/modules/auth/services/auth-service';
import { generateWithFallback } from '../providers/factory';
import { validateAIOutput } from '../prompt/validator';
import { logAIUsage } from '../usage/tracker';
import { enforceQuota } from '../usage/quota';
import { AppError } from '@/lib/errors';

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

function parseOutput(text: string): FunnelBuilderOutput {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as FunnelBuilderOutput;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as FunnelBuilderOutput;
    throw new AppError('INTERNAL_ERROR', 500, 'AI returned invalid JSON for funnel builder');
  }
}

export const funnelBuilderService = {
  async generateWorldClassFunnel(
    user: AuthUser,
    input: FunnelBuilderInput,
  ): Promise<{ funnel: FunnelBuilderOutput; tokensUsed: number; provider: string; model: string }> {
    await enforceQuota(user.tenantId);

    const result = await generateWithFallback({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildPrompt(input),
      temperature: 0.85,
      maxTokens: 4000,
    });

    const validation = validateAIOutput(result.text);
    let finalResult = result;

    if (!validation.valid) {
      const retry = await generateWithFallback({
        systemPrompt: SYSTEM_PROMPT + '\n\nIMPORTANT: Do NOT mention specific income amounts, medical cures, or guarantees. Return only valid JSON.',
        userMessage: buildPrompt(input),
        temperature: 0.6,
        maxTokens: 4000,
      });
      finalResult = {
        ...retry,
        tokensIn: result.tokensIn + retry.tokensIn,
        tokensOut: result.tokensOut + retry.tokensOut,
        durationMs: result.durationMs + retry.durationMs,
      };
    }

    const funnel = parseOutput(finalResult.text);

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'world_class_funnel_builder',
      result: finalResult,
    });

    return {
      funnel,
      tokensUsed: finalResult.tokensIn + finalResult.tokensOut,
      provider: finalResult.provider,
      model: finalResult.model,
    };
  },
};
