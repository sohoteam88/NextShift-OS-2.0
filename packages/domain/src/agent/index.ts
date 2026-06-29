export type AgentCategory =
  | "executive"
  | "growth"
  | "operations"
  | "creative"
  | "intelligence"
  | "coaching";

export interface AgentRole {
  readonly agentRoleId: string;
  readonly category: AgentCategory;
  readonly name: string;
  readonly responsibility: string;
}
