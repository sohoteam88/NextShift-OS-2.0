import type { GrowthLoopState } from '../contracts/GrowthLoopState';
import { assembleGrowthLoopState } from '../adapters/GrowthLoopAssembler';

export const growthLoopStateService = {
  async getGrowthLoopState(userId: string): Promise<GrowthLoopState> {
    return assembleGrowthLoopState(userId);
  },
};

export async function getGrowthLoopState(userId: string): Promise<GrowthLoopState> {
  return growthLoopStateService.getGrowthLoopState(userId);
}
