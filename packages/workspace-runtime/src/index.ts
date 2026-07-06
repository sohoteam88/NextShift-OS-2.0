import type { EventBus } from "@nextshift/event-bus";
import type {
  BusinessDecisionResult,
  BusinessRuntimeAdapter,
} from "@nextshift/runtime-adapters";
import {
  createRuntimeEvent,
  type RuntimeEvent,
  type RuntimeExecutionContext,
} from "@nextshift/runtime-core";

export type WorkspaceSessionStatus = "open" | "active" | "closed";

export type RuntimeTaskStatus =
  | "pending"
  | "awaiting_operator"
  | "business_review"
  | "completed"
  | "rejected";

export interface OperatorContext {
  readonly operatorId: string;
  readonly displayName?: string;
  readonly role?: string;
}

export interface ConversationMessage {
  readonly id: string;
  readonly author: "system" | "operator" | "runtime";
  readonly content: string;
  readonly createdAt: Date;
}

export interface ConversationContext {
  readonly conversationId: string;
  readonly messages: readonly ConversationMessage[];
}

export interface OperatorDecision {
  readonly approved: boolean;
  readonly reason?: string;
}

export interface RuntimeTimelineEntry {
  readonly id: string;
  readonly eventType: string;
  readonly title: string;
  readonly occurredAt: Date;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export class RuntimeTimeline {
  private readonly entries: RuntimeTimelineEntry[] = [];

  record(entry: RuntimeTimelineEntry): RuntimeTimelineEntry {
    this.entries.push(entry);
    return entry;
  }

  list(): readonly RuntimeTimelineEntry[] {
    return [...this.entries];
  }

  byEventType(eventType: string): readonly RuntimeTimelineEntry[] {
    return this.entries.filter((entry) => entry.eventType === eventType);
  }
}

export interface RuntimeEventConsole {
  display(event: RuntimeEvent): Promise<RuntimeTimelineEntry>;
  listDisplayed(): readonly RuntimeTimelineEntry[];
}

export class InMemoryRuntimeEventConsole implements RuntimeEventConsole {
  constructor(
    private readonly timeline: RuntimeTimeline,
    private readonly now: () => Date = () => new Date(),
    private readonly idFactory: () => string = () => crypto.randomUUID()
  ) {}

  async display(event: RuntimeEvent): Promise<RuntimeTimelineEntry> {
    return this.timeline.record({
      id: this.idFactory(),
      eventType: event.eventType,
      title: formatEventTitle(event),
      occurredAt: this.now(),
      metadata: {
        source: event.source,
        eventId: event.id,
        payload: event.payload,
      },
    });
  }

  listDisplayed(): readonly RuntimeTimelineEntry[] {
    return this.timeline.list();
  }
}

export interface RuntimeTask {
  readonly id: string;
  readonly title: string;
  readonly sourceEvent: RuntimeEvent;
  readonly status: RuntimeTaskStatus;
  readonly conversation: ConversationContext;
  readonly operator?: OperatorContext;
  readonly operatorDecision?: OperatorDecision;
  readonly businessDecision?: BusinessDecisionResult;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkspaceSessionDependencies {
  readonly businessAdapter: BusinessRuntimeAdapter;
  readonly eventBus?: EventBus<RuntimeEvent>;
  readonly eventConsole?: RuntimeEventConsole;
  readonly timeline?: RuntimeTimeline;
  readonly now?: () => Date;
  readonly idFactory?: () => string;
}

export interface ReceiveRepositoryEventInput {
  readonly event: RuntimeEvent;
  readonly context: RuntimeExecutionContext;
}

export interface PresentOperatorDecisionInput {
  readonly taskId: string;
  readonly operator: OperatorContext;
  readonly decision: OperatorDecision;
  readonly context: RuntimeExecutionContext;
}

export class WorkspaceSession {
  readonly id: string;
  private status: WorkspaceSessionStatus = "open";
  private readonly tasks = new Map<string, RuntimeTask>();
  private readonly timeline: RuntimeTimeline;
  private readonly eventConsole: RuntimeEventConsole;
  private readonly now: () => Date;
  private readonly idFactory: () => string;

  constructor(private readonly dependencies: WorkspaceSessionDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    this.idFactory = dependencies.idFactory ?? (() => crypto.randomUUID());
    this.id = this.idFactory();
    this.timeline = dependencies.timeline ?? new RuntimeTimeline();
    this.eventConsole =
      dependencies.eventConsole ??
      new InMemoryRuntimeEventConsole(this.timeline, this.now, this.idFactory);
  }

  getStatus(): WorkspaceSessionStatus {
    return this.status;
  }

  getTimeline(): readonly RuntimeTimelineEntry[] {
    return this.timeline.list();
  }

  listTasks(): readonly RuntimeTask[] {
    return Array.from(this.tasks.values());
  }

  getTask(taskId: string): RuntimeTask | undefined {
    return this.tasks.get(taskId);
  }

