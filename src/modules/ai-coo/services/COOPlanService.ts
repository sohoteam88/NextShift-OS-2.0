import type { COOPlan } from '../contracts/COOPlan';
import { assembleCOOPlan } from '../adapters/COOPlanAssembler';

export const cooPlanService = {
  async getCOOPlan(userId: string): Promise<COOPlan> {
    return assembleCOOPlan(userId);
  },
};

export async function getCOOPlan(userId: string): Promise<COOPlan> {
  return cooPlanService.getCOOPlan(userId);
}
