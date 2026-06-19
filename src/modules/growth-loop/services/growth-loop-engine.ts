import type { GrowthProjection } from '../contracts/GrowthProjection';
import { growthLoopStateService } from './GrowthLoopStateService';
import { buildGrowthProjection } from './growth-projection';

export async function getGrowthProjection(userId: string): Promise<GrowthProjection> {
  const state = await growthLoopStateService.getGrowthLoopState(userId);
  return buildGrowthProjection(state);
}

export const growthLoopEngine = {
  getProjection: getGrowthProjection,
};
