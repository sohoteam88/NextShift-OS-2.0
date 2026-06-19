import type { JourneyState } from '../contracts/JourneyState';
import { assembleJourneyState } from '../adapters/JourneyStateAssembler';

export const journeyStateService = {
  async getJourneyState(userId: string): Promise<JourneyState> {
    return assembleJourneyState(userId);
  },
};

export async function getJourneyState(userId: string): Promise<JourneyState> {
  return journeyStateService.getJourneyState(userId);
}
