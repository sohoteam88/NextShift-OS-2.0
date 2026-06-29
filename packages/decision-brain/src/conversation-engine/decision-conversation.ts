import type { Brand, Timestamp } from "@nextshift/shared";
import type { DecisionContextId } from "../context";

export type DecisionConversationId = Brand<string, "DecisionConversationId">;

export type DecisionConversationType =
  | "Advisory"
  | "Planning"
  | "Review"
  | "Analysis"
  | "FollowUp"
  | "Custom";

export interface DecisionConversationSnapshot {
  readonly decisionConversationId: DecisionConversationId;
  readonly decisionContextId: DecisionContextId;
  readonly conversationType: DecisionConversationType;
  readonly title: string;
  readonly summary: string;
  readonly latestMessage: string;
  readonly messageCount: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateDecisionConversationInput {
  readonly decisionConversationId: DecisionConversationId;
  readonly decisionContextId: DecisionContextId;
  readonly conversationType: DecisionConversationType;
  readonly title: string;
  readonly summary: string;
  readonly latestMessage: string;
  readonly messageCount: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

const DECISION_CONVERSATION_TYPES: readonly DecisionConversationType[] =
  Object.freeze(["Advisory", "Planning", "Review", "Analysis", "FollowUp", "Custom"]);

export class DecisionConversation {
  private constructor(private readonly snapshot: DecisionConversationSnapshot) {}

  static create(input: CreateDecisionConversationInput): DecisionConversation {
    assertConversationType(input.conversationType);

    const decisionConversationId = createRequiredId(
      input.decisionConversationId,
      "Decision conversation ID is required."
    ) as DecisionConversationId;
    const decisionContextId = createRequiredId(
      input.decisionContextId,
      "Decision conversation context ID is required."
    ) as DecisionContextId;
    const title = createRequiredText(
      input.title,
      "Decision conversation title is required."
    );
    const summary = createRequiredText(
      input.summary,
      "Decision conversation summary is required."
    );
    const latestMessage = createRequiredText(
      input.latestMessage,
      "Decision conversation latest message is required."
    );
    const messageCount = createMessageCount(input.messageCount);
    const createdAt = createConversationTimestamp(
      input.createdAt,
      "Decision conversation createdAt must be a valid timestamp."
    );
    const updatedAt = createConversationTimestamp(
      input.updatedAt,
      "Decision conversation updatedAt must be a valid timestamp."
    );

    return new DecisionConversation(
      freezeDeep({
        decisionConversationId,
        decisionContextId,
        conversationType: input.conversationType,
        title,
        summary,
        latestMessage,
        messageCount,
        createdAt,
        updatedAt,
      })
    );
  }

  get decisionConversationId(): DecisionConversationId {
    return this.snapshot.decisionConversationId;
  }

  get decisionContextId(): DecisionContextId {
    return this.snapshot.decisionContextId;
  }

  get messageCount(): number {
    return this.snapshot.messageCount;
  }

  toSnapshot(): DecisionConversationSnapshot {
    return freezeDeep({ ...this.snapshot });
  }
}

export function createMessageCount(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Decision conversation message count must be a non-negative integer.");
  }

  return value;
}

function createRequiredId(value: string, message: string): string {
  if (value.trim().length === 0) {
    throw new Error(message);
  }

  return value;
}

function createRequiredText(value: string, message: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(message);
  }

  return normalized;
}

function createConversationTimestamp(value: Timestamp, message: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(message);
  }

  return value;
}

function assertConversationType(value: DecisionConversationType): void {
  if (!DECISION_CONVERSATION_TYPES.includes(value)) {
    throw new Error(`Unsupported decision conversation type: ${value}.`);
  }
}

function freezeDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) {
      freezeDeep(item);
    }

    return Object.freeze(value) as T;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      freezeDeep(child);
    }

    return Object.freeze(value) as T;
  }

  return value;
}
