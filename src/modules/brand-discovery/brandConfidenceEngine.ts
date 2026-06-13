// ============================================================
// Brand Confidence Engine
// Multi-dimensional confidence scoring for brand readiness.
// Replaces the simple percentage-based BrandReadiness meter.
// ============================================================

import {
  type SlotMap,
  type SlotName,
  SLOT_NAMES,
  getFilledSlotCount,
  getPartialSlotCount,
  getEmptySlotCount,
} from './slotExtractionService';

// ============================================================
// Types
// ============================================================

/** 6 confidence dimensions */
export type ConfidenceDimension =
  | 'audience_clarity'
  | 'story_clarity'
  | 'offer_clarity'
  | 'market_positioning'
  | 'content_direction'
  | 'personal_credibility';

export interface DimensionScore {
  dimension: ConfidenceDimension;
  label: string;
  score: number; // 0-100
  status: 'low' | 'medium' | 'high';
  feedback: string;
}

export interface BrandConfidenceResult {
  overallScore: number; // 0-100
  level: 'low' | 'medium' | 'high';
  dimensions: DimensionScore[];
  recommendations: string[];
  readyForDNA: boolean; // true when score >= 70
}

// ============================================================
// Dimension definitions
// ============================================================

const DIMENSION_DEFS: Record<
  ConfidenceDimension,
  { label: string; weight: number; relevantSlots: SlotName[] }
> = {
  audience_clarity: {
    label: '受众清晰度',
    weight: 0.2,
    relevantSlots: ['preferred_audience'],
  },
  story_clarity: {
    label: '故事清晰度',
    weight: 0.2,
    relevantSlots: ['personal_story'],
  },
  offer_clarity: {
    label: '服务清晰度',
    weight: 0.15,
    relevantSlots: ['current_occupation', 'hidden_expertise'],
  },
  market_positioning: {
    label: '市场定位',
    weight: 0.2,
    relevantSlots: ['current_occupation', 'hidden_expertise', 'preferred_audience'],
  },
  content_direction: {
    label: '内容方向',
    weight: 0.15,
    relevantSlots: ['personal_story', 'future_goal', 'hidden_expertise'],
  },
  personal_credibility: {
    label: '个人可信度',
    weight: 0.1,
    relevantSlots: ['previous_experience', 'personal_story'],
  },
};

// ============================================================
// Scoring logic
// ============================================================

/**
 * Calculate a dimension score (0-100) based on the status of relevant slots.
 */
function calcDimensionScore(
  slots: SlotMap,
  relevantSlots: SlotName[],
): number {
  if (relevantSlots.length === 0) return 0;

  const total = relevantSlots.reduce((sum, name) => {
    const slot = slots[name];
    switch (slot.status) {
      case 'filled':
        return sum + 100;
      case 'partial':
        return sum + 50;
      case 'skipped':
        return sum + 20;
      default:
        return sum + 0;
    }
  }, 0);

  return Math.round(total / relevantSlots.length);
}

/**
 * Determine the status label based on a score.
 */
