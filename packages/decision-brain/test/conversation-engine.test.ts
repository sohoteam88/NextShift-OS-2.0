import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  DecisionContext,
  DecisionConversation,
  Opportunity,
  PrioritizedDecision,
  Recommendation,
  Risk,
  createMessageCount,
  type ConversationEngine,
  type ConversationEnginePort,
  type DecisionContextId,
  type DecisionConversationId,
  type OpportunityEngine,
  type PrioritizationEngine,
  type RecommendationEngine,
  type RiskEngine,
} from "../src";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const tenant = { tenantId };
const decisionContextId = "decision-context-1" as DecisionContextId;
const businessContext: BusinessTwinSnapshot = {
  businessId,
  tenant,
  version: 1,
  capturedAt: "2026-06-28T00:00:00.000Z",
  identity: {
    businessName: "NextShift Demo",
    values: ["clarity", "momentum"],
  },
  understanding: {
    executiveSummary: "Business is ready for decision intelligence.",
    strengths: ["Strong analytics baseline"],
    weaknesses: [],
    opportunities: ["Improve next-action selection"],
    missingInformation: [],
    contradictions: [],
    confidence: 0.9,
  },
};

describe("Conversation Engine foundation", () => {
  it("creates a valid decision conversation", () => {
    const conversation = createDecisionConversation();

    expect(conversation.decisionConversationId).toBe("conversation-1");
    expect(conversation.decisionContextId).toBe(decisionContextId);
    expect(conversation.messageCount).toBe(3);
    expect(conversation.toSnapshot()).toEqual({
      decisionConversationId: "conversation-1",
      decisionContextId,
      conversationType: "Advisory",
      title: "Discuss next operating decision",
      summary: "A focused advisory conversation for the next decision cycle.",
      latestMessage: "Which tradeoff matters most for this next action?",
      messageCount: 3,
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:05:00.000Z",
    });
  });

  it("returns immutable defensive snapshots", () => {
    const conversation = createDecisionConversation();
    const firstSnapshot = conversation.toSnapshot();
    const secondSnapshot = conversation.toSnapshot();

    expect(firstSnapshot).not.toBe(secondSnapshot);
    expect(Object.isFrozen(firstSnapshot)).toBe(true);
  });

  it("validates conversation types before IDs", () => {
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        decisionConversationId: "" as DecisionConversationId,
        conversationType: "Unsupported" as never,
      })
    ).toThrow("Unsupported decision conversation type: Unsupported.");
  });

  it("validates required IDs and text fields", () => {
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        decisionConversationId: "" as DecisionConversationId,
      })
    ).toThrow("Decision conversation ID is required.");
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        decisionContextId: "" as DecisionContextId,
      })
    ).toThrow("Decision conversation context ID is required.");
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        title: " ",
      })
    ).toThrow("Decision conversation title is required.");
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        summary: " ",
      })
    ).toThrow("Decision conversation summary is required.");
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        latestMessage: " ",
      })
    ).toThrow("Decision conversation latest message is required.");
  });

  it("validates message counts", () => {
    expect(createMessageCount(0)).toBe(0);
    expect(createMessageCount(4)).toBe(4);
    expect(() => createMessageCount(-1)).toThrow(
      "Decision conversation message count must be a non-negative integer."
    );
    expect(() => createMessageCount(1.5)).toThrow(
      "Decision conversation message count must be a non-negative integer."
    );
    expect(() => createMessageCount(Number.NaN)).toThrow(
      "Decision conversation message count must be a non-negative integer."
    );
  });

  it("validates timestamps", () => {
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        createdAt: "not-a-date",
      })
    ).toThrow("Decision conversation createdAt must be a valid timestamp.");
    expect(() =>
      DecisionConversation.create({
        ...baseDecisionConversationInput(),
        updatedAt: "not-a-date",
      })
    ).toThrow("Decision conversation updatedAt must be a valid timestamp.");
  });

  it("supports the conversation engine contract", () => {
    const context = createDecisionContext();
    const conversation = createDecisionConversation();
    const engine: ConversationEngine = {
      continueConversation(receivedContext) {
        expect(receivedContext).toBe(context);
        return Object.freeze([conversation]);
      },
    };

    const result = engine.continueConversation(context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toEqual([conversation]);
    expectTypeMarker<ConversationEnginePort>();
  });

  it("keeps public exports and previous slice APIs available", () => {
    expect(DecisionConversation).toEqual(expect.any(Function));
    expect(Recommendation).toEqual(expect.any(Function));
    expect(Opportunity).toEqual(expect.any(Function));
    expect(Risk).toEqual(expect.any(Function));
    expect(PrioritizedDecision).toEqual(expect.any(Function));
    expectTypeMarker<DecisionConversationId>();
    expectTypeMarker<ConversationEngine>();
    expectTypeMarker<ConversationEnginePort>();
    expectTypeMarker<RecommendationEngine>();
    expectTypeMarker<OpportunityEngine>();
    expectTypeMarker<RiskEngine>();
    expectTypeMarker<PrioritizationEngine>();
  });
});

function createDecisionConversation() {
  return DecisionConversation.create(baseDecisionConversationInput());
}

function baseDecisionConversationInput() {
  return {
    decisionConversationId: "conversation-1" as DecisionConversationId,
    decisionContextId,
    conversationType: "Advisory" as const,
    title: "Discuss next operating decision",
    summary: "A focused advisory conversation for the next decision cycle.",
    latestMessage: "Which tradeoff matters most for this next action?",
    messageCount: 3,
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:05:00.000Z",
  };
}

function createDecisionContext() {
  return DecisionContext.create({
    decisionContextId,
    businessId,
    tenant,
    businessContext,
    objective: "Choose the highest value next action",
    createdAt: "2026-06-28T00:00:00.000Z",
  });
}

function expectTypeMarker<T>(): void {
  expect(true as T extends unknown ? true : false).toBe(true);
}
