import type { Agent } from "../agent";

export interface AgentRegistry {
  register(agent: Agent): void;
  list(): readonly Agent[];
  get(agentRoleId: string): Agent | null;
}
