import type { AgentRole } from "@nextshift/domain";
import type { Result } from "@nextshift/shared";
import type { AgentRuntimeContext } from "../context";

export interface AgentInput {
  readonly taskType: string;
  readonly payload?: unknown;
}

export interface AgentOutput {
  readonly summary: string;
  readonly recommendedNextAction?: string;
}

export interface Agent {
  readonly role: AgentRole;

  run(
    input: AgentInput,
    context: AgentRuntimeContext
  ): Promise<Result<AgentOutput>>;
}
