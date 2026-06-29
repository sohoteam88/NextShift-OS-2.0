import type { BusinessBrainSnapshot } from "./business-brain";
import {
  createKnowledgeGraphSnapshot,
  createKnowledgeNode,
  createKnowledgeRelationship,
  type KnowledgeGraphRelationship,
  type KnowledgeGraphSnapshot,
  type KnowledgeNode,
  type KnowledgeNodeId,
  type KnowledgeRelationshipId,
} from "./knowledge-graph";

export interface KnowledgeGraphBuilder {
  build(snapshot: BusinessBrainSnapshot): KnowledgeGraphSnapshot;
}

export class DefaultKnowledgeGraphBuilder implements KnowledgeGraphBuilder {
  build(snapshot: BusinessBrainSnapshot): KnowledgeGraphSnapshot {
    const nodes = createNodes(snapshot);

    if (nodes.length === 0) {
      return createKnowledgeGraphSnapshot({
        nodes: [],
        relationships: [],
        generatedAt: snapshot.updatedAt,
        summary:
          "No knowledge graph signals are available in the current Business Brain snapshot.",
      });
    }

    const relationships = createRelationships(nodes, snapshot.updatedAt);

    return createKnowledgeGraphSnapshot({
      nodes,
      relationships,
      generatedAt: snapshot.updatedAt,
      summary: `${nodes.length} knowledge node(s) and ${relationships.length} relationship(s) generated from current Business Brain signals.`,
    });
  }
}

function createNodes(snapshot: BusinessBrainSnapshot): readonly KnowledgeNode[] {
  return Object.freeze([
    ...snapshot.observations.map((observation) =>
      createKnowledgeNode({
        id: createKnowledgeNodeId("observation", observation.id),
        type: "observation",
        title: `Observation: ${observation.source}`,
        summary: observation.summary,
        createdAt: observation.observedAt,
      })
    ),
    ...snapshot.insights.map((insight) =>
      createKnowledgeNode({
        id: createKnowledgeNodeId("insight", insight.id),
        type: "insight",
        title: insight.title,
        summary: insight.summary,
        createdAt: insight.createdAt,
      })
    ),
    ...snapshot.opportunities.map((opportunity) =>
      createKnowledgeNode({
        id: createKnowledgeNodeId("opportunity", opportunity.id),
        type: "opportunity",
        title: opportunity.title,
        summary: opportunity.summary,
        createdAt: opportunity.createdAt,
      })
    ),
    ...snapshot.risks.map((risk) =>
      createKnowledgeNode({
        id: createKnowledgeNodeId("risk", risk.id),
        type: "risk",
        title: risk.title,
        summary: risk.summary,
        createdAt: risk.createdAt,
      })
    ),
  ]);
}

function createRelationships(
  nodes: readonly KnowledgeNode[],
  generatedAt: string
): readonly KnowledgeGraphRelationship[] {
  const observations = nodes.filter((node) => node.type === "observation");
  const insights = nodes.filter((node) => node.type === "insight");
  const opportunities = nodes.filter((node) => node.type === "opportunity");
  const risks = nodes.filter((node) => node.type === "risk");
  const relationships: KnowledgeGraphRelationship[] = [];

  for (const observation of observations) {
    for (const insight of insights) {
      relationships.push(
        createRelationship(
          observation.id,
          insight.id,
          "derived_from",
          0.7,
          generatedAt
        )
      );
    }
  }

  for (const insight of insights) {
    for (const opportunity of opportunities) {
      relationships.push(
        createRelationship(
          insight.id,
          opportunity.id,
          "influences",
          0.75,
          generatedAt
        )
      );
    }
  }

  for (const risk of risks) {
    for (const opportunity of opportunities) {
      relationships.push(
        createRelationship(
          opportunity.id,
          risk.id,
          "mitigates",
          0.65,
          generatedAt
        )
      );
    }
  }

  if (opportunities.length === 0) {
    for (const risk of risks) {
      for (const insight of insights) {
        relationships.push(
          createRelationship(
            insight.id,
            risk.id,
            "relates_to",
            0.55,
            generatedAt
          )
        );
      }
    }
  }

  return Object.freeze(relationships);
}

function createRelationship(
  fromNodeId: KnowledgeNodeId,
  toNodeId: KnowledgeNodeId,
  relationshipType:
    | "relates_to"
    | "depends_on"
    | "influences"
    | "mitigates"
    | "derived_from",
  confidence: number,
  createdAt: string
): KnowledgeGraphRelationship {
  return createKnowledgeRelationship({
    id: createKnowledgeRelationshipId(fromNodeId, toNodeId, relationshipType),
    fromNodeId,
    toNodeId,
    relationshipType,
    confidence,
    createdAt,
  });
}

function createKnowledgeNodeId(
  nodeType: string,
  sourceId: string
): KnowledgeNodeId {
  return `knowledge-node:${nodeType}:${sourceId}` as KnowledgeNodeId;
}

function createKnowledgeRelationshipId(
  fromNodeId: string,
  toNodeId: string,
  relationshipType: string
): KnowledgeRelationshipId {
  return `knowledge-relationship:${relationshipType}:${fromNodeId}:${toNodeId}` as KnowledgeRelationshipId;
}
