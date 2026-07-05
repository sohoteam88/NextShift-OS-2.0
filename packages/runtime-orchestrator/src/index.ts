import type { EventBus } from "@nextshift/event-bus";
import {
  createRuntimeEvent,
  type RuntimeEvent,
  type RuntimeExecutionContext,
  type RuntimeResult,
} from "@nextshift/runtime-core";

export interface RuntimeStepResult<TOutput = unknown> {
  readonly output?: TOutput;
  readonly events?: readonly RuntimeEvent[];
}

export interface RuntimeStep<TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  execute(
    context: RuntimeExecutionContext
  ): RuntimeStepResult<TOutput> | Promise<RuntimeStepResult<TOutput>>;
}

export interface RuntimeApprovalGate {
  readonly id: string;
  readonly name: string;
  readonly reason: string;
  isApproved(
    context: RuntimeExecutionContext
  ): boolean | Promise<boolean>;
}

export type RuntimeWorkflowStep = RuntimeStep | RuntimeApprovalGate;

export interface RuntimeWorkflow {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly RuntimeWorkflowStep[];
}

export interface RuntimeWorkflowExecution {
  readonly workflowId: string;
  readonly completedStepIds: readonly string[];
  readonly pendingApprovalStepId?: string;
}

export class RuntimeOrchestrator {
  constructor(private readonly eventBus?: EventBus<RuntimeEvent>) {}

  async execute(
    workflow: RuntimeWorkflow,
    context: RuntimeExecutionContext
  ): Promise<RuntimeResult<RuntimeWorkflowExecution>> {
    const emittedEvents: RuntimeEvent[] = [];
    const completedStepIds: string[] = [];

    await this.publish(
      createRuntimeEvent({
        type: "runtime.workflow.started",
        source: "runtime-orchestrator",
        payload: { workflowId: workflow.id },
        context,
      }),
      emittedEvents
    );

    for (const step of workflow.steps) {
      if (isApprovalGate(step)) {
        const approved = await step.isApproved(context);

        if (!approved) {
          await this.publish(
            createRuntimeEvent({
              type: "runtime.workflow.approval_required",
              source: "runtime-orchestrator",
              payload: {
                workflowId: workflow.id,
                stepId: step.id,
                reason: step.reason,
              },
              context,
            }),
            emittedEvents
          );

          return {
            status: "approval_required",
            output: {
              workflowId: workflow.id,
              completedStepIds,
              pendingApprovalStepId: step.id,
            },
            events: emittedEvents,
          };
        }
      } else {
        const result = await step.execute(context);

        emittedEvents.push(...(result.events ?? []));
      }

      completedStepIds.push(step.id);

      await this.publish(
        createRuntimeEvent({
          type: "runtime.workflow.step.completed",
          source: "runtime-orchestrator",
          payload: { workflowId: workflow.id, stepId: step.id },
          context,
        }),
        emittedEvents
      );
    }

    await this.publish(
      createRuntimeEvent({
        type: "runtime.workflow.completed",
        source: "runtime-orchestrator",
        payload: { workflowId: workflow.id },
        context,
      }),
      emittedEvents
    );

    return {
      status: "completed",
      output: {
        workflowId: workflow.id,
        completedStepIds,
      },
      events: emittedEvents,
    };
  }

  private async publish(
    event: RuntimeEvent,
    emittedEvents: RuntimeEvent[]
  ): Promise<void> {
    emittedEvents.push(event);
    await this.eventBus?.publish(event);
  }
}

function isApprovalGate(step: RuntimeWorkflowStep): step is RuntimeApprovalGate {
  return "isApproved" in step;
}
