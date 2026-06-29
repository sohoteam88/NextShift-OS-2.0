import type { BusinessId } from "@nextshift/shared";

export interface KnowledgeEntity {
  readonly entityId: string;
  readonly businessId: BusinessId;
  readonly entityType: string;
  readonly name: string;
}

export interface KnowledgeRelationship {
  readonly relationshipId: string;
  readonly businessId: BusinessId;
  readonly fromEntityId: string;
  readonly toEntityId: string;
  readonly relationshipType: string;
  readonly confidence?: number;
}
