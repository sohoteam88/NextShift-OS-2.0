import type {
  BusinessContextProjection,
  BusinessMemoryActivity,
  BusinessMemoryEvent,
  RecommendationMemory,
} from '../contracts/BusinessContextMemory';
import { deriveExecutionPattern } from './execution-pattern-engine';
import { deriveCompletedMilestones } from './milestone-history-engine';

type BuildProjectionInput = {
  events: BusinessMemoryEvent[];
  completedChecks?: string[];
  achievementTitles?: string[];
  businessBottlenecks?: Array<{ title?: string; code?: string; domain?: string }>;
  currentMissionTitle?: string;
  currentMissionDescription?: string;
  now?: Date;
};

const DISCUSSION_ATTENTION_THRESHOLD = 3;
const RECENT_DISCUSSION_EVENTS_LIMIT = 30;

export type DiscussionAttention = {
  recommendationId: string;
  title: string;
  turnCount: number;
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

function buildRecommendationMemory(events: BusinessMemoryEvent[]): RecommendationMemory {
  const idsFor = (type: BusinessMemoryEvent['type']) =>
    events
      .filter((event) => event.type === type)
      .map((event) => event.referenceId)
      .filter((value): value is string => Boolean(value));

  return {
    recentlyIssuedIds: idsFor('RECOMMENDATION_ISSUED').slice(0, 10),
    acceptedIds: idsFor('RECOMMENDATION_ACCEPTED').slice(0, 10),
    ignoredIds: idsFor('RECOMMENDATION_IGNORED').slice(0, 10),
  };
}

function blockedAreasFor(input: BuildProjectionInput) {
  const blocked = new Set<string>();

  for (const event of input.events) {
    if (event.type === 'MISSION_BLOCKED') blocked.add(event.title);
  }

  for (const bottleneck of input.businessBottlenecks ?? []) {
    blocked.add(bottleneck.title ?? bottleneck.domain ?? bottleneck.code ?? '未命名阻塞');
  }

  return Array.from(blocked).slice(0, 5);
}

export function discussionAttentionFor(events: BusinessMemoryEvent[]): DiscussionAttention | null {
  const discussions = events
    .filter((event) => event.type === 'DISCUSSION_TURN_COMPLETED' && event.referenceId)
    .slice(0, RECENT_DISCUSSION_EVENTS_LIMIT);
  const attention = new Map<string, { title: string; turnCount: number }>();

  for (const event of discussions) {
    const recommendationId = event.referenceId!;
    const current = attention.get(recommendationId) ?? {
      title: event.title.replace(/^Discussion turn completed:\s*/i, '').trim() || recommendationId,
      turnCount: 0,
    };
    current.turnCount += 1;
    attention.set(recommendationId, current);
  }

  const [recommendationId, result] = [...attention.entries()]
    .filter(([, value]) => value.turnCount >= DISCUSSION_ATTENTION_THRESHOLD)
    .sort(([, left], [, right]) => right.turnCount - left.turnCount)[0] ?? [];

  return recommendationId && result
    ? { recommendationId, title: result.title, turnCount: result.turnCount }
    : null;
}

function recommendedFocusFor(input: BuildProjectionInput, blockedAreas: string[], attention: DiscussionAttention | null) {
  const discussionFocus = attention
    ? `你最近多次讨论过《${attention.title}》，可能才是当前真正的焦点`
    : null;

  if (blockedAreas.length > 0) {
    return discussionFocus ? `先处理：${blockedAreas[0]}；${discussionFocus}` : `先处理：${blockedAreas[0]}`;
  }
  if (discussionFocus && attention?.title !== input.currentMissionTitle) return discussionFocus;
  if (input.currentMissionTitle) return input.currentMissionTitle;
  return '继续推进当前最高优先级任务';
}

export function buildBusinessContextProjection(input: BuildProjectionInput): BusinessContextProjection {
  const events = [...input.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const blockedAreas = blockedAreasFor({ ...input, events });
  const discussionAttention = discussionAttentionFor(events);
  const completedMilestones = deriveCompletedMilestones({
    completedChecks: input.completedChecks,
    achievementTitles: input.achievementTitles,
    events,
  });
  const currentFocus = input.currentMissionTitle ?? recommendedFocusFor(input, blockedAreas, discussionAttention);

  return {
    recentActivities: events.slice(0, 8).map(eventToActivity),
    currentFocus,
    blockedAreas,
    completedMilestones,
    executionPattern: deriveExecutionPattern(events, input.now),
    recommendedFocus: recommendedFocusFor(input, blockedAreas, discussionAttention),
    recommendationMemory: buildRecommendationMemory(events),
  };
}
