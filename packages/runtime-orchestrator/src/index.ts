import type { EventBus } from "@nextshift/event-bus";
import type {
  BusinessDecisionResult,
  BusinessRuntimeAdapter,
  CleanupCandidate,
  RepositoryRuntimeAdapter,
  ValidationResult,
} from "@nextshift/runtime-adapters";
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
  readonly failedStepId?: string;
}

export class RuntimeOrchestrator {
  constructor(private readonly eventBus?: EventBus<RuntimeEvent>) {}

  async execute(
    workflow: RuntimeWorkflow,
    context: RuntimeExecutionContext
  ): Promise<RuntimeResult<RuntimeWorkflowExecution>> {
    const emittedEvents: RuntimeEvent[] = [];
    const completedStepIds: string[] = [];
    const errors: string[] = [];

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
      try {
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
      } catch (error) {
        errors.push(describeRuntimeError(error));

        await this.publish(
          createRuntimeEvent({
            type: "runtime.workflow.failed",
            source: "runtime-orchestrator",
            payload: {
              workflowId: workflow.id,
              stepId: step.id,
              error: describeRuntimeError(error),
            },
            context,
          }),
          emittedEvents
        );

        return {
          status: "failed",
          output: {
            workflowId: workflow.id,
            completedStepIds,
            failedStepId: step.id,
          },
          events: emittedEvents,
          errors,
        };
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
      errors: errors.length > 0 ? errors : undefined,
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

function describeRuntimeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export interface OperatorApprovalRequest {
  readonly requestId: string;
  readonly action: string;
  readonly subject: string;
  readonly reason: string;
  readonly context: RuntimeExecutionContext;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface OperatorApprovalResult {
  readonly requestId: string;
  readonly approved: boolean;
  readonly reviewedBy?: string;
  readonly reason?: string;
}

export interface OperatorApprovalService {
  requestApproval(
    request: OperatorApprovalRequest
  ): Promise<OperatorApprovalResult>;
}

export class StaticOperatorApprovalService implements OperatorApprovalService {
  constructor(
    private readonly approved: boolean,
    private readonly reviewedBy = "operator"
  ) {}

  async requestApproval(
    request: OperatorApprovalRequest
  ): Promise<OperatorApprovalResult> {
    return {
      requestId: request.requestId,
      approved: this.approved,
      reviewedBy: this.reviewedBy,
      reason: this.approved ? "Approved for simulation" : "Approval withheld",
    };
  }
}

export interface RepositoryActionSimulationResult {
  readonly candidateId: string;
  readonly action: "simulate_cleanup";
  readonly simulated: true;
  readonly destructive: false;
  readonly summary: string;
}

export interface RepositoryActionSimulator {
  simulateCleanup(
    candidate: CleanupCandidate,
    context: RuntimeExecutionContext
  ): Promise<RepositoryActionSimulationResult>;
}

export class InMemoryRepositoryActionSimulator
  implements RepositoryActionSimulator
{
  async simulateCleanup(
    candidate: CleanupCandidate,
    _context: RuntimeExecutionContext
  ): Promise<RepositoryActionSimulationResult> {
    return {
      candidateId: candidate.id,
      action: "simulate_cleanup",
      simulated: true,
      destructive: false,
      summary: `Simulated cleanup for ${candidate.path}`,
    };
  }
}

export interface ValidationPipeline {
  validate(
    candidate: CleanupCandidate,
    action: RepositoryActionSimulationResult,
    context: RuntimeExecutionContext
  ): Promise<ValidationResult>;
}

export class SimulationValidationPipeline implements ValidationPipeline {
  async validate(
    candidate: CleanupCandidate,
    action: RepositoryActionSimulationResult,
    _context: RuntimeExecutionContext
  ): Promise<ValidationResult> {
    return {
      candidateId: candidate.id,
      valid: action.simulated && !action.destructive,
      messages: action.destructive
        ? ["Simulation attempted a destructive action"]
        : ["Simulated action validated without destructive changes"],
    };
  }
}

export type RepositoryHealthAuditStatus =
  | "recorded"
  | "approved"
  | "rejected"
  | "simulated"
  | "validated"
  | "completed";

export interface RepositoryHealthAuditTrailEntry {
  readonly id: string;
  readonly eventType: string;
  readonly status: RepositoryHealthAuditStatus;
  readonly occurredAt: Date;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface AuditTrailRecorder {
  record(entry: RepositoryHealthAuditTrailEntry): Promise<void>;
}

export class InMemoryAuditTrailRecorder implements AuditTrailRecorder {
  private readonly entries: RepositoryHealthAuditTrailEntry[] = [];

  async record(entry: RepositoryHealthAuditTrailEntry): Promise<void> {
    this.entries.push(entry);
  }

  list(): readonly RepositoryHealthAuditTrailEntry[] {
    return [...this.entries];
  }
}

export interface RepositoryHealthWorkflowDependencies {
  readonly repositoryAdapter: RepositoryRuntimeAdapter;
  readonly businessAdapter: BusinessRuntimeAdapter;
  readonly approvalService: OperatorApprovalService;
  readonly eventBus?: EventBus<RuntimeEvent>;
  readonly actionSimulator?: RepositoryActionSimulator;
  readonly validationPipeline?: ValidationPipeline;
  readonly auditTrail?: AuditTrailRecorder;
  readonly now?: () => Date;
  readonly idFactory?: () => string;
}

export interface RepositoryHealthWorkflowResult {
  readonly healthStatus: string;
  readonly candidate?: CleanupCandidate;
  readonly operatorApproval?: OperatorApprovalResult;
  readonly businessDecision?: BusinessDecisionResult;
  readonly action?: RepositoryActionSimulationResult;
  readonly validation?: ValidationResult;
  readonly auditTrailEntries: readonly RepositoryHealthAuditTrailEntry[];
}

export class RepositoryHealthWorkflow {
  private readonly actionSimulator: RepositoryActionSimulator;
  private readonly validationPipeline: ValidationPipeline;
  private readonly auditTrail: AuditTrailRecorder;
  private readonly now: () => Date;
  private readonly idFactory: () => string;

  constructor(private readonly dependencies: RepositoryHealthWorkflowDependencies) {
    this.actionSimulator =
      dependencies.actionSimulator ?? new InMemoryRepositoryActionSimulator();
    this.validationPipeline =
      dependencies.validationPipeline ?? new SimulationValidationPipeline();
    this.auditTrail =
      dependencies.auditTrail ?? new InMemoryAuditTrailRecorder();
    this.now = dependencies.now ?? (() => new Date());
    this.idFactory = dependencies.idFactory ?? (() => crypto.randomUUID());
  }

  async execute(
    context: RuntimeExecutionContext
  ): Promise<RuntimeResult<RepositoryHealthWorkflowResult>> {
    const events: RuntimeEvent[] = [];
    const auditTrailEntries: RepositoryHealthAuditTrailEntry[] = [];

    const healthEvent =
      await this.dependencies.repositoryAdapter.emitHealthEvent(context);
    await this.routeEvent(healthEvent, events);
    await this.recordAudit(
      {
        eventType: healthEvent.eventType,
        status: "recorded",
        details: {
          healthStatus: healthEvent.payload.status,
          summary: healthEvent.payload.summary,
        },
      },
      auditTrailEntries
    );

    const candidates =
      (await this.dependencies.repositoryAdapter.listCleanupCandidates?.(
        context
      )) ?? [];
    const candidate = candidates[0];

    if (!candidate) {
      await this.recordAudit(
        {
          eventType: "repository.health.workflow.completed",
          status: "completed",
          details: { reason: "No cleanup candidates returned" },
        },
        auditTrailEntries
      );

      return {
        status: "completed",
        output: {
          healthStatus: healthEvent.payload.status,
          auditTrailEntries,
        },
        events,
      };
    }

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "repository.cleanup_candidate",
        source: "repository-runtime",
        occurredAt: this.now(),
        payload: candidate,
        context,
      }),
      events
    );

    const approvalRequest: OperatorApprovalRequest = {
      requestId: this.idFactory(),
      action: "simulate_cleanup",
      subject: candidate.path,
      reason: candidate.reason,
      context,
      metadata: { candidateId: candidate.id, risk: candidate.risk },
    };

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "workspace.operator.approval_requested",
        source: "workspace-runtime",
        occurredAt: this.now(),
        payload: approvalRequest,
        context,
      }),
      events
    );

