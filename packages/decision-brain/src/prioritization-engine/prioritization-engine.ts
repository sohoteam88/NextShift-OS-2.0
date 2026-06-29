import type { DecisionContext } from "../context";
import type { PrioritizedDecision } from "./prioritized-decision";

export interface PrioritizationEngine {
  prioritize(context: DecisionContext): readonly PrioritizedDecision[];
}

export type PrioritizationEnginePort = PrioritizationEngine;
