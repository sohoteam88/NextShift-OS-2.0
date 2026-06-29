import type { DecisionContext } from "../context";
import type { Recommendation } from "./recommendation";

export interface RecommendationEngine {
  generate(context: DecisionContext): readonly Recommendation[];
}

export type RecommendationEnginePort = RecommendationEngine;
