import type { DecisionContext } from "../context";
import type { DecisionConversation } from "./decision-conversation";

export interface ConversationEngine {
  continueConversation(context: DecisionContext): readonly DecisionConversation[];
}

export type ConversationEnginePort = ConversationEngine;