  async receiveRepositoryRuntimeEvent(
    input: ReceiveRepositoryEventInput
  ): Promise<RuntimeTask> {
    this.status = "active";
    await this.routeEvent(input.event);
    await this.eventConsole.display(input.event);

    const task = this.createTask(input.event);
    this.tasks.set(task.id, task);

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "workspace.task.created",
        source: "workspace-runtime",
        occurredAt: this.now(),
        payload: {
          taskId: task.id,
          sourceEventType: input.event.eventType,
        },
        context: input.context,
      })
    );

    this.timeline.record({
      id: this.idFactory(),
      eventType: "workspace.task.created",
      title: `Runtime task created: ${task.title}`,
      occurredAt: this.now(),
      metadata: {
        taskId: task.id,
        status: task.status,
      },
    });

    return task;
  }

  async presentOperatorDecision(
    input: PresentOperatorDecisionInput
  ): Promise<RuntimeTask> {
    const task = this.requireTask(input.taskId);
    const decidedTask = this.updateTask(task.id, {
      operator: input.operator,
      operatorDecision: input.decision,
      status: input.decision.approved ? "business_review" : "rejected",
      conversation: appendConversationMessage(
        task.conversation,
        {
          id: this.idFactory(),
          author: "operator",
          content: input.decision.reason ?? "Operator decision recorded",
          createdAt: this.now(),
        }
      ),
    });

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "workspace.operator.decision_presented",
        source: "workspace-runtime",
        occurredAt: this.now(),
        payload: {
          taskId: decidedTask.id,
          approved: input.decision.approved,
          operatorId: input.operator.operatorId,
        },
        context: input.context,
      })
    );

    this.timeline.record({
      id: this.idFactory(),
      eventType: "workspace.operator.decision_presented",
      title: input.decision.approved
        ? "Operator approved runtime task"
        : "Operator rejected runtime task",
      occurredAt: this.now(),
      metadata: {
        taskId: decidedTask.id,
        operatorId: input.operator.operatorId,
      },
    });

    if (!input.decision.approved) {
      return decidedTask;
    }

    const businessDecision = await this.dependencies.businessAdapter.decide({
      requestId: decidedTask.id,
      context: input.context,
      action: "review_repository_runtime_event",
      subject: decidedTask.sourceEvent.eventType,
      metadata: {
        sessionId: this.id,
        operatorId: input.operator.operatorId,
      },
    });

    await this.routeEvent(
      createRuntimeEvent({
        id: this.idFactory(),
        type: "business.decision.completed",
        source: "business-runtime",
        occurredAt: this.now(),
        payload: businessDecision,
        context: input.context,
      })
    );

    this.timeline.record({
      id: this.idFactory(),
      eventType: "business.decision.completed",
      title: `Business runtime decision: ${businessDecision.decision}`,
      occurredAt: this.now(),
      metadata: {
        taskId: decidedTask.id,
        approved: businessDecision.approved,
      },
    });

    return this.updateTask(decidedTask.id, {
      businessDecision,
      status: businessDecision.approved ? "completed" : "rejected",
      conversation: appendConversationMessage(
        decidedTask.conversation,
        {
          id: this.idFactory(),
          author: "runtime",
          content: `Business decision: ${businessDecision.decision}`,
          createdAt: this.now(),
        }
      ),
    });
  }

  close(): void {
    this.status = "closed";
  }

  private createTask(event: RuntimeEvent): RuntimeTask {
    const createdAt = this.now();

    return {
      id: this.idFactory(),
      title: formatTaskTitle(event),
      sourceEvent: event,
      status: "awaiting_operator",
      conversation: {
        conversationId: this.idFactory(),
        messages: [
          {
            id: this.idFactory(),
            author: "system",
            content: `Repository runtime event received: ${event.eventType}`,
            createdAt,
          },
        ],
      },
      createdAt,
      updatedAt: createdAt,
    };
  }

  private requireTask(taskId: string): RuntimeTask {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Runtime task not found: ${taskId}`);
    }

    return task;
  }

  private updateTask(
    taskId: string,
    patch: Partial<Omit<RuntimeTask, "id" | "createdAt">>
  ): RuntimeTask {
    const current = this.requireTask(taskId);
    const next: RuntimeTask = {
      ...current,
      ...patch,
      updatedAt: this.now(),
    };

    this.tasks.set(taskId, next);
    return next;
  }

  private async routeEvent(event: RuntimeEvent): Promise<void> {
    await this.dependencies.eventBus?.publish(event);
  }
}

function appendConversationMessage(
  context: ConversationContext,
  message: ConversationMessage
): ConversationContext {
  return {
    ...context,
    messages: [...context.messages, message],
  };
}

function formatEventTitle(event: RuntimeEvent): string {
  if (event.eventType === "repository.health") {
    return "Repository health event received";
  }

  return `Runtime event received: ${event.eventType}`;
}

function formatTaskTitle(event: RuntimeEvent): string {
  if (event.eventType === "repository.health") {
    return "Review repository health event";
  }

  return `Review ${event.eventType}`;
}
