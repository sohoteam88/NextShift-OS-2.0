import prisma from '@/lib/prisma';
import { getProgressPercent } from '@/modules/mission/constants/journey-map';
import {
  extractCheckKeys,
  type CompletedCheckEntry,
  type CompletedChecksValue,
} from '@/modules/mission/utils/completed-checks';

export type JourneySourceMetadata = {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
};

export type JourneyProgressSnapshot = {
  found: boolean;
  completedChecksValue: CompletedChecksValue;
  completedChecks: string[];
  progressPercent: number;
};

export function toCompletedChecks(value: unknown): CompletedChecksValue {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return value.filter((item): item is CompletedCheckEntry => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Record<string, unknown>;
    return typeof entry.check === 'string' && typeof entry.completed_at === 'string';
  });
}

export async function readJourneyProgress(userId: string): Promise<JourneyProgressSnapshot> {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    select: { completedChecks: true },
  });
  const completedChecksValue = toCompletedChecks(progress?.completedChecks);

  return {
    found: Boolean(progress),
    completedChecksValue,
    completedChecks: extractCheckKeys(completedChecksValue),
    progressPercent: getProgressPercent(completedChecksValue),
  };
}

export function metadataFor(source: string, progress: JourneyProgressSnapshot): JourneySourceMetadata {
  return {
    source,
    scope: 'user',
    confidence: progress.found ? 'derived' : 'fallback',
    fallback: progress.found ? 'none' : 'userProgress_missing',
  };
}
