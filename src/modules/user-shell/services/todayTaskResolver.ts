import {
  BUSINESS_SCHEDULE,
  EXPERIENCE_LAST_DAY,
  EXPERIENCE_SCHEDULE,
  type ScheduleEntry,
} from './scheduleTable';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface FollowupItem {
  id: string;
  waitingSince: Date;
}

export interface TodayTaskUser {
  businessStartAt: Date | null;
  createdAt: Date;
}

export type SchedulePhase = 'experience' | 'business';

export interface FollowupTodayTask {
  type: 'followup';
  followup: FollowupItem;
}

export interface ReadyScheduleTodayTask {
  type: 'schedule';
  phase: SchedulePhase;
  day: number;
  status: 'ready';
  content: string;
}

export interface PendingScheduleTodayTask {
  type: 'schedule';
  phase: SchedulePhase;
  day: number;
  status: 'content_pending';
}

export type TodayTask = FollowupTodayTask | ReadyScheduleTodayTask | PendingScheduleTodayTask;

export function computeDayIndex(startAt: Date, nowMs = Date.now()): number {
  const elapsedMs = Math.max(0, nowMs - startAt.getTime());
  return Math.floor(elapsedMs / DAY_IN_MS) + 1;
}

function resolveScheduleTask(
  phase: SchedulePhase,
  day: number,
  entry: ScheduleEntry | undefined,
): ReadyScheduleTodayTask | PendingScheduleTodayTask {
  if (!entry) {
    return { type: 'schedule', phase, day, status: 'content_pending' };
  }

  return { type: 'schedule', phase, day, status: 'ready', content: entry.content };
}

export function getTodayTask(
  user: TodayTaskUser,
  followupQueue: readonly FollowupItem[],
): TodayTask {
  const nowMs = Date.now();
  const overdueFollowup = followupQueue.find(
    (item) => nowMs - item.waitingSince.getTime() > DAY_IN_MS,
  );

  if (overdueFollowup) {
    return { type: 'followup', followup: overdueFollowup };
  }

  if (user.businessStartAt === null) {
    const experienceDay = Math.min(
      computeDayIndex(user.createdAt, nowMs),
      EXPERIENCE_LAST_DAY,
    );
    return resolveScheduleTask(
      'experience',
      experienceDay,
      EXPERIENCE_SCHEDULE[experienceDay],
    );
  }

  const businessDay = computeDayIndex(user.businessStartAt, nowMs);
  return resolveScheduleTask('business', businessDay, BUSINESS_SCHEDULE[businessDay]);
}
