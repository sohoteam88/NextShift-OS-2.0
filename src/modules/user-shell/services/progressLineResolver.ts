import { EXPERIENCE_LAST_DAY } from './scheduleTable';
import { computeDayIndex, type TodayTaskUser } from './todayTaskResolver';

export interface PublishingProgressInput {
  confirmedPublishedCount: number;
  generatedCount: number;
}

export interface ProgressLineInput extends PublishingProgressInput {
  user: TodayTaskUser;
  todayAction: string;
}

export type PublishingProgress =
  | { status: 'published'; count: number }
  | { status: 'prepared'; count: number }
  | null;

/**
 * Batch 1 has no "发好了 ✓" persistence yet. Callers therefore currently
 * supply zero counts and intentionally receive null; Batch 2 will provide the
 * real generated/confirmed counts without changing this deterministic rule.
 */
export function resolvePublishingProgress(
  input: PublishingProgressInput,
): PublishingProgress {
  if (input.confirmedPublishedCount > 0) {
    return { status: 'published', count: input.confirmedPublishedCount };
  }

  if (input.generatedCount > 0) {
    return { status: 'prepared', count: input.generatedCount };
  }

  return null;
}

export function getProgressLine(input: ProgressLineInput): string | null {
  const nowMs = Date.now();

  if (input.user.businessStartAt === null) {
    const experienceDay = Math.min(
      computeDayIndex(input.user.createdAt, nowMs),
      EXPERIENCE_LAST_DAY,
    );
    return `体验第 ${experienceDay} 天 · 今天的奶昔喝了吗？`;
  }

  const publishingProgress = resolvePublishingProgress(input);
  if (!publishingProgress) {
    return null;
  }

  const businessDay = computeDayIndex(input.user.businessStartAt, nowMs);
  const progressLabel = publishingProgress.status === 'published' ? '已发' : '已准备';
  return `第 ${businessDay} 天 · ${progressLabel} ${publishingProgress.count} 条 · 今天做 ${input.todayAction}`;
}
