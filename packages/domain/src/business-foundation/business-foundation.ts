import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type BusinessFoundationId = Brand<string, "BusinessFoundationId">;
export type BrandDnaId = Brand<string, "BrandDnaId">;
export type KnowledgeNodeId = Brand<string, "KnowledgeNodeId">;
export type StoryVaultItemId = Brand<string, "StoryVaultItemId">;
export type BusinessMemoryId = Brand<string, "BusinessMemoryId">;
export type ContentMemoryId = Brand<string, "ContentMemoryId">;
export type CustomerMemoryId = Brand<string, "CustomerMemoryId">;
export type BusinessTimelineEventId = Brand<string, "BusinessTimelineEventId">;
export type LearningFoundationRecordId = Brand<
  string,
  "LearningFoundationRecordId"
>;
export type ReflectionFoundationRecordId = Brand<
  string,
  "ReflectionFoundationRecordId"
>;

export type BusinessFoundationLifecycleStage =
  | "draft"
  | "active"
  | "paused"
  | "archived";

export type BusinessFoundationSourceType =
  | "manual"
  | "conversation"
  | "document"
  | "workflow"
  | "system";

export type KnowledgeNodeType =
  | "person"
  | "business"
  | "offer"
  | "audience"
  | "proof"
  | "relationship"
  | "asset"
  | "insight";

export type StoryVaultItemType =
  | "origin"
  | "proof"
  | "customer"
  | "offer"
  | "positioning"
  | "message";

export type BusinessTimelineEventType =
  | "milestone"
  | "decision"
  | "business"
  | "customer"
  | "content"
  | "learning";

export interface BusinessFoundationSource {
  readonly type: BusinessFoundationSourceType;
  readonly referenceId: string;
  readonly summary: string;
  readonly capturedAt: Timestamp;
}

export interface BusinessTwinSnapshot {
  readonly name: string;
  readonly market: string;
  readonly audience: string;
  readonly offer: string;
  readonly valueProposition: string;
  readonly goals: readonly string[];
  readonly priorities: readonly string[];
  readonly lifecycleStage: BusinessFoundationLifecycleStage;
}

