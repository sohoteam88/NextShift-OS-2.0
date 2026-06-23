import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';

export type AICOORequestContext = {
  businessState?: BusinessState;
  missionAuthority?: MissionAuthoritySnapshot;
};
