import {
  createRuntimeEvent,
  type RuntimeEvent,
  type RuntimeExecutionContext,
} from "@nextshift/runtime-core";

export type CRMLeadStatus =
  | "new"
  | "qualifying"
  | "qualified"
  | "nurture"
  | "disqualified";

export interface CRMLead {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly company?: string;
  readonly source?: string;
  readonly status: CRMLeadStatus;
  readonly scoreSignals?: Readonly<Record<string, number | boolean | string>>;
}

export interface CRMLeadCreatedPayload {
  readonly lead: CRMLead;
  readonly createdAt: Date;
}

export type CRMLeadCreatedEvent = RuntimeEvent<CRMLeadCreatedPayload> & {
  readonly type: "crm.lead.created";
  readonly eventType: "crm.lead.created";
  readonly source: "business-runtime";
};

export interface LeadScoringRequest {
  readonly requestId: string;
  readonly lead: CRMLead;
  readonly context: RuntimeExecutionContext;
  readonly signals: Readonly<Record<string, number | boolean | string>>;
}

export interface CRMStatusUpdateSimulationResult {
  readonly leadId: string;
  readonly previousStatus: CRMLeadStatus;
  readonly nextStatus: CRMLeadStatus;
  readonly simulated: true;
  readonly destructive: false;
  readonly summary: string;
}

export interface CRMValidationResult {
  readonly leadId: string;
  readonly valid: boolean;
  readonly messages: readonly string[];
}

export interface CRMRuntimeAdapter {
  emitLeadCreatedEvent(
    lead: CRMLead,
    context: RuntimeExecutionContext
  ): Promise<CRMLeadCreatedEvent>;

  createLeadScoringRequest(
    lead: CRMLead,
    context: RuntimeExecutionContext
  ): LeadScoringRequest;

  simulateStatusUpdate(
    lead: CRMLead,
    nextStatus: CRMLeadStatus,
    context: RuntimeExecutionContext
  ): Promise<CRMStatusUpdateSimulationResult>;

  validateStatusUpdate?(
    result: CRMStatusUpdateSimulationResult,
    context: RuntimeExecutionContext
  ): Promise<CRMValidationResult>;
}

export interface InMemoryCRMRuntimeAdapterOptions {
  readonly now?: () => Date;
  readonly idFactory?: () => string;
}

export class InMemoryCRMRuntimeAdapter implements CRMRuntimeAdapter {
  private readonly now: () => Date;
  private readonly idFactory: () => string;

  constructor(options: InMemoryCRMRuntimeAdapterOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? (() => crypto.randomUUID());
  }

  async emitLeadCreatedEvent(
    lead: CRMLead,
    context: RuntimeExecutionContext
  ): Promise<CRMLeadCreatedEvent> {
    return createCRMLeadCreatedEvent({
      lead,
      context,
      occurredAt: this.now(),
      id: this.idFactory(),
    });
  }

  createLeadScoringRequest(
    lead: CRMLead,
    context: RuntimeExecutionContext
  ): LeadScoringRequest {
    return {
      requestId: this.idFactory(),
      lead,
      context,
      signals: lead.scoreSignals ?? {},
    };
  }

  async simulateStatusUpdate(
    lead: CRMLead,
    nextStatus: CRMLeadStatus,
    _context: RuntimeExecutionContext
  ): Promise<CRMStatusUpdateSimulationResult> {
    return {
      leadId: lead.id,
      previousStatus: lead.status,
      nextStatus,
      simulated: true,
      destructive: false,
      summary: `Simulated CRM lead status update from ${lead.status} to ${nextStatus}`,
    };
  }

  async validateStatusUpdate(
    result: CRMStatusUpdateSimulationResult,
    _context: RuntimeExecutionContext
  ): Promise<CRMValidationResult> {
    return {
      leadId: result.leadId,
      valid: result.simulated && !result.destructive,
      messages:
        result.simulated && !result.destructive
          ? ["CRM status update simulation validated"]
          : ["CRM status update attempted a destructive action"],
    };
  }
}

export function createCRMLeadCreatedEvent(input: {
  readonly lead: CRMLead;
  readonly context: RuntimeExecutionContext;
  readonly occurredAt?: Date;
  readonly id?: string;
}): CRMLeadCreatedEvent {
  return createRuntimeEvent({
    id: input.id,
    type: "crm.lead.created",
    source: "business-runtime",
    occurredAt: input.occurredAt,
    payload: {
      lead: input.lead,
      createdAt: input.occurredAt ?? new Date(),
    },
    context: input.context,
  }) as CRMLeadCreatedEvent;
}
