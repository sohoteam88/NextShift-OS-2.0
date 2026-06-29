import { describe, expect, it } from "vitest";
import {
  BusinessBrain,
  DefaultKnowledgeGraphBuilder,
  createKnowledgeGraphSnapshot,
  createKnowledgeNode,
  createKnowledgeRelationship,
  createKnowledgeRelationshipConfidence,
  createKnowledgeRelationshipType,
  type BusinessBrainId,
  type BusinessInsightId,
  type BusinessProfileId,
  type KnowledgeNodeId,
  type KnowledgeRelationshipId,
  type ObservationId,
  type OpportunityId,
  type RiskId,
} from "../src/business-brain";
import {
  DefaultKnowledgeGraphBuilder as PublicDefaultKnowledgeGraphBuilder,
  createKnowledgeGraphSnapshot as publicCreateKnowledgeGraphSnapshot,
} from "../src";

const businessBrainId = "business-brain-1" as BusinessBrainId;
const businessProfileId = "business-profile-1" as BusinessProfileId;
const createdAt = "2026-06-29T00:00:00.000Z";

function createBusinessBrain(): BusinessBrain {
  return BusinessBrain.create({
    id: businessBrainId,
    businessProfileId,
    createdAt,
  });
}

function addSignals(businessBrain: BusinessBrain): void {
  businessBrain.ingestObservation({
    id: "observation-1" as ObservationId,
    source: "analytics",
    summary: "Lead conversion improved.",
    observedAt: "2026-06-29T01:00:00.000Z",
  });
  businessBrain.addInsight({
    id: "insight-1" as BusinessInsightId,
    title: "Conversion quality improved",
    summary: "Qualified conversion improved after campaign optimization.",
    createdAt: "2026-06-29T02:00:00.000Z",
  });
  businessBrain.addOpportunity({
    id: "opportunity-1" as OpportunityId,
    title: "Scale webinar follow-up",
    summary: "Webinar follow-up can create more qualified sales calls.",
    createdAt: "2026-06-29T03:00:00.000Z",
  });
  businessBrain.addRisk({
    id: "risk-1" as RiskId,
    title: "Revenue concentration",
    summary: "Revenue remains concentrated in one offer.",
    createdAt: "2026-06-29T04:00:00.000Z",
  });
}

