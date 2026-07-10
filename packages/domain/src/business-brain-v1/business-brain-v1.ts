import type {
  BusinessFoundationId,
  BusinessFoundationSnapshot,
} from "../business-foundation";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type BusinessBrainV1Id = Brand<string, "BusinessBrainV1Id">;
export type BusinessBrainV1InsightId = Brand<string, "BusinessBrainV1InsightId">;

export type BusinessBrainV1LifecycleStatus =
  | "draft"
  | "assessed"
  | "interpreted"
  | "superseded"
  | "archived";

export type BusinessBrainV1EvidenceSource =
  | "business-twin"
  | "brand-dna"
  | "knowledge-node"
  | "story"
  | "business-memory"
  | "content-memory"
  | "customer-memory"
  | "timeline-event"
  | "learning"
  | "reflection";

export type BusinessBrainV1InsightCategory =
  | "strength"
  | "constraint"
  | "gap"
  | "opportunity-signal"
  | "risk-signal"
  | "readiness";

export type BusinessBrainV1InsightPriority = "low" | "medium" | "high";

export interface BusinessBrainV1EvidenceReference {
  readonly source: BusinessBrainV1EvidenceSource;
  readonly recordId: string;
  readonly summary: string;
}

export interface BusinessBrainV1ContextModel {
  readonly foundationId: BusinessFoundationId;
  readonly businessName: string;
  readonly market: string;
  readonly audience: string;
  readonly offer: string;
  readonly goals: readonly string[];
  readonly priorities: readonly string[];
  readonly brandPositioning?: string;
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
  readonly resolvedAt: Timestamp;
}

export interface BusinessBrainV1Understanding {
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly constraints: readonly string[];
  readonly missingInformation: readonly string[];
  readonly contradictions: readonly string[];
  readonly confidence: number;
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
}

export interface BusinessBrainV1Insight {
  readonly insightId: BusinessBrainV1InsightId;
  readonly category: BusinessBrainV1InsightCategory;
  readonly priority: BusinessBrainV1InsightPriority;
  readonly title: string;
  readonly summary: string;
  readonly rationale: string;
  readonly confidence: number;
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
  readonly createdAt: Timestamp;
}

export interface BusinessBrainV1ReasoningStep {
  readonly name: string;
  readonly input: string;
  readonly output: string;
}

export interface BusinessBrainV1ReasoningPipeline {
  readonly steps: readonly BusinessBrainV1ReasoningStep[];
  readonly completedAt: Timestamp;
}

export interface BusinessBrainV1StateAssessment {
  readonly readinessScore: number;
  readonly operatingHealth: "weak" | "developing" | "strong";
  readonly strategicClarity: "low" | "medium" | "high";
  readonly customerClarity: "low" | "medium" | "high";
  readonly contentReadiness: "low" | "medium" | "high";
  readonly knowledgeCompleteness: "low" | "medium" | "high";
  readonly gaps: readonly string[];
  readonly constraints: readonly string[];
}

export interface BusinessBrainV1SituationAnalysis {
  readonly summary: string;
  readonly recentSignals: readonly string[];
  readonly activeConstraints: readonly string[];
  readonly relevantEvidence: readonly BusinessBrainV1EvidenceReference[];
}

export interface BusinessBrainV1Interpretation {
  readonly meaning: string;
  readonly rationale: string;
  readonly uncertainty: readonly string[];
  readonly downstreamImplications: readonly string[];
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
}

export interface BusinessBrainV1Snapshot {
  readonly brainId: BusinessBrainV1Id;
  readonly businessId: BusinessId;
  readonly foundationId: BusinessFoundationId;
  readonly context: BusinessBrainV1ContextModel;
  readonly understanding: BusinessBrainV1Understanding;
  readonly insights: readonly BusinessBrainV1Insight[];
  readonly reasoningPipeline: BusinessBrainV1ReasoningPipeline;
  readonly stateAssessment: BusinessBrainV1StateAssessment;
  readonly situationAnalysis: BusinessBrainV1SituationAnalysis;
  readonly interpretation: BusinessBrainV1Interpretation;
  readonly lifecycleStatus: BusinessBrainV1LifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly supersededAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateBusinessBrainV1Input {
  readonly brainId: BusinessBrainV1Id;
  readonly foundation: BusinessFoundationSnapshot;
  readonly createdAt: Timestamp;
}

export interface BusinessBrainV1EventMetadata {
  readonly eventId: EventId;
  readonly eventType: BusinessBrainV1EventType;
  readonly aggregateId: BusinessBrainV1Id;
  readonly aggregateType: "BusinessBrainV1";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type BusinessBrainV1EventType =
  | "BusinessBrainV1Created"
  | "BusinessBrainV1Superseded"
  | "BusinessBrainV1Archived";

export interface BusinessBrainV1CreatedEvent
  extends BusinessBrainV1EventMetadata {
  readonly eventType: "BusinessBrainV1Created";
  readonly payload: {
    readonly brainId: BusinessBrainV1Id;
    readonly businessId: BusinessId;
    readonly foundationId: BusinessFoundationId;
    readonly insightCount: number;
    readonly createdAt: Timestamp;
  };
}

export interface BusinessBrainV1SupersededEvent
  extends BusinessBrainV1EventMetadata {
  readonly eventType: "BusinessBrainV1Superseded";
  readonly payload: {
    readonly brainId: BusinessBrainV1Id;
    readonly supersededAt: Timestamp;
  };
}

export interface BusinessBrainV1ArchivedEvent
  extends BusinessBrainV1EventMetadata {
  readonly eventType: "BusinessBrainV1Archived";
  readonly payload: {
    readonly brainId: BusinessBrainV1Id;
    readonly archivedAt: Timestamp;
  };
}

export type BusinessBrainV1DomainEvent =
  | BusinessBrainV1CreatedEvent
  | BusinessBrainV1SupersededEvent
  | BusinessBrainV1ArchivedEvent;

export class BusinessBrainV1 {
  private constructor(private snapshot: BusinessBrainV1Snapshot) {}

