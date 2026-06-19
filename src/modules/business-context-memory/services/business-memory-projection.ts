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

function recommendedFocusFor(input: BuildProjectionInput, blockedAreas: string[]) {
  if (blockedAreas.length > 0) return `先处理：${blockedAreas[0]}`;
  if (input.currentMissionTitle) return input.currentMissionTitle;
  return '继续推进当前最高优先级任务';
}

export function buildBusinessContextProjection(input: BuildProjectionInput): BusinessContextProjection {
  const events = [...input.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const blockedAreas = blockedAreasFor({ ...input, events });
  const completedMilestones = deriveCompletedMilestones({
    completedChecks: input.completedChecks,
    achievementTitles: input.achievementTitles,
    events,
  });
  const currentFocus = input.currentMissionTitle ?? recommendedFocusFor(input, blockedAreas);

  return {
    recentActivities: events.slice(0, 8).map(eventToActivity),
    currentFocus,
    blockedAreas,
    completedMilestones,
    executionPattern: deriveExecutionPattern(events, input.now),
    recommendedFocus: recommendedFocusFor(input, blockedAreas),
    recommendationMemory: buildRecommendationMemory(events),
  };
}