describe("Knowledge graph model", () => {
  it("creates immutable knowledge nodes", () => {
    const node = createKnowledgeNode({
      id: "knowledge-node:observation:observation-1" as KnowledgeNodeId,
      type: "observation",
      title: "Observation: analytics",
      summary: "Lead conversion improved.",
      createdAt: "2026-06-29T01:00:00.000Z",
    });

    expect(node).toEqual({
      id: "knowledge-node:observation:observation-1",
      type: "observation",
      title: "Observation: analytics",
      summary: "Lead conversion improved.",
      createdAt: "2026-06-29T01:00:00.000Z",
    });
    expect(Object.isFrozen(node)).toBe(true);
  });

  it("validates node fields", () => {
    expect(() =>
      createKnowledgeNode({
        id: " " as KnowledgeNodeId,
        type: "observation",
        title: "Observation",
        summary: "Summary.",
        createdAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("KnowledgeNode id is required.");

    expect(() =>
      createKnowledgeNode({
        id: "node-1" as KnowledgeNodeId,
        type: "unsupported" as "observation",
        title: "Observation",
        summary: "Summary.",
        createdAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("Unsupported knowledge node type: unsupported.");
  });

  it("creates immutable knowledge relationships", () => {
    const relationship = createKnowledgeRelationship({
      id: "relationship-1" as KnowledgeRelationshipId,
      fromNodeId: "node-1" as KnowledgeNodeId,
      toNodeId: "node-2" as KnowledgeNodeId,
      relationshipType: "influences",
      confidence: 0.75,
      createdAt: "2026-06-29T04:00:00.000Z",
    });

    expect(relationship).toEqual({
      id: "relationship-1",
      fromNodeId: "node-1",
      toNodeId: "node-2",
      relationshipType: "influences",
      confidence: 0.75,
      createdAt: "2026-06-29T04:00:00.000Z",
    });
    expect(Object.isFrozen(relationship)).toBe(true);
  });

  it("validates relationship confidence and type", () => {
    expect(() => createKnowledgeRelationshipConfidence(Number.NaN)).toThrow(
      "KnowledgeRelationship confidence must be numeric."
    );
    expect(() =>
      createKnowledgeRelationshipConfidence(Number.POSITIVE_INFINITY)
    ).toThrow("KnowledgeRelationship confidence must be finite.");
    expect(() => createKnowledgeRelationshipConfidence(1.01)).toThrow(
      "KnowledgeRelationship confidence must be between 0 and 1."
    );
    expect(() =>
      createKnowledgeRelationshipType("unsupported" as "relates_to")
    ).toThrow("Unsupported knowledge relationship type: unsupported.");
  });

  it("creates and validates graph snapshots", () => {
    const node = createKnowledgeNode({
      id: "node-1" as KnowledgeNodeId,
      type: "insight",
      title: "Insight",
      summary: "Insight summary.",
      createdAt: "2026-06-29T02:00:00.000Z",
    });
    const graph = createKnowledgeGraphSnapshot({
      nodes: [node],
      relationships: [],
      generatedAt: "2026-06-29T04:00:00.000Z",
      summary: "1 node generated.",
    });

    expect(graph.nodes).toHaveLength(1);
    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.nodes)).toBe(true);
    expect(() =>
      createKnowledgeGraphSnapshot({
        nodes: [],
        relationships: [],
        generatedAt: "not-a-date",
        summary: "Invalid timestamp.",
      })
    ).toThrow("KnowledgeGraph generatedAt must be a valid timestamp.");
    expect(() =>
      createKnowledgeGraphSnapshot({
        nodes: [],
        relationships: [],
        generatedAt: "2026-06-29T04:00:00.000Z",
        summary: " ",
      })
    ).toThrow("KnowledgeGraph summary is required.");
  });
});

describe("DefaultKnowledgeGraphBuilder", () => {
  it("builds deterministic graph from BusinessBrain snapshot signals", () => {
    const businessBrain = createBusinessBrain();
    addSignals(businessBrain);

    const graph = new DefaultKnowledgeGraphBuilder().build(
      businessBrain.toSnapshot()
    );

    expect(graph).toMatchObject({
      generatedAt: "2026-06-29T04:00:00.000Z",
      summary: "4 knowledge node(s) and 3 relationship(s) generated from current Business Brain signals.",
    });
    expect(graph.nodes).toEqual([
      {
        id: "knowledge-node:observation:observation-1",
        type: "observation",
        title: "Observation: analytics",
        summary: "Lead conversion improved.",
        createdAt: "2026-06-29T01:00:00.000Z",
      },
      {
        id: "knowledge-node:insight:insight-1",
        type: "insight",
        title: "Conversion quality improved",
        summary: "Qualified conversion improved after campaign optimization.",
        createdAt: "2026-06-29T02:00:00.000Z",
      },
      {
        id: "knowledge-node:opportunity:opportunity-1",
        type: "opportunity",
        title: "Scale webinar follow-up",
        summary: "Webinar follow-up can create more qualified sales calls.",
        createdAt: "2026-06-29T03:00:00.000Z",
      },
      {
        id: "knowledge-node:risk:risk-1",
        type: "risk",
        title: "Revenue concentration",
        summary: "Revenue remains concentrated in one offer.",
        createdAt: "2026-06-29T04:00:00.000Z",
      },
    ]);
    expect(graph.relationships.map((relationship) => relationship.id)).toEqual([
      "knowledge-relationship:derived_from:knowledge-node:observation:observation-1:knowledge-node:insight:insight-1",
      "knowledge-relationship:influences:knowledge-node:insight:insight-1:knowledge-node:opportunity:opportunity-1",
      "knowledge-relationship:mitigates:knowledge-node:opportunity:opportunity-1:knowledge-node:risk:risk-1",
    ]);
  });

  it("returns empty graph when no signals exist", () => {
    const businessBrain = createBusinessBrain();

    const graph = new DefaultKnowledgeGraphBuilder().build(
      businessBrain.toSnapshot()
    );

    expect(graph).toEqual({
      nodes: [],
      relationships: [],
      generatedAt: createdAt,
      summary:
        "No knowledge graph signals are available in the current Business Brain snapshot.",
    });
  });

  it("builds deterministic relationship ids and does not mutate BusinessBrain", () => {
    const businessBrain = createBusinessBrain();
    addSignals(businessBrain);
    const before = businessBrain.toSnapshot();
    const builder = new DefaultKnowledgeGraphBuilder();

    const first = builder.build(businessBrain.toSnapshot());
    const second = builder.build(businessBrain.toSnapshot());

    expect(second).toEqual(first);
    expect(businessBrain.toSnapshot()).toEqual(before);
  });

  it("exports knowledge graph through public barrels", () => {
    expect(PublicDefaultKnowledgeGraphBuilder).toBe(DefaultKnowledgeGraphBuilder);
    expect(publicCreateKnowledgeGraphSnapshot).toBe(
      createKnowledgeGraphSnapshot
    );
  });
});
