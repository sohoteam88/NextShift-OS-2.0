import type { DecisionContext } from "../context";
import type {
  ConversationEngine,
  DecisionConversation,
} from "../conversation-engine";
import type {
  Opportunity,
  OpportunityEngine,
} from "../opportunity-engine";
import type {
  PrioritizationEngine,
  PrioritizedDecision,
} from "../prioritization-engine";
import type {
  Recommendation,
  RecommendationEngine,
} from "../recommendation-engine";
import type { Risk, RiskEngine } from "../risk-engine";
import {
  createDecisionBrainFailure,
  createDecisionBrainSuccess,
  type DecisionBrainResult,
} from "./decision-brain-result";

export interface DecisionBrainDependencies {
  readonly recommendationEngine: RecommendationEngine;
  readonly opportunityEngine: OpportunityEngine;
  readonly riskEngine: RiskEngine;
  readonly prioritizationEngine: PrioritizationEngine;
  readonly conversationEngine: ConversationEngine;
}

export class DecisionBrain {
  constructor(private readonly dependencies: DecisionBrainDependencies) {}

  generateRecommendations(
    context: DecisionContext
  ): DecisionBrainResult<readonly Recommendation[]> {
    try {
      return createDecisionBrainSuccess(
        freezeList(this.dependencies.recommendationEngine.generate(context))
      );
    } catch (error) {
      return createDecisionBrainFailure("RECOMMENDATION_ENGINE_FAILED", error);
    }
  }

  identifyOpportunities(
    context: DecisionContext
  ): DecisionBrainResult<readonly Opportunity[]> {
    try {
      return createDecisionBrainSuccess(
        freezeList(this.dependencies.opportunityEngine.identify(context))
      );
    } catch (error) {
      return createDecisionBrainFailure("OPPORTUNITY_ENGINE_FAILED", error);
    }
  }

  assessRisks(context: DecisionContext): DecisionBrainResult<readonly Risk[]> {
    try {
      return createDecisionBrainSuccess(
        freezeList(this.dependencies.riskEngine.assess(context))
      );
    } catch (error) {
      return createDecisionBrainFailure("RISK_ENGINE_FAILED", error);
    }
  }

  prioritizeDecisions(
    context: DecisionContext
  ): DecisionBrainResult<readonly PrioritizedDecision[]> {
    try {
      return createDecisionBrainSuccess(
        freezeList(this.dependencies.prioritizationEngine.prioritize(context))
      );
    } catch (error) {
      return createDecisionBrainFailure("PRIORITIZATION_ENGINE_FAILED", error);
    }
  }

  continueConversation(
    context: DecisionContext
  ): DecisionBrainResult<readonly DecisionConversation[]> {
    try {
      return createDecisionBrainSuccess(
        freezeList(this.dependencies.conversationEngine.continueConversation(context))
      );
    } catch (error) {
      return createDecisionBrainFailure("CONVERSATION_ENGINE_FAILED", error);
    }
  }
}

function freezeList<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}
