import { buildEvolutionSnapshot } from '../adapters/evolution-adapter';
import type { EvolutionSnapshot } from '../types/evolution-snapshot';

export interface EvolutionProjection {
  getSnapshot(userId: string): Promise<EvolutionSnapshot>;
}

export const evolutionProjection: EvolutionProjection = {
  async getSnapshot(userId: string) {
    return buildEvolutionSnapshot({ userId });
  },
};
