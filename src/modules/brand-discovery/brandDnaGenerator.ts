// ============================================================
// Brand DNA Generator
// Generates a complete Brand DNA document from extracted profile data.
// Note: The canonical BrandDNA type lives in @/modules/brand-dna/types.ts.
// This file exports GeneratedBrandDNA as a flat intermediate format.
// ============================================================

export type { BrandDNA } from '@/modules/brand-dna/types';

/** Flat generation output — mapped to canonical BrandDNA by brandDnaService */
export interface GeneratedBrandDNA {
  brandPositioning: string;
  brandName: string;
  slogan: string;
  brandStory: string;
  coreMessage: string;
  targetAudience: string;
  contentTone: string;
  brandPersonality: string;
  offerDirection: string;
  contentPillars: Array<{ name: string; emoji: string; percentage: number; description: string }>;
  recommendedPlatforms: string[];
  recommendedFrequency: string;
}

export interface BrandDNAInput {
  identity?: string;
  expertise?: string[];
  story?: string;
  audience?: string;
  positioning?: string;
  target_audience?: string;
  audience_pain_points?: string[];
  personality?: string;
  value_proposition?: string;
  differentiator?: string;
  content_pillars?: Array<{
    name: string;
    emoji: string;
    percentage: number;
    description: string;
  }>;
  recommended_platforms?: string[];
  recommended_frequency?: string;
  content_direction?: string;
}

// ============================================================
// Default values
// ============================================================

const DEFAULT_PILLARS = [
  { name: '教育内容', emoji: '📚', percentage: 40, description: '分享知识和经验' },
  { name: '个人故事', emoji: '📖', percentage: 25, description: '背后的故事和动机' },
  { name: '社会证明', emoji: '🏆', percentage: 20, description: '客户见证和成果' },
  { name: '产品/服务', emoji: '🎁', percentage: 10, description: '你的服务和价值' },
  { name: '互动', emoji: '💬', percentage: 5, description: '与受众互动和问答' },
];

const TONE_MAP: Record<string, string> = {
  friendly: '温暖亲切',
  professional: '专业可信',
  inspirational: '激励人心',
  humorous: '幽默风趣',
};

const PERSONALITY_MAP: Record<string, string> = {
  friendly: '邻家朋友型 — 让人感觉亲近、可信赖',
  professional: '行业专家型 — 专业但不冷漠，有权威但不傲',
  inspirational: '人生导师型 — 激励别人行动和改变',
  humorous: '幽默达人型 — 用轻松的方式传递价值',
};

const FREQUENCY_MAP: Record<string, string> = {
  daily: '每天 1 条',
  every_other_day: '隔天 1 条',
  '3_per_week': '每周 3 条',
};

// ============================================================
// Generator
// ============================================================

/**
 * Generate a Brand DNA document from extracted profile data.
 * This is a pure function — no AI calls needed (AI extraction already happened).
 */
export function generateBrandDNA(input: BrandDNAInput): GeneratedBrandDNA {
  const identity = input.identity ?? '待确认';
  const expertise = input.expertise ?? [];
  const story = input.story ?? '';
  const audience = input.target_audience ?? input.audience ?? '待明确';
  const valueProp = input.value_proposition ?? '';

  // Brand positioning
  const brandPositioning =
    input.positioning ??
    (expertise.length > 0 && audience !== '待明确'
      ? `${expertise[0]}专家 | 帮助${audience}实现目标`
      : '待从访谈中提取');

  // Brand name (derived from identity)
  const brandName = identity !== '待确认' ? `${identity}` : '你的品牌名称';

  // Slogan from value proposition
  const slogan =
    valueProp ||
    (expertise.length > 0
      ? `让${expertise[0]}变得简单`
      : '你的故事，你的品牌');

  // Brand story
  const brandStory =
    story ||
    '你的品牌故事将从品牌探索访谈中生成。告诉 AI 你的经历、动机和愿景，让故事有温度、有画面。';

  // Core message
  const coreMessage =
    valueProp ||
    (identity !== '待确认'
      ? `${identity}，专注帮助${audience}`
      : '明确你的核心信息后这里会更新');

  // Content tone
  const personality = input.personality ?? 'friendly';
  const contentTone = TONE_MAP[personality] ?? '温暖亲切';

  // Brand personality
  const brandPersonality = PERSONALITY_MAP[personality] ?? PERSONALITY_MAP.friendly;

  // Offer direction
  const offerDirection =
    expertise.length > 0
      ? `围绕 ${expertise.slice(0, 3).join('、')} 设计你的服务产品`
      : '待从访谈中明确服务方向';

  // Content pillars
  const contentPillars =
    input.content_pillars && input.content_pillars.length > 0
      ? input.content_pillars
      : DEFAULT_PILLARS;

  // Platforms
  const recommendedPlatforms = input.recommended_platforms ?? ['facebook', 'instagram'];

  // Frequency
  const recommendedFrequency =
    FREQUENCY_MAP[input.recommended_frequency ?? 'every_other_day'] ?? '隔天 1 条';

  return {
    brandPositioning,
    brandName,
    slogan,
    brandStory,
    coreMessage,
    targetAudience: audience,
    contentTone,
    brandPersonality,
    offerDirection,
    contentPillars,
    recommendedPlatforms,
    recommendedFrequency,
  };
}

/**
 * Generate an AI-friendly prompt for DNA refinement.
 */
export function buildDNARefinementPrompt(dna: GeneratedBrandDNA): string {
  return `请基于以下 Brand DNA 草稿，优化品牌定位和故事，输出更专业、更有感染力的版本：

Brand DNA 草稿：
- 品牌定位: ${dna.brandPositioning}
- 品牌名: ${dna.brandName}
- Slogan: ${dna.slogan}
- 品牌故事: ${dna.brandStory}
- 核心信息: ${dna.coreMessage}
- 目标受众: ${dna.targetAudience}
- 内容调性: ${dna.contentTone}
- 品牌个性: ${dna.brandPersonality}
- 服务方向: ${dna.offerDirection}

请返回优化后的完整 Brand DNA JSON。`;
}
