import type { TodayRecommendation } from '../hooks/useDashboardRecommendation';

export function normalizeRecommendationTitle(value: string) {
  return value.trim().toLowerCase();
}

export function isDivergentRecommendation(
  recommendation: TodayRecommendation | null,
  missionTitle: string,
) {
  return recommendation?.source === 'engine'
    && normalizeRecommendationTitle(recommendation.recommendation.title)
      !== normalizeRecommendationTitle(missionTitle);
}

export function mergeMissionReason(missionReason: string, recommendationRationale: string) {
  const mission = missionReason.trim();
  const rationale = recommendationRationale.trim();
  const normalizedMission = mission.toLowerCase();
  const normalizedRationale = rationale.toLowerCase();

  if (!rationale || normalizedMission.includes(normalizedRationale)) return mission;
  if (!mission || normalizedRationale.includes(normalizedMission)) return rationale;
  return `${mission}\n\n${rationale}`;
}