    const operatorApproval =
      await this.dependencies.approvalService.requestApproval(approvalRequest);

    await this.recordAudit(
      {
        eventType: "workspace.operator.approval_completed",
        status: operatorApproval.approved ? "approved" : "rejected",
        details: {
          requestId: operatorApproval.requestId,
          reviewedBy: operatorApproval.reviewedBy,
          reason: operatorApproval.reason,
        },
      },
      auditTrailEntries
    );

    if (!operatorApproval.approved) {
      return {
        status: "approval_required",
        output: {
          healthStatus: healthEvent.payload.status,
          candidate,
          operatorApproval,
          auditTrailEntries,
        },
        events,
      };
    }

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "business.decision.requested",
        source: "business-runtime",
        occurredAt: this.now(),
        payload: {
          requestId: approvalRequest.requestId,
          action: approvalRequest.action,
          subject: approvalRequest.subject,
          risk: candidate.risk,
        },
        context,
      }),
      events
    );

    const businessDecision = await this.dependencies.businessAdapter.decide({
      requestId: approvalRequest.requestId,
      context,
      action: approvalRequest.action,
      subject: approvalRequest.subject,
      risk: candidate.risk,
      metadata: { candidateId: candidate.id },
    });

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "business.decision.completed",
        source: "business-runtime",
        occurredAt: this.now(),
        payload: businessDecision,
        context,
      }),
      events
    );

    await this.recordAudit(
      {
        eventType: "business.decision.completed",
        status: businessDecision.approved ? "approved" : "rejected",
        details: {
          requestId: businessDecision.requestId,
          decision: businessDecision.decision,
          reason: businessDecision.reason,
        },
      },
      auditTrailEntries
    );

    if (!businessDecision.approved) {
      return {
        status: "completed",
        output: {
          healthStatus: healthEvent.payload.status,
          candidate,
          operatorApproval,
          businessDecision,
          auditTrailEntries,
        },
        events,
      };
    }

    const action = await this.actionSimulator.simulateCleanup(candidate, context);

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "repository.action.simulated",
        source: "repository-runtime",
        occurredAt: this.now(),
        payload: action,
        context,
      }),
      events
    );

    await this.recordAudit(
      {
        eventType: "repository.action.simulated",
        status: "simulated",
        details: {
          candidateId: action.candidateId,
          action: action.action,
          simulated: action.simulated,
          destructive: action.destructive,
          summary: action.summary,
        },
      },
      auditTrailEntries
    );

    const validation =
      (await this.dependencies.repositoryAdapter.validateCleanupCandidate?.(
        candidate,
        context
      )) ?? (await this.validationPipeline.validate(candidate, action, context));

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "repository.validation_completed",
        source: "repository-runtime",
        occurredAt: this.now(),
        payload: validation,
        context,
      }),
      events
    );

    await this.recordAudit(
      {
        eventType: "repository.validation_completed",
        status: "validated",
        details: {
          candidateId: validation.candidateId,
          valid: validation.valid,
          messages: validation.messages,
        },
      },
      auditTrailEntries
    );

    return {
      status: validation.valid ? "completed" : "failed",
      output: {
        healthStatus: healthEvent.payload.status,
        candidate,
        operatorApproval,
        businessDecision,
        action,
        validation,
        auditTrailEntries,
      },
      events,
      errors: validation.valid ? undefined : [...validation.messages],
    };
  }

  private async routeEvent(
    event: RuntimeEvent,
    events: RuntimeEvent[]
  ): Promise<void> {
    events.push(event);
    await this.dependencies.eventBus?.publish(event);
  }

  private async recordAudit(
    entry: Omit<RepositoryHealthAuditTrailEntry, "id" | "occurredAt">,
    entries: RepositoryHealthAuditTrailEntry[]
  ): Promise<void> {
    const auditEntry: RepositoryHealthAuditTrailEntry = {
      id: this.idFactory(),
      occurredAt: this.now(),
      ...entry,
    };

    entries.push(auditEntry);
    await this.auditTrail.record(auditEntry);
  }
}
