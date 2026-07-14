import type {
  BusinessMemoryActivity,
  BusinessMemoryEvent,
  ExecutionPattern,
} from '../contracts/BusinessContextMemory';
import { deriveExecutionPattern } from './execution-pattern-engine';

export const WEEKLY_REVIEW_WINDOW_DAYS = 7;

export type WeeklyReviewProjection = {
  windowDays: number;
  windowStart: string;
  windowEnd: string;
  activities: BusinessMemoryActivity[];
  completedMissions: number;
  recommendationsIssued: number;
  recommendationsAccepted: number;
  recommendationsIgnored: number;
  discussionTurns: number;
  executionPattern: ExecutionPattern;
  hasActivity: boolean;
};

type BuildWeeklyReviewProjectionInput = {
  events: BusinessMemoryEvent[];
  now?: Date;
};

function eventToActivity(event: BusinessMemoryEvent): BusinessMemoryActivity {
  return {
    type: event.type,
    title: event.title,
    summary: event.summary,
    occurredAt: event.occurredAt,
    referenceId: event.referenceId,
  };
}

function recommendationCount(events: BusinessMemoryEvent[], type: BusinessMemoryEvent['type']) {
  const referenceIds = new Set<string>();

  return events.filter((event) => {
    if (event.type !== type) return false;
    if (!event.referenceId) return true;
    if (referenceIds.has(event.referenceId)) return false;

    referenceIds.add(event.referenceId);
    return true;
  }).length;
}

export function buildWeeklyReviewProjection({
  events,
  now = new Date(),
}: BuildWeeklyReviewProjectionInput): WeeklyReviewProjection {
  const windowStart = new Date(now.getTime() - WEEKLY_REVIEW_WINDOW_DAYS * 86_400_000);
  const windowEvents = events
    .filter((event) => {
      const occurredAt = new Date(event.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) return false;

      return occurredAt >= windowStart && occurredAt <= now;
    })
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

  return {
    windowDays: WEEKLY_REVIEW_WINDOW_DAYS,
    windowStart: windowStart.toISOString(),
    windowEnd: now.toISOString(),
    activities: windowEvents.map(eventToActivity),
    completedMissions: windowEvents.filter((event) => event.type === 'MISSION_COMPLETED').length,
    recommendationsIssued: recommendationCount(windowEvents, 'RECOMMENDATION_ISSUED'),
    recommendationsAccepted: recommendationCount(windowEvents, 'RECOMMENDATION_ACCEPTED'),
    recommendationsIgnored: recommendationCount(windowEvents, 'RECOMMENDATION_IGNORED'),
    discussionTurns: windowEvents.filter((event) => event.type === 'DISCUSSION_TURN_COMPLETED').length,
    executionPattern: deriveExecutionPattern(events, now),
    hasActivity: windowEvents.length > 0,
  };
}