export interface BrandDnaSnapshot {
  readonly brandDnaId: BrandDnaId;
  readonly positioning: string;
  readonly promise: string;
  readonly voice: string;
  readonly values: readonly string[];
  readonly differentiators: readonly string[];
  readonly audienceFit: string;
  readonly proofMarkers: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface KnowledgeNodeSnapshot {
  readonly nodeId: KnowledgeNodeId;
  readonly type: KnowledgeNodeType;
  readonly label: string;
  readonly summary: string;
  readonly confidence: number;
  readonly source: BusinessFoundationSource;
  readonly createdAt: Timestamp;
}

export interface KnowledgeRelationshipSnapshot {
  readonly fromNodeId: KnowledgeNodeId;
  readonly toNodeId: KnowledgeNodeId;
  readonly relationshipType: string;
}

export interface StoryVaultItemSnapshot {
  readonly storyId: StoryVaultItemId;
  readonly type: StoryVaultItemType;
  readonly title: string;
  readonly narrative: string;
  readonly linkedNodeIds: readonly KnowledgeNodeId[];
  readonly source: BusinessFoundationSource;
  readonly createdAt: Timestamp;
}

export interface BusinessMemorySnapshot {
  readonly memoryId: BusinessMemoryId;
  readonly title: string;
  readonly fact: string;
  readonly tags: readonly string[];
  readonly source: BusinessFoundationSource;
  readonly createdAt: Timestamp;
}

export interface ContentMemorySnapshot {
  readonly memoryId: ContentMemoryId;
  readonly title: string;
  readonly theme: string;
  readonly observation: string;
  readonly linkedStoryIds: readonly StoryVaultItemId[];
  readonly source: BusinessFoundationSource;
  readonly createdAt: Timestamp;
}

export interface CustomerMemorySnapshot {
  readonly memoryId: CustomerMemoryId;
  readonly segment: string;
  readonly need: string;
  readonly objection?: string;
  readonly offerFit: string;
  readonly source: BusinessFoundationSource;
  readonly createdAt: Timestamp;
}

export interface BusinessTimelineEventSnapshot {
  readonly eventId: BusinessTimelineEventId;
  readonly type: BusinessTimelineEventType;
  readonly title: string;
  readonly occurredAt: Timestamp;
  readonly summary: string;
  readonly source: BusinessFoundationSource;
}

export interface LearningFoundationRecordSnapshot {
  readonly learningId: LearningFoundationRecordId;
  readonly signal: string;
  readonly outcome: string;
  readonly pattern: string;
  readonly sourceEventIds: readonly BusinessTimelineEventId[];
  readonly source: BusinessFoundationSource;
  readonly createdAt: Timestamp;
}

export interface ReflectionFoundationRecordSnapshot {
  readonly reflectionId: ReflectionFoundationRecordId;
  readonly category: string;
  readonly finding: string;
  readonly interpretation: string;
  readonly sourceLearningIds: readonly LearningFoundationRecordId[];
  readonly createdAt: Timestamp;
}

export interface BusinessFoundationSnapshot {
  readonly foundationId: BusinessFoundationId;
  readonly businessId: BusinessId;
  readonly twin: BusinessTwinSnapshot;
  readonly brandDna?: BrandDnaSnapshot;
  readonly knowledgeNodes: readonly KnowledgeNodeSnapshot[];
  readonly knowledgeRelationships: readonly KnowledgeRelationshipSnapshot[];
  readonly storyVault: readonly StoryVaultItemSnapshot[];
  readonly businessMemory: readonly BusinessMemorySnapshot[];
  readonly contentMemory: readonly ContentMemorySnapshot[];
  readonly customerMemory: readonly CustomerMemorySnapshot[];
  readonly timeline: readonly BusinessTimelineEventSnapshot[];
  readonly learning: readonly LearningFoundationRecordSnapshot[];
  readonly reflections: readonly ReflectionFoundationRecordSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateBusinessFoundationInput {
  readonly foundationId: BusinessFoundationId;
  readonly businessId: BusinessId;
  readonly twin: BusinessTwinSnapshot;
  readonly createdAt: Timestamp;
}

export interface BusinessFoundationEventMetadata {
  readonly eventId: EventId;
  readonly eventType: BusinessFoundationEventType;
  readonly aggregateId: BusinessFoundationId;
  readonly aggregateType: "BusinessFoundation";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type BusinessFoundationEventType =
  | "BusinessFoundationCreated"
  | "BusinessFoundationBrandDnaUpdated"
  | "BusinessFoundationRecordAdded";

export type BusinessFoundationRecordType =
  | "knowledge-node"
  | "knowledge-relationship"
  | "story"
  | "business-memory"
  | "content-memory"
  | "customer-memory"
  | "timeline-event"
  | "learning"
  | "reflection";

export interface BusinessFoundationCreatedEvent
  extends BusinessFoundationEventMetadata {
  readonly eventType: "BusinessFoundationCreated";
  readonly payload: {
    readonly foundationId: BusinessFoundationId;
    readonly businessId: BusinessId;
    readonly createdAt: Timestamp;
  };
}

export interface BusinessFoundationBrandDnaUpdatedEvent
  extends BusinessFoundationEventMetadata {
  readonly eventType: "BusinessFoundationBrandDnaUpdated";
  readonly payload: {
    readonly foundationId: BusinessFoundationId;
    readonly businessId: BusinessId;
    readonly brandDnaId: BrandDnaId;
    readonly updatedAt: Timestamp;
  };
}

export interface BusinessFoundationRecordAddedEvent
  extends BusinessFoundationEventMetadata {
  readonly eventType: "BusinessFoundationRecordAdded";
  readonly payload: {
    readonly foundationId: BusinessFoundationId;
    readonly businessId: BusinessId;
    readonly recordType: BusinessFoundationRecordType;
    readonly recordId: string;
  };
}

export type BusinessFoundationDomainEvent =
  | BusinessFoundationCreatedEvent
  | BusinessFoundationBrandDnaUpdatedEvent
  | BusinessFoundationRecordAddedEvent;

export class BusinessFoundation {
  private constructor(private snapshot: BusinessFoundationSnapshot) {}

