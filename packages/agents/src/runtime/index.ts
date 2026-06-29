import type { Result } from "@nextshift/shared";
import type { Agent, AgentInput, AgentOutput } from "../agent";
import type { AgentRuntimeContext } from "../context";

export interface AgentRuntime {
  runAgent(
    agent: Agent,
    input: AgentInput,
    context: AgentRuntimeContext
  ): Promise<Result<AgentOutput>>;
}
