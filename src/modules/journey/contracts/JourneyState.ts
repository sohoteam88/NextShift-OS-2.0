import type { JourneyMilestone } from './JourneyMilestone';
import type { JourneyMission } from './JourneyMission';
import type { JourneyNextAction } from './JourneyNextAction';
import type { JourneyStage } from './JourneyStage';
import type { RevenueProgress } from './RevenueProgress';

export interface JourneyState {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  stage: JourneyStage;
  milestones: JourneyMilestone[];
  missions: JourneyMission[];
  nextAction: JourneyNextAction;
  revenueProgress: RevenueProgress;
}
