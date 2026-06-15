// Content Strategy Engine — auto-generates strategy from Brand DNA + user level

import type { ContentStrategy } from '../types/content.types';
import { generateContentPillars } from './content-pillar-service';
import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';

const FREQUENCY_BY_LEVEL: Record<UserLevel, number> = {
  explorer: 2, builder: 3, operator: 5, leader: 7,
};

export function generateContentStrategy(input: {
  level: UserLevel;
  brandContext?: { audience?: string; industry?: string; goal?: string };
}): ContentStrategy {
  const pillars = generateContentPillars(input.brandContext);
  const weekly = FREQUENCY_BY_LEVEL[input.level] ?? 3;

  return {
    objective: input.brandContext?.goal ?? 'Build trust and attract your ideal audience through consistent, valuable content.',
    contentPillars: pillars,
    weeklyFrequency: weekly,
    recommendedPlatforms: input.level === 'explorer' ? ['instagram', 'facebook'] : ['instagram', 'facebook', 'tiktok', 'xiaohongshu'],
    contentMix: { education: 30, story: 25, proof: 20, offer: input.level === 'leader' ? 25 : 10 },
  };
}
