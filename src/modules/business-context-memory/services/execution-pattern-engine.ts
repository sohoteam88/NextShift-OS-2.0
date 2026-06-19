import type { BusinessMemoryEvent, ExecutionPattern } from '../contracts/BusinessContextMemory';

function daysBetween(now: Date, value: string) {
  const occurredAt = new Date(value);
  if (Number.isNaN(occurredAt.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - occurredAt.getTime()) / 86_400_000));
}

export function deriveExecutionPattern(events: BusinessMemoryEvent[], now: Date = new Date()): ExecutionPattern {
  const recentEvents = events.filter((event) => daysBetween(now, event.occurredAt) <= 30);
  const completedCount = recentEvents.filter((event) => event.type === 'MISSION_COMPLETED').length;
  const acceptedCount = recentEvents.filter((event) => event.type === 'RECOMMENDATION_ACCEPTED').length;
  const ignoredCount = recentEvents.filter((event) => event.type === 'RECOMMENDATION_IGNORED').length;
  const activeDays = new Set(recentEvents.map((event) => event.occurredAt.slice(0, 10))).size;

  const activityLevel: ExecutionPattern['activityLevel'] =
    recentEvents.length >= 12 ? 'high_momentum' : recentEvents.length >= 4 ? 'active' : 'quiet';

  const completionVelocity: ExecutionPattern['completionVelocity'] =
    completedCount >= 6 ? 'fast' : completedCount >= 3 ? 'steady' : completedCount >= 1 ? 'slow' : 'none';

  let recommendationResponse: ExecutionPattern['recommendationResponse'] = 'unknown';
  if (acceptedCount || ignoredCount) {
    if (acceptedCount > ignoredCount * 2) recommendationResponse = 'accepting';
    else if (ignoredCount > acceptedCount * 2) recommendationResponse = 'ignoring';
    else recommendationResponse = 'mixed';
  }

  const consistency: ExecutionPattern['consistency'] =
    activeDays >= 8 ? 'high' : activeDays >= 3 ? 'medium' : 'low';

  return {
    activityLevel,
    completionVelocity,
    recommendationResponse,
    consistency,
  };
}
