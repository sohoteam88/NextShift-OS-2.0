import type { JourneyState } from '../contracts/JourneyState';

export type JourneyProgressViewModelInput = {
  userId: string;
  name: string;
  lastActivityAt: Date | null;
  now?: number;
};

export type JourneyProgressViewModel = {
  userId: string;
  name: string;
  progressPercent: number;
  currentStageId: string | null;
  currentStageName: string;
  daysSinceLastActivity: number | null;
  stalled: boolean;
};

const STAGE_LABELS: Record<JourneyState['stage'], string> = {
  brand_foundation: '品牌基础',
  audience_validation: '受众验证',
  offer_creation: '产品与漏斗',
  content_activation: '内容启动',
  lead_generation: '潜在客户开发',
  customer_acquisition: '客户获取',
  team_growth: '团队成长',
  scale: '规模化',
};

function progressFromMilestones(state: JourneyState): number {
  if (state.milestones.length === 0) return 0;
  const completed = state.milestones.filter((milestone) => milestone.completed).length;
  return Math.round((completed / state.milestones.length) * 100);
}

export function toJourneyProgressViewModel(
  state: JourneyState,
  input: JourneyProgressViewModelInput,
): JourneyProgressViewModel {
  const now = input.now ?? Date.now();
  const daysSinceLastActivity = input.lastActivityAt
    ? Math.floor((now - input.lastActivityAt.getTime()) / 86_400_000)
    : null;

  return {
    userId: input.userId,
    name: input.name,
    progressPercent: progressFromMilestones(state),
    currentStageId: state.stage,
    currentStageName: STAGE_LABELS[state.stage],
    daysSinceLastActivity,
    stalled: typeof daysSinceLastActivity === 'number' && daysSinceLastActivity > 3,
  };
}
