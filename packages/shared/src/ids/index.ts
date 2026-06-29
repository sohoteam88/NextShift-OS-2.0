export type Brand<T, BrandName extends string> = T & {
  readonly __brand: BrandName;
};

export type BusinessId = Brand<string, "BusinessId">;
export type UserId = Brand<string, "UserId">;
export type TenantId = Brand<string, "TenantId">;
export type WorkspaceId = Brand<string, "WorkspaceId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type StoryId = Brand<string, "StoryId">;
export type EventId = Brand<string, "EventId">;
export type DecisionId = Brand<string, "DecisionId">;
export type RecommendationId = Brand<string, "RecommendationId">;
export type AgentId = Brand<string, "AgentId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type CausationId = Brand<string, "CausationId">;
