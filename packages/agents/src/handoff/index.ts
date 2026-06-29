export interface AgentHandoff {
  readonly fromAgentRoleId: string;
  readonly toAgentRoleId: string;
  readonly reason: string;
}
