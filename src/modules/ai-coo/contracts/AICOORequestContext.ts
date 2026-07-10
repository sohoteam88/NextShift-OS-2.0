import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { WorkspaceContext } from '@/modules/workspace/types';

export type AICOORequestContext = {
  businessState?: BusinessState;
  missionAuthority?: MissionAuthoritySnapshot;
  workspaceContext?: WorkspaceContext;
};