function scoreStatus(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Generate feedback for a dimension based on its score.
 */
function generateFeedback(
  dimension: ConfidenceDimension,
  score: number,
): string {
  const feedbacks: Record<ConfidenceDimension, Record<string, string>> = {
    audience_clarity: {
      high: '你很清楚想帮谁，这是品牌定位最重要的基础。',
      medium: '对目标受众有基本概念，可以再具体一点。',
      low: '还不太确定受众。试着想想"最想帮的人"长什么样。',
    },
    story_clarity: {
      high: '你的故事很有画面感，这就是观众会记住你的原因。',
      medium: '故事方向出来了，再多加点细节会更有感染力。',
      low: '还没有挖掘到核心故事。每个人都有一个值得讲的故事。',
    },
    offer_clarity: {
      high: '清楚知道你能提供什么价值，方向明确。',
      medium: '有大概的服务方向，可以再聚焦一点。',
      low: '还不太确定你能帮人解决什么。继续挖掘专长。',
    },
    market_positioning: {
      high: '你的定位在市场上是清晰的，有差异化。',
      medium: '定位有一些苗头了，继续打磨差异化。',
      low: '定位还不够清晰。市场和受众需要进一步明确。',
    },
    content_direction: {
      high: '内容方向明确，知道该发什么、对谁发。',
      medium: '内容有方向了，可以更系统化。',
      low: '还不确定内容该往哪个方向走。先明确故事和受众。',
    },
    personal_credibility: {
      high: '你有丰富的经历支撑你的品牌，可信度高。',
      medium: '有一些可信度的基础，再多展示经历和专业。',
      low: '经历和专业还不太看得出来。继续挖掘过往经验。',
    },
  };

  const status = scoreStatus(score);
  return feedbacks[dimension][status] ?? '';
}

/**
 * Generate actionable recommendations based on dimension scores.
 */
function generateRecommendations(dimensions: DimensionScore[]): string[] {
  const recs: string[] = [];
  const lowDims = dimensions.filter((d) => d.status === 'low');

  for (const dim of lowDims) {
    switch (dim.dimension) {
      case 'audience_clarity':
        recs.push('试着描述一位"你理想中的客户"——越具体越好。');
        break;
      case 'story_clarity':
        recs.push('回想一次你帮到别人后最有满足感的时刻，把它写下来。');
        break;
      case 'offer_clarity':
        recs.push('列出你帮别人解决过的3个问题，看看有没有共同点。');
        break;
      case 'market_positioning':
        recs.push('找3个跟你做类似事情的账号，想想你跟他们有什么不同。');
        break;
      case 'content_direction':
        recs.push('先确定"对谁说话"和"帮他们解决什么"，内容自然就出来了。');
        break;
      case 'personal_credibility':
        recs.push('把过去的经验整理成一条时间线，看看有什么故事值得讲。');
        break;
    }
  }

  if (recs.length === 0) {
    recs.push('你的品牌基础已经很扎实了！可以开始规划内容日历。');
  }

  return recs.slice(0, 3); // Max 3 recommendations
}

// ============================================================
// Main engine
// ============================================================

/**
 * Calculate the full brand confidence report from slot state.
 */
export function calculateBrandConfidence(slots: SlotMap): BrandConfidenceResult {
  const dimensions: DimensionScore[] = (
    Object.entries(DIMENSION_DEFS) as [
      ConfidenceDimension,
      (typeof DIMENSION_DEFS)[ConfidenceDimension],
    ][]
  ).map(([key, def]) => {
    const score = calcDimensionScore(slots, def.relevantSlots);
    return {
      dimension: key,
      label: def.label,
      score,
      status: scoreStatus(score),
      feedback: generateFeedback(key, score),
    };
  });

  // Weighted overall score
  const overallScore = Math.round(
    dimensions.reduce((sum, dim) => {
      const def = DIMENSION_DEFS[dim.dimension];
      return sum + dim.score * def.weight;
    }, 0),
  );

  const recommendations = generateRecommendations(dimensions);

  return {
    overallScore,
    level: scoreStatus(overallScore),
    dimensions,
    recommendations,
    readyForDNA: overallScore >= 70,
  };
}

/**
 * Quick check: is the user ready for Brand DNA generation?
 */
export function isReadyForDNA(overallScore: number): boolean {
  return overallScore >= 70;
}

/**
 * Get a summary message based on confidence level.
 */
export function getConfidenceSummary(result: BrandConfidenceResult): string {
  switch (result.level) {
    case 'high':
      return '品牌基础很扎实！可以生成完整的 Brand DNA 了。';
    case 'medium':
      return '方向已经有了，再聊多一点会更精准。';
    default:
      return '还在摸索阶段，没关系，每一步都算数。继续聊下去。';
  }
}