  static create(input: CreateBusinessBrainV1Input): BusinessBrainV1 {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    const context = resolveBusinessBrainV1Context(input.foundation, createdAt);
    const understanding = createBusinessBrainV1Understanding(context);
    const stateAssessment = assessBusinessBrainV1State(input.foundation, context);
    const situationAnalysis = analyzeBusinessBrainV1Situation(
      input.foundation,
      context,
      stateAssessment
    );
    const interpretation = interpretBusinessBrainV1State(
      understanding,
      stateAssessment,
      situationAnalysis
    );
    const insights = createBusinessBrainV1Insights(
      input.brainId,
      understanding,
      stateAssessment,
      situationAnalysis,
      createdAt
    );

    return new BusinessBrainV1({
      brainId: input.brainId,
      businessId: input.foundation.businessId,
      foundationId: input.foundation.foundationId,
      context,
      understanding,
      insights,
      reasoningPipeline: createReasoningPipeline(createdAt),
      stateAssessment,
      situationAnalysis,
      interpretation,
      lifecycleStatus: "interpreted",
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: BusinessBrainV1Snapshot): BusinessBrainV1 {
    validateSnapshot(snapshot);
    return new BusinessBrainV1(cloneSnapshot(snapshot));
  }

  get brainId(): BusinessBrainV1Id {
    return this.snapshot.brainId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get foundationId(): BusinessFoundationId {
    return this.snapshot.foundationId;
  }

  get lifecycleStatus(): BusinessBrainV1LifecycleStatus {
    return this.snapshot.lifecycleStatus;
  }

  supersede(supersededAt: Timestamp): void {
    const timestamp = createTimestamp(supersededAt, "supersededAt");
    this.replace({
      ...this.snapshot,
      lifecycleStatus: "superseded",
      supersededAt: timestamp,
      updatedAt: timestamp,
    });
  }

  archive(archivedAt: Timestamp): void {
    const timestamp = createTimestamp(archivedAt, "archivedAt");
    this.replace({
      ...this.snapshot,
      lifecycleStatus: "archived",
      archivedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  toSnapshot(): BusinessBrainV1Snapshot {
    return cloneSnapshot(this.snapshot);
  }

  private replace(snapshot: BusinessBrainV1Snapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function resolveBusinessBrainV1Context(
  foundation: BusinessFoundationSnapshot,
  resolvedAt: Timestamp
): BusinessBrainV1ContextModel {
  return {
    foundationId: foundation.foundationId,
    businessName: createRequiredString(foundation.twin.name, "Business name"),
    market: createRequiredString(foundation.twin.market, "Business market"),
    audience: createRequiredString(foundation.twin.audience, "Business audience"),
    offer: createRequiredString(foundation.twin.offer, "Business offer"),
    goals: [...foundation.twin.goals],
    priorities: [...foundation.twin.priorities],
    brandPositioning: foundation.brandDna?.positioning,
    evidence: createEvidenceReferences(foundation),
    resolvedAt: createTimestamp(resolvedAt, "resolvedAt"),
  };
}

export function createBusinessBrainV1Understanding(
  context: BusinessBrainV1ContextModel
): BusinessBrainV1Understanding {
  const hasBrand = context.brandPositioning !== undefined;
  const evidenceCount = context.evidence.length;

  return {
    summary: `${context.businessName} serves ${context.audience} in ${context.market} with ${context.offer}.`,
    strengths: [
      `Clear offer: ${context.offer}`,
      ...context.priorities.map((priority) => `Priority: ${priority}`),
    ],
    constraints:
      evidenceCount < 6
        ? ["Business Brain has limited foundation evidence."]
        : [],
    missingInformation: hasBrand ? [] : ["Brand DNA positioning is missing."],
    contradictions: [],
    confidence: clampConfidence(hasBrand ? 0.85 : 0.68),
    evidence: context.evidence,
  };
}

export function assessBusinessBrainV1State(
  foundation: BusinessFoundationSnapshot,
  context: BusinessBrainV1ContextModel
): BusinessBrainV1StateAssessment {
  const evidenceScore = Math.min(context.evidence.length / 10, 1);
  const readinessScore = Math.round(
    (evidenceScore * 60 + (foundation.brandDna ? 20 : 0) + 20) * 100
  ) / 100;

  return {
    readinessScore,
    operatingHealth:
      readinessScore >= 80 ? "strong" : readinessScore >= 55 ? "developing" : "weak",
    strategicClarity: context.goals.length > 0 ? "high" : "low",
    customerClarity: foundation.customerMemory.length > 0 ? "high" : "medium",
    contentReadiness: foundation.contentMemory.length > 0 ? "high" : "medium",
    knowledgeCompleteness:
      foundation.knowledgeNodes.length >= 2 ? "high" : "medium",
    gaps: [
      ...(foundation.brandDna ? [] : ["Brand DNA is missing."]),
      ...(foundation.customerMemory.length > 0
        ? []
        : ["Customer memory is not yet populated."]),
    ],
    constraints: foundation.businessMemory.map((memory) => memory.fact),
  };
}

export function analyzeBusinessBrainV1Situation(
  foundation: BusinessFoundationSnapshot,
  context: BusinessBrainV1ContextModel,
  stateAssessment: BusinessBrainV1StateAssessment
): BusinessBrainV1SituationAnalysis {
  return {
    summary: `${context.businessName} is ${stateAssessment.operatingHealth} with ${stateAssessment.strategicClarity} strategic clarity.`,
    recentSignals: [
      ...foundation.timeline.slice(-3).map((event) => event.summary),
      ...foundation.learning.slice(-3).map((learning) => learning.pattern),
      ...foundation.reflections.slice(-3).map((reflection) => reflection.finding),
    ],
    activeConstraints: stateAssessment.constraints,
    relevantEvidence: context.evidence.slice(0, 12),
  };
}

export function interpretBusinessBrainV1State(
  understanding: BusinessBrainV1Understanding,
  stateAssessment: BusinessBrainV1StateAssessment,
  situationAnalysis: BusinessBrainV1SituationAnalysis
): BusinessBrainV1Interpretation {
  return {
    meaning: `${understanding.summary} Current readiness is ${stateAssessment.readinessScore}.`,
    rationale: situationAnalysis.summary,
    uncertainty: [
      ...understanding.missingInformation,
      ...understanding.contradictions,
    ],
    downstreamImplications: [
      "Decision Engine can consume readiness, gaps, constraints, and insights later.",
      "Conversation Engine can ask for missing evidence later.",
    ],
    evidence: situationAnalysis.relevantEvidence,
  };
}

function createBusinessBrainV1Insights(
  brainId: BusinessBrainV1Id,
  understanding: BusinessBrainV1Understanding,
  stateAssessment: BusinessBrainV1StateAssessment,
  situationAnalysis: BusinessBrainV1SituationAnalysis,
  createdAt: Timestamp
): readonly BusinessBrainV1Insight[] {
  const readinessInsight: BusinessBrainV1Insight = {
    insightId: `${brainId}:readiness` as BusinessBrainV1InsightId,
    category: "readiness",
    priority: stateAssessment.readinessScore >= 75 ? "medium" : "high",
    title: "Business readiness assessment",
    summary: situationAnalysis.summary,
    rationale: `Readiness score is ${stateAssessment.readinessScore}.`,
    confidence: understanding.confidence,
    evidence: situationAnalysis.relevantEvidence,
    createdAt,
  };

  const gapInsights = stateAssessment.gaps.map((gap, index) => ({
    insightId: `${brainId}:gap:${index + 1}` as BusinessBrainV1InsightId,
    category: "gap" as const,
    priority: "medium" as const,
    title: "Business context gap",
    summary: gap,
    rationale: "Business Brain identified missing foundation evidence.",
    confidence: understanding.confidence,
    evidence: understanding.evidence,
    createdAt,
  }));

  return [readinessInsight, ...gapInsights];
}

function createReasoningPipeline(
  completedAt: Timestamp
): BusinessBrainV1ReasoningPipeline {
  return {
    steps: [
      {
        name: "Business Context Resolution",
        input: "Business Foundation snapshot",
        output: "Resolved business context model",
      },
      {
        name: "Business State Assessment",
        input: "Resolved business context model",
        output: "Readiness, clarity, gaps, and constraints",
      },
      {
        name: "Business Situation Analysis",
        input: "State assessment and foundation signals",
        output: "Current business situation",
      },
      {
        name: "Business Interpretation",
        input: "Understanding, state, and situation",
        output: "Interpretation and downstream implications",
      },
    ],
    completedAt,
  };
}

function createEvidenceReferences(
  foundation: BusinessFoundationSnapshot
): readonly BusinessBrainV1EvidenceReference[] {
  return [
    {
      source: "business-twin",
      recordId: foundation.foundationId,
      summary: foundation.twin.name,
    },
    ...(foundation.brandDna
      ? [
          {
            source: "brand-dna" as const,
            recordId: foundation.brandDna.brandDnaId,
            summary: foundation.brandDna.positioning,
          },
        ]
      : []),
    ...foundation.knowledgeNodes.map((node) => ({
      source: "knowledge-node" as const,
      recordId: node.nodeId,
      summary: node.summary,
    })),
    ...foundation.storyVault.map((story) => ({
      source: "story" as const,
      recordId: story.storyId,
      summary: story.title,
    })),
    ...foundation.businessMemory.map((memory) => ({
      source: "business-memory" as const,
      recordId: memory.memoryId,
      summary: memory.fact,
    })),
    ...foundation.contentMemory.map((memory) => ({
      source: "content-memory" as const,
      recordId: memory.memoryId,
      summary: memory.observation,
    })),
    ...foundation.customerMemory.map((memory) => ({
      source: "customer-memory" as const,
      recordId: memory.memoryId,
      summary: memory.need,
    })),
    ...foundation.timeline.map((event) => ({
      source: "timeline-event" as const,
      recordId: event.eventId,
      summary: event.summary,
    })),
    ...foundation.learning.map((learning) => ({
      source: "learning" as const,
      recordId: learning.learningId,
      summary: learning.pattern,
    })),
    ...foundation.reflections.map((reflection) => ({
      source: "reflection" as const,
      recordId: reflection.reflectionId,
      summary: reflection.finding,
    })),
  ];
}

function validateSnapshot(snapshot: BusinessBrainV1Snapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  createTimestamp(snapshot.context.resolvedAt, "resolvedAt");
  createTimestamp(snapshot.reasoningPipeline.completedAt, "completedAt");
  snapshot.insights.forEach((insight) => {
    createRequiredString(insight.title, "Insight title");
    createRequiredString(insight.summary, "Insight summary");
    createConfidence(insight.confidence);
    createTimestamp(insight.createdAt, "insight.createdAt");
  });
  createConfidence(snapshot.understanding.confidence);
}

function cloneSnapshot(snapshot: BusinessBrainV1Snapshot): BusinessBrainV1Snapshot {
  return {
    ...snapshot,
    context: {
      ...snapshot.context,
      goals: [...snapshot.context.goals],
      priorities: [...snapshot.context.priorities],
      evidence: snapshot.context.evidence.map((item) => ({ ...item })),
    },
    understanding: {
      ...snapshot.understanding,
      strengths: [...snapshot.understanding.strengths],
      constraints: [...snapshot.understanding.constraints],
      missingInformation: [...snapshot.understanding.missingInformation],
      contradictions: [...snapshot.understanding.contradictions],
      evidence: snapshot.understanding.evidence.map((item) => ({ ...item })),
    },
    insights: snapshot.insights.map((insight) => ({
      ...insight,
      evidence: insight.evidence.map((item) => ({ ...item })),
    })),
    reasoningPipeline: {
      ...snapshot.reasoningPipeline,
      steps: snapshot.reasoningPipeline.steps.map((step) => ({ ...step })),
    },
    stateAssessment: {
      ...snapshot.stateAssessment,
      gaps: [...snapshot.stateAssessment.gaps],
      constraints: [...snapshot.stateAssessment.constraints],
    },
    situationAnalysis: {
      ...snapshot.situationAnalysis,
      recentSignals: [...snapshot.situationAnalysis.recentSignals],
      activeConstraints: [...snapshot.situationAnalysis.activeConstraints],
      relevantEvidence: snapshot.situationAnalysis.relevantEvidence.map((item) => ({
        ...item,
      })),
    },
    interpretation: {
      ...snapshot.interpretation,
      uncertainty: [...snapshot.interpretation.uncertainty],
      downstreamImplications: [...snapshot.interpretation.downstreamImplications],
      evidence: snapshot.interpretation.evidence.map((item) => ({ ...item })),
    },
  };
}

function createRequiredString(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function createTimestamp(value: Timestamp, label: string): Timestamp {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be a valid timestamp.`);
  }
  return value;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function createConfidence(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Business Brain confidence must be between 0 and 1.");
  }
  return value;
}
