import type { BusinessId } from "@nextshift/shared";
import type { BusinessBrainV1Id } from "../business-brain-v1";
import { DecisionEngineV1 } from "./decision-engine-v1";
import type {
  DecisionEngineV1Id,
  DecisionEngineV1Snapshot,
} from "./decision-engine-v1";
import type { DecisionEngineV1Repository } from "./decision-engine-v1-repository";

export class InMemoryDecisionEngineV1Repository
  implements DecisionEngineV1Repository
{
  private readonly engines = new Map<
    DecisionEngineV1Id,
    DecisionEngineV1Snapshot
  >();

  async save(engine: DecisionEngineV1): Promise<void> {
    const snapshot = engine.toSnapshot();
    this.engines.set(snapshot.engineId, cloneSnapshot(snapshot));
  }

  async findById(
    engineId: DecisionEngineV1Id
  ): Promise<DecisionEngineV1 | null> {
    const snapshot = this.engines.get(engineId);
    return snapshot ? DecisionEngineV1.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly DecisionEngineV1[]> {
    return [...this.engines.values()]
      .filter((snapshot) => snapshot.businessId === businessId)
      .sort(compareEngines)
      .map((snapshot) => DecisionEngineV1.rehydrate(snapshot));
  }

  async findLatestByBrainId(
    brainId: BusinessBrainV1Id
  ): Promise<DecisionEngineV1 | null> {
    const snapshot = [...this.engines.values()]
      .filter((item) => item.brainId === brainId)
      .sort(compareEngines)
      .at(-1);

    return snapshot ? DecisionEngineV1.rehydrate(snapshot) : null;
  }

  async exists(engineId: DecisionEngineV1Id): Promise<boolean> {
    return this.engines.has(engineId);
  }
}

function compareEngines(
  left: DecisionEngineV1Snapshot,
  right: DecisionEngineV1Snapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: DecisionEngineV1Snapshot
): DecisionEngineV1Snapshot {
  return DecisionEngineV1.rehydrate(snapshot).toSnapshot();
}