  static create(input: CreateBusinessFoundationInput): BusinessFoundation {
    const createdAt = createTimestamp(input.createdAt, "createdAt");

    return new BusinessFoundation({
      foundationId: input.foundationId,
      businessId: input.businessId,
      twin: createBusinessTwin(input.twin),
      knowledgeNodes: [],
      knowledgeRelationships: [],
      storyVault: [],
      businessMemory: [],
      contentMemory: [],
      customerMemory: [],
      timeline: [],
      learning: [],
      reflections: [],
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: BusinessFoundationSnapshot): BusinessFoundation {
    validateSnapshot(snapshot);
    return new BusinessFoundation(cloneSnapshot(snapshot));
  }

  get foundationId(): BusinessFoundationId {
    return this.snapshot.foundationId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  updateBrandDna(input: BrandDnaSnapshot): void {
    const brandDna = createBrandDna(input);
    this.replace({
      ...this.snapshot,
      brandDna,
      updatedAt: brandDna.updatedAt,
    });
  }

  addKnowledgeNode(input: KnowledgeNodeSnapshot): void {
    const node = createKnowledgeNode(input);
    this.assertUnique(
      this.snapshot.knowledgeNodes.some((item) => item.nodeId === node.nodeId),
      "Knowledge node already exists."
    );
    this.replace({
      ...this.snapshot,
      knowledgeNodes: [...this.snapshot.knowledgeNodes, node],
      updatedAt: node.createdAt,
    });
  }

  addKnowledgeRelationship(input: KnowledgeRelationshipSnapshot): void {
    const relationship = createKnowledgeRelationship(input);
    this.assertKnowledgeNodeExists(relationship.fromNodeId);
    this.assertKnowledgeNodeExists(relationship.toNodeId);
    this.assertUnique(
      this.snapshot.knowledgeRelationships.some(
        (item) =>
          item.fromNodeId === relationship.fromNodeId &&
          item.toNodeId === relationship.toNodeId &&
          item.relationshipType === relationship.relationshipType
      ),
      "Knowledge relationship already exists."
    );
    this.replace({
      ...this.snapshot,
      knowledgeRelationships: [
        ...this.snapshot.knowledgeRelationships,
        relationship,
      ],
    });
  }

  addStory(input: StoryVaultItemSnapshot): void {
    const story = createStoryVaultItem(input);
    story.linkedNodeIds.forEach((nodeId) => this.assertKnowledgeNodeExists(nodeId));
    this.assertUnique(
      this.snapshot.storyVault.some((item) => item.storyId === story.storyId),
      "Story already exists."
    );
    this.replace({
      ...this.snapshot,
      storyVault: [...this.snapshot.storyVault, story],
      updatedAt: story.createdAt,
    });
  }

  addBusinessMemory(input: BusinessMemorySnapshot): void {
    const memory = createBusinessMemory(input);
    this.assertUnique(
      this.snapshot.businessMemory.some(
        (item) => item.memoryId === memory.memoryId
      ),
      "Business memory already exists."
    );
    this.replace({
      ...this.snapshot,
      businessMemory: [...this.snapshot.businessMemory, memory],
      updatedAt: memory.createdAt,
    });
  }

  addContentMemory(input: ContentMemorySnapshot): void {
    const memory = createContentMemory(input);
    memory.linkedStoryIds.forEach((storyId) => this.assertStoryExists(storyId));
    this.assertUnique(
      this.snapshot.contentMemory.some(
        (item) => item.memoryId === memory.memoryId
      ),
      "Content memory already exists."
    );
    this.replace({
      ...this.snapshot,
      contentMemory: [...this.snapshot.contentMemory, memory],
      updatedAt: memory.createdAt,
    });
  }

  addCustomerMemory(input: CustomerMemorySnapshot): void {
    const memory = createCustomerMemory(input);
    this.assertUnique(
      this.snapshot.customerMemory.some(
        (item) => item.memoryId === memory.memoryId
      ),
      "Customer memory already exists."
    );
    this.replace({
      ...this.snapshot,
      customerMemory: [...this.snapshot.customerMemory, memory],
      updatedAt: memory.createdAt,
    });
  }

  addTimelineEvent(input: BusinessTimelineEventSnapshot): void {
    const event = createTimelineEvent(input);
    this.assertUnique(
      this.snapshot.timeline.some((item) => item.eventId === event.eventId),
      "Timeline event already exists."
    );
    this.replace({
      ...this.snapshot,
      timeline: [...this.snapshot.timeline, event].sort(compareTimelineEvents),
      updatedAt: event.occurredAt,
    });
  }

  addLearning(input: LearningFoundationRecordSnapshot): void {
    const learning = createLearningRecord(input);
    learning.sourceEventIds.forEach((eventId) => this.assertTimelineEventExists(eventId));
    this.assertUnique(
      this.snapshot.learning.some(
        (item) => item.learningId === learning.learningId
      ),
      "Learning record already exists."
    );
    this.replace({
      ...this.snapshot,
      learning: [...this.snapshot.learning, learning],
      updatedAt: learning.createdAt,
    });
  }

  addReflection(input: ReflectionFoundationRecordSnapshot): void {
    const reflection = createReflectionRecord(input);
    reflection.sourceLearningIds.forEach((learningId) =>
      this.assertLearningExists(learningId)
    );
    this.assertUnique(
      this.snapshot.reflections.some(
        (item) => item.reflectionId === reflection.reflectionId
      ),
      "Reflection record already exists."
    );
    this.replace({
      ...this.snapshot,
      reflections: [...this.snapshot.reflections, reflection],
      updatedAt: reflection.createdAt,
    });
  }

  toSnapshot(): BusinessFoundationSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private replace(snapshot: BusinessFoundationSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }

  private assertKnowledgeNodeExists(nodeId: KnowledgeNodeId): void {
    if (!this.snapshot.knowledgeNodes.some((node) => node.nodeId === nodeId)) {
      throw new Error("Knowledge node does not exist.");
    }
  }

  private assertStoryExists(storyId: StoryVaultItemId): void {
    if (!this.snapshot.storyVault.some((story) => story.storyId === storyId)) {
      throw new Error("Story does not exist.");
    }
  }

  private assertTimelineEventExists(eventId: BusinessTimelineEventId): void {
    if (!this.snapshot.timeline.some((event) => event.eventId === eventId)) {
      throw new Error("Timeline event does not exist.");
    }
  }

  private assertLearningExists(learningId: LearningFoundationRecordId): void {
    if (!this.snapshot.learning.some((item) => item.learningId === learningId)) {
      throw new Error("Learning record does not exist.");
    }
  }

  private assertUnique(alreadyExists: boolean, message: string): void {
    if (alreadyExists) {
      throw new Error(message);
    }
  }
}

export function createBusinessTwin(
  input: BusinessTwinSnapshot
): BusinessTwinSnapshot {
  return {
    name: createRequiredString(input.name, "Business twin name"),
    market: createRequiredString(input.market, "Business twin market"),
    audience: createRequiredString(input.audience, "Business twin audience"),
    offer: createRequiredString(input.offer, "Business twin offer"),
    valueProposition: createRequiredString(
      input.valueProposition,
      "Business twin value proposition"
    ),
    goals: createRequiredStringList(input.goals, "Business twin goals"),
    priorities: createRequiredStringList(
      input.priorities,
      "Business twin priorities"
    ),
    lifecycleStage: createLifecycleStage(input.lifecycleStage),
  };
}

export function createBrandDna(input: BrandDnaSnapshot): BrandDnaSnapshot {
  return {
    brandDnaId: input.brandDnaId,
    positioning: createRequiredString(input.positioning, "Brand positioning"),
    promise: createRequiredString(input.promise, "Brand promise"),
    voice: createRequiredString(input.voice, "Brand voice"),
    values: createRequiredStringList(input.values, "Brand values"),
    differentiators: createRequiredStringList(
      input.differentiators,
      "Brand differentiators"
    ),
    audienceFit: createRequiredString(input.audienceFit, "Brand audience fit"),
    proofMarkers: createRequiredStringList(
      input.proofMarkers,
      "Brand proof markers"
    ),
    updatedAt: createTimestamp(input.updatedAt, "updatedAt"),
  };
}

export function createKnowledgeNode(
  input: KnowledgeNodeSnapshot
): KnowledgeNodeSnapshot {
  return {
    nodeId: input.nodeId,
    type: createKnowledgeNodeType(input.type),
    label: createRequiredString(input.label, "Knowledge node label"),
    summary: createRequiredString(input.summary, "Knowledge node summary"),
    confidence: createConfidence(input.confidence),
    source: createSource(input.source),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

export function createKnowledgeRelationship(
  input: KnowledgeRelationshipSnapshot
): KnowledgeRelationshipSnapshot {
  return {
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    relationshipType: createRequiredString(
      input.relationshipType,
      "Knowledge relationship type"
    ),
  };
}

export function createStoryVaultItem(
  input: StoryVaultItemSnapshot
): StoryVaultItemSnapshot {
  return {
    storyId: input.storyId,
    type: createStoryVaultItemType(input.type),
    title: createRequiredString(input.title, "Story title"),
    narrative: createRequiredString(input.narrative, "Story narrative"),
    linkedNodeIds: [...input.linkedNodeIds],
    source: createSource(input.source),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

export function createBusinessMemory(
  input: BusinessMemorySnapshot
): BusinessMemorySnapshot {
  return {
    memoryId: input.memoryId,
    title: createRequiredString(input.title, "Business memory title"),
    fact: createRequiredString(input.fact, "Business memory fact"),
    tags: createRequiredStringList(input.tags, "Business memory tags"),
    source: createSource(input.source),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

export function createContentMemory(
  input: ContentMemorySnapshot
): ContentMemorySnapshot {
  return {
    memoryId: input.memoryId,
    title: createRequiredString(input.title, "Content memory title"),
    theme: createRequiredString(input.theme, "Content memory theme"),
    observation: createRequiredString(
      input.observation,
      "Content memory observation"
    ),
    linkedStoryIds: [...input.linkedStoryIds],
    source: createSource(input.source),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

export function createCustomerMemory(
  input: CustomerMemorySnapshot
): CustomerMemorySnapshot {
  return {
    memoryId: input.memoryId,
    segment: createRequiredString(input.segment, "Customer segment"),
    need: createRequiredString(input.need, "Customer need"),
    objection:
      input.objection === undefined
        ? undefined
        : createRequiredString(input.objection, "Customer objection"),
    offerFit: createRequiredString(input.offerFit, "Customer offer fit"),
    source: createSource(input.source),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

export function createTimelineEvent(
  input: BusinessTimelineEventSnapshot
): BusinessTimelineEventSnapshot {
  return {
    eventId: input.eventId,
    type: createTimelineEventType(input.type),
    title: createRequiredString(input.title, "Timeline event title"),
    occurredAt: createTimestamp(input.occurredAt, "occurredAt"),
    summary: createRequiredString(input.summary, "Timeline event summary"),
    source: createSource(input.source),
  };
}

export function createLearningRecord(
  input: LearningFoundationRecordSnapshot
): LearningFoundationRecordSnapshot {
  return {
    learningId: input.learningId,
    signal: createRequiredString(input.signal, "Learning signal"),
    outcome: createRequiredString(input.outcome, "Learning outcome"),
    pattern: createRequiredString(input.pattern, "Learning pattern"),
    sourceEventIds: [...input.sourceEventIds],
    source: createSource(input.source),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

export function createReflectionRecord(
  input: ReflectionFoundationRecordSnapshot
): ReflectionFoundationRecordSnapshot {
  return {
    reflectionId: input.reflectionId,
    category: createRequiredString(input.category, "Reflection category"),
    finding: createRequiredString(input.finding, "Reflection finding"),
    interpretation: createRequiredString(
      input.interpretation,
      "Reflection interpretation"
    ),
    sourceLearningIds: [...input.sourceLearningIds],
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

export function createSource(
  input: BusinessFoundationSource
): BusinessFoundationSource {
  return {
    type: createSourceType(input.type),
    referenceId: createRequiredString(input.referenceId, "Source reference ID"),
    summary: createRequiredString(input.summary, "Source summary"),
    capturedAt: createTimestamp(input.capturedAt, "capturedAt"),
  };
}

function validateSnapshot(snapshot: BusinessFoundationSnapshot): void {
  createBusinessTwin(snapshot.twin);
  if (snapshot.brandDna) createBrandDna(snapshot.brandDna);
  snapshot.knowledgeNodes.forEach(createKnowledgeNode);
  snapshot.knowledgeRelationships.forEach(createKnowledgeRelationship);
  snapshot.storyVault.forEach(createStoryVaultItem);
  snapshot.businessMemory.forEach(createBusinessMemory);
  snapshot.contentMemory.forEach(createContentMemory);
  snapshot.customerMemory.forEach(createCustomerMemory);
  snapshot.timeline.forEach(createTimelineEvent);
  snapshot.learning.forEach(createLearningRecord);
  snapshot.reflections.forEach(createReflectionRecord);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
}

function cloneSnapshot(
  snapshot: BusinessFoundationSnapshot
): BusinessFoundationSnapshot {
  return {
    ...snapshot,
    twin: {
      ...snapshot.twin,
      goals: [...snapshot.twin.goals],
      priorities: [...snapshot.twin.priorities],
    },
    brandDna:
      snapshot.brandDna === undefined
        ? undefined
        : {
            ...snapshot.brandDna,
            values: [...snapshot.brandDna.values],
            differentiators: [...snapshot.brandDna.differentiators],
            proofMarkers: [...snapshot.brandDna.proofMarkers],
          },
    knowledgeNodes: snapshot.knowledgeNodes.map((node) => ({
      ...node,
      source: { ...node.source },
    })),
    knowledgeRelationships: snapshot.knowledgeRelationships.map((item) => ({
      ...item,
    })),
    storyVault: snapshot.storyVault.map((story) => ({
      ...story,
      linkedNodeIds: [...story.linkedNodeIds],
      source: { ...story.source },
    })),
    businessMemory: snapshot.businessMemory.map((memory) => ({
      ...memory,
      tags: [...memory.tags],
      source: { ...memory.source },
    })),
    contentMemory: snapshot.contentMemory.map((memory) => ({
      ...memory,
      linkedStoryIds: [...memory.linkedStoryIds],
      source: { ...memory.source },
    })),
    customerMemory: snapshot.customerMemory.map((memory) => ({
      ...memory,
      source: { ...memory.source },
    })),
    timeline: snapshot.timeline.map((event) => ({
      ...event,
      source: { ...event.source },
    })),
    learning: snapshot.learning.map((record) => ({
      ...record,
      sourceEventIds: [...record.sourceEventIds],
      source: { ...record.source },
    })),
    reflections: snapshot.reflections.map((record) => ({
      ...record,
      sourceLearningIds: [...record.sourceLearningIds],
    })),
  };
}

function createRequiredString(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function createRequiredStringList(
  values: readonly string[],
  label: string
): readonly string[] {
  if (values.length === 0) {
    throw new Error(`${label} must include at least one value.`);
  }
  return values.map((value) => createRequiredString(value, label));
}

function createTimestamp(value: Timestamp, label: string): Timestamp {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be a valid timestamp.`);
  }
  return value;
}

function createConfidence(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Knowledge confidence must be between 0 and 1.");
  }
  return value;
}

function createLifecycleStage(
  value: BusinessFoundationLifecycleStage
): BusinessFoundationLifecycleStage {
  if (!["draft", "active", "paused", "archived"].includes(value)) {
    throw new Error("Business foundation lifecycle stage is invalid.");
  }
  return value;
}

function createSourceType(
  value: BusinessFoundationSourceType
): BusinessFoundationSourceType {
  if (!["manual", "conversation", "document", "workflow", "system"].includes(value)) {
    throw new Error("Business foundation source type is invalid.");
  }
  return value;
}

function createKnowledgeNodeType(value: KnowledgeNodeType): KnowledgeNodeType {
  if (
    ![
      "person",
      "business",
      "offer",
      "audience",
      "proof",
      "relationship",
      "asset",
      "insight",
    ].includes(value)
  ) {
    throw new Error("Knowledge node type is invalid.");
  }
  return value;
}

function createStoryVaultItemType(
  value: StoryVaultItemType
): StoryVaultItemType {
  if (
    !["origin", "proof", "customer", "offer", "positioning", "message"].includes(
      value
    )
  ) {
    throw new Error("Story vault item type is invalid.");
  }
  return value;
}

function createTimelineEventType(
  value: BusinessTimelineEventType
): BusinessTimelineEventType {
  if (
    !["milestone", "decision", "business", "customer", "content", "learning"].includes(
      value
    )
  ) {
    throw new Error("Timeline event type is invalid.");
  }
  return value;
}

function compareTimelineEvents(
  left: BusinessTimelineEventSnapshot,
  right: BusinessTimelineEventSnapshot
): number {
  return Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
}
