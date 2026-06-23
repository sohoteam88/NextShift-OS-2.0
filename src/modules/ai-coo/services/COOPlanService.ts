import type { COOPlan } from '../contracts/COOPlan';
import type { AICOORequestContext } from '../contracts/AICOORequestContext';
import { assembleCOOPlan } from '../adapters/COOPlanAssembler';

export const cooPlanService = {
  async getCOOPlan(userId: string, context?: AICOORequestContext): Promise<COOPlan> {
    return assembleCOOPlan(userId, context);
  },
};

export async function getCOOPlan(userId: string, context?: AICOORequestContext): Promise<COOPlan> {
  return cooPlanService.getCOOPlan(userId, context);
}
