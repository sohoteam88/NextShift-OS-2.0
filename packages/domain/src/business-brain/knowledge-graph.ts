import type { Brand, Timestamp } from "@nextshift/shared";

export type KnowledgeNodeId = Brand<string, "KnowledgeNodeId">;
export type KnowledgeRelationshipId = Brand<
  string,
  "KnowledgeRelationshipId"
>;

export type KnowledgeNodeType =
  | "observation"
  | "insight"
  | "opportunity"
  | "risk";

export type KnowledgeRelationshipType =
  | "relates_to"
  | "depends_on"
  | "influences"
  | "mitigates"
  | "derived_from";

export interface KnowledgeNode {
  readonly id: KnowledgeNodeId;
  readonly type: KnowledgeNodeType;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface KnowledgeGraphRelationship {
  readonly id: KnowledgeRelationshipId;
  readonly fromNodeId: KnowledgeNodeId;
  readonly toNodeId: KnowledgeNodeId;
  readonly relationshipType: KnowledgeRelationshipType;
  readonly confidence: number;
  readonly createdAt: Timestamp;
}

export interface KnowledgeGraphSnapshot {
  readonly nodes: readonly KnowledgeNode[];
  readonly relationships: readonly KnowledgeGraphRelationship[];
  readonly generatedAt: Timestamp;
  readonly summary: string;
}

export interface CreateKnowledgeNodeInput {
  readonly id: KnowledgeNodeId;
  readonly type: KnowledgeNodeType;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface CreateKnowledgeRelationshipInput {
  readonly id: KnowledgeRelationshipId;
  readonly fromNodeId: KnowledgeNodeId;
  readonly toNodeId: KnowledgeNodeId;
  readonly relationshipType: KnowledgeRelationshipType;
  readonly confidence: number;
  readonly createdAt: Timestamp;
}

export interface CreateKnowledgeGraphSnapshotInput {
  readonly nodes: readonly KnowledgeNode[];
  readonly relationships: readonly KnowledgeGraphRelationship[];
  readonly generatedAt: Timestamp;
  readonly summary: string;
}

export function createKnowledgeNode(
  input: CreateKnowledgeNodeInput
): KnowledgeNode {
  return Object.freeze({
    id: createRequiredString(input.id, "KnowledgeNode id") as KnowledgeNodeId,
    type: createKnowledgeNodeType(input.type),
    title: createRequiredString(input.title, "KnowledgeNode title"),
    summary: createRequiredString(input.summary, "KnowledgeNode summary"),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  });
}

export function createKnowledgeRelationship(
  input: CreateKnowledgeRelationshipInput
): KnowledgeGraphRelationship {
  return Object.freeze({
    id: createRequiredString(
      input.id,
      "KnowledgeRelationship id"
    ) as KnowledgeRelationshipId,
    fromNodeId: createRequiredString(
      input.fromNodeId,
      "KnowledgeRelationship fromNodeId"
    ) as KnowledgeNodeId,
    toNodeId: createRequiredString(
      input.toNodeId,
      "KnowledgeRelationship toNodeId"
    ) as KnowledgeNodeId,
    relationshipType: createKnowledgeRelationshipType(
      input.relationshipType
    ),
    confidence: createKnowledgeRelationshipConfidence(input.confidence),
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  });
}

export function createKnowledgeGraphSnapshot(
  input: CreateKnowledgeGraphSnapshotInput
): KnowledgeGraphSnapshot {
  return Object.freeze({
    nodes: Object.freeze(input.nodes.map(createKnowledgeNode)),
    relationships: Object.freeze(
      input.relationships.map(createKnowledgeRelationship)
    ),
    generatedAt: createTimestamp(input.generatedAt, "generatedAt"),
    summary: createRequiredString(input.summary, "KnowledgeGraph summary"),
  });
}

export function createKnowledgeRelationshipConfidence(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error("KnowledgeRelationship confidence must be numeric.");
  }

  if (!Number.isFinite(value)) {
    throw new Error("KnowledgeRelationship confidence must be finite.");
  }

  if (value < 0 || value > 1) {
    throw new Error("KnowledgeRelationship confidence must be between 0 and 1.");
  }

  return value;
}

export function createKnowledgeRelationshipType(
  relationshipType: KnowledgeRelationshipType
): KnowledgeRelationshipType {
  if (!isKnowledgeRelationshipType(relationshipType)) {
    throw new Error(
      `Unsupported knowledge relationship type: ${relationshipType}.`
    );
  }

  return relationshipType;
}

function createKnowledgeNodeType(type: KnowledgeNodeType): KnowledgeNodeType {
  if (!isKnowledgeNodeType(type)) {
    throw new Error(`Unsupported knowledge node type: ${type}.`);
  }

  return type;
}

function isKnowledgeNodeType(value: string): value is KnowledgeNodeType {
  return ["observation", "insight", "opportunity", "risk"].includes(value);
}

function isKnowledgeRelationshipType(
  value: string
): value is KnowledgeRelationshipType {
  return [
    "relates_to",
    "depends_on",
    "influences",
    "mitigates",
    "derived_from",
  ].includes(value);
}

function createRequiredString(value: string, label: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`KnowledgeGraph ${field} must be a valid timestamp.`);
  }

  return value;
}
