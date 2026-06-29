import type { DecisionContext } from "../context";
import type { Risk } from "./risk";

export interface RiskEngine {
  assess(context: DecisionContext): readonly Risk[];
}

export type RiskEnginePort = RiskEngine;
