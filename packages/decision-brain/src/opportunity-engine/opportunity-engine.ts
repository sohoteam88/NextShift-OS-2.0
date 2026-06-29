import type { DecisionContext } from "../context";
import type { Opportunity } from "./opportunity";

export interface OpportunityEngine {
  identify(context: DecisionContext): readonly Opportunity[];
}

export type OpportunityEnginePort = OpportunityEngine;
