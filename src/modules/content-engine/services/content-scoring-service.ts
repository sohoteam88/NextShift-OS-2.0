// Content Scoring Engine — scores content on 4 business dimensions

import type { ContentScore } from '../types/content.types';

interface ScoreInput {
  hasStory?: boolean;
  hasEducation?: boolean;
  hasCTA?: boolean;
  hasLeadMagnet?: boolean;
  wordCount?: number;
  hasImage?: boolean;
}

export function scoreContent(input: ScoreInput = {}): ContentScore {
  const trust = scoreDimension([
    input.hasStory ? 30 : 10,
    input.hasImage ? 20 : 5,
    Math.min(30, (input.wordCount ?? 0) > 50 ? 25 : 10),
  ]);

  const authority = scoreDimension([
    input.hasEducation ? 35 : 10,
    (input.wordCount ?? 0) > 100 ? 25 : 10,
    input.hasImage ? 15 : 5,
  ]);

  const engagement = scoreDimension([
    input.hasStory ? 25 : 10,
    input.hasImage ? 20 : 5,
    input.hasCTA ? 20 : 5,
    Math.min(30, (input.wordCount ?? 0) > 80 ? 25 : 10),
  ]);

  const leadGeneration = scoreDimension([
    input.hasCTA ? 35 : 5,
    input.hasLeadMagnet ? 30 : 0,
    input.hasEducation ? 20 : 10,
    input.hasStory ? 15 : 5,
  ]);

  const overall = Math.round((trust + authority + engagement + leadGeneration) / 4);

  return { trust, authority, engagement, leadGeneration, overall };
}

function scoreDimension(scores: number[]): number {
  return Math.min(100, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 1.5));
}
