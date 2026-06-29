import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type {
  Brand,
  BusinessId,
  TenantContext,
  Timestamp,
} from "@nextshift/shared";

export type DecisionContextId = Brand<string, "DecisionContextId">;
export type DecisionEvidenceId = Brand<string, "DecisionEvidenceId">;
export type DecisionConstraintId = Brand<string, "DecisionConstraintId">;

export type ConfidenceValue = Brand<number, "ConfidenceValue">;
export type ImpactValue = Brand<number, "ImpactValue">;
export type UrgencyValue = Brand<number, "UrgencyValue">;
export type EffortValue = Brand<number, "EffortValue">;

export type DecisionConstraintType =
  | "Budget"
  | "Time"
  | "Capacity"
  | "Strategic"
  | "Operational"
  | "Compliance"
  | "Custom";

export type DecisionConstraintSeverity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export interface DecisionEvidence {
  readonly evidenceId: DecisionEvidenceId;
  readonly source: string;
  readonly summary: string;
  readonly confidence: ConfidenceValue;
  readonly observedAt: Timestamp;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface DecisionConstraint {
  readonly constraintId: DecisionConstraintId;
  readonly constraintType: DecisionConstraintType;
  readonly description: string;
  readonly severity: DecisionConstraintSeverity;
}

export interface DecisionContextSnapshot {
  readonly decisionContextId: DecisionContextId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly businessContext: BusinessTwinSnapshot;
  readonly objective?: string;
  readonly evidence: readonly DecisionEvidence[];
  readonly constraints: readonly DecisionConstraint[];
  readonly createdAt: Timestamp;
}

export interface CreateDecisionContextInput {
  readonly decisionContextId: DecisionContextId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly businessContext: BusinessTwinSnapshot;
  readonly objective?: string;
  readonly evidence?: readonly DecisionEvidence[];
  readonly constraints?: readonly DecisionConstraint[];
  readonly createdAt: Timestamp;
}

export interface DecisionBrainRuntimeContext {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly businessContext: BusinessTwinSnapshot;
}

const DECISION_CONSTRAINT_TYPES: readonly DecisionConstraintType[] = Object.freeze([
  "Budget",
  "Time",
  "Capacity",
  "Strategic",
  "Operational",
  "Compliance",
  "Custom",
]);

const DECISION_CONSTRAINT_SEVERITIES: readonly DecisionConstraintSeverity[] =
  Object.freeze(["Low", "Medium", "High", "Critical"]);

export class DecisionContext {
  private constructor(private readonly snapshot: DecisionContextSnapshot) {}

  static create(input: CreateDecisionContextInput): DecisionContext {
    const decisionContextId = createRequiredId(
      input.decisionContextId,
      "Decision context ID is required."
    ) as DecisionContextId;
    const businessId = createRequiredId(
      input.businessId,
      "Decision context business ID is required."
    ) as BusinessId;

    if (!input.tenant) {
      throw new Error("Decision context tenant is required.");
    }

    if (!input.businessContext) {
      throw new Error("Decision context business context is required.");
    }

    const createdAt = createDecisionTimestamp(
      input.createdAt,
      "Decision context createdAt must be a valid timestamp."
    );

    return new DecisionContext(
      freezeDeep({
        decisionContextId,
        businessId,
        tenant: cloneDeep(input.tenant),
        businessContext: cloneDeep(input.businessContext),
        objective: normalizeOptionalText(input.objective),
        evidence: freezeList((input.evidence ?? []).map(cloneDecisionEvidence)),
        constraints: freezeList(
          (input.constraints ?? []).map(cloneDecisionConstraint)
        ),
        createdAt,
      })
    );
  }

  get decisionContextId(): DecisionContextId {
    return this.snapshot.decisionContextId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  toSnapshot(): DecisionContextSnapshot {
    return freezeDeep({
      ...this.snapshot,
      tenant: cloneDeep(this.snapshot.tenant),
      businessContext: cloneDeep(this.snapshot.businessContext),
      evidence: freezeList(this.snapshot.evidence.map(cloneDecisionEvidence)),
      constraints: freezeList(
        this.snapshot.constraints.map(cloneDecisionConstraint)
      ),
    });
  }
}

export function createDecisionEvidence(input: {
  readonly evidenceId: DecisionEvidenceId;
  readonly source: string;
  readonly summary: string;
  readonly confidence: number;
  readonly observedAt: Timestamp;
  readonly metadata?: Readonly<Record<string, unknown>>;
}): DecisionEvidence {
  return freezeDeep({
    evidenceId: createRequiredId(
      input.evidenceId,
      "Decision evidence ID is required."
    ) as DecisionEvidenceId,
    source: createRequiredText(
      input.source,
      "Decision evidence source is required."
    ),
    summary: createRequiredText(
      input.summary,
      "Decision evidence summary is required."
    ),
    confidence: createConfidenceValue(input.confidence),
    observedAt: createDecisionTimestamp(
      input.observedAt,
      "Decision evidence observedAt must be a valid timestamp."
    ),
    metadata:
      input.metadata === undefined ? undefined : freezeDeep(cloneDeep(input.metadata)),
  });
}

export function createDecisionConstraint(input: {
  readonly constraintId: DecisionConstraintId;
  readonly constraintType: DecisionConstraintType;
  readonly description: string;
  readonly severity: DecisionConstraintSeverity;
}): DecisionConstraint {
  assertConstraintType(input.constraintType);
  assertConstraintSeverity(input.severity);

  return freezeDeep({
    constraintId: createRequiredId(
      input.constraintId,
      "Decision constraint ID is required."
    ) as DecisionConstraintId,
    constraintType: input.constraintType,
    description: createRequiredText(
      input.description,
      "Decision constraint description is required."
    ),
    severity: input.severity,
  });
}

export function createConfidenceValue(value: number): ConfidenceValue {
  return createBoundedDecisionValue(
    value,
    "Decision confidence value must be between 0 and 1."
  ) as ConfidenceValue;
}

export function createImpactValue(value: number): ImpactValue {
  return createBoundedDecisionValue(
    value,
    "Decision impact value must be between 0 and 1."
  ) as ImpactValue;
}

export function createUrgencyValue(value: number): UrgencyValue {
  return createBoundedDecisionValue(
    value,
    "Decision urgency value must be between 0 and 1."
  ) as UrgencyValue;
}

export function createEffortValue(value: number): EffortValue {
  return createBoundedDecisionValue(
    value,
    "Decision effort value must be between 0 and 1."
  ) as EffortValue;
}

function cloneDecisionEvidence(evidence: DecisionEvidence): DecisionEvidence {
  return freezeDeep({
    evidenceId: evidence.evidenceId,
    source: evidence.source,
    summary: evidence.summary,
    confidence: evidence.confidence,
    observedAt: evidence.observedAt,
    metadata:
      evidence.metadata === undefined
        ? undefined
        : freezeDeep(cloneDeep(evidence.metadata)),
  });
}

function cloneDecisionConstraint(
  constraint: DecisionConstraint
): DecisionConstraint {
  return freezeDeep({
    constraintId: constraint.constraintId,
    constraintType: constraint.constraintType,
    description: constraint.description,
    severity: constraint.severity,
  });
}

function createRequiredId(value: string, message: string): string {
  if (value.trim().length === 0) {
    throw new Error(message);
  }

  return value;
}

function createRequiredText(value: string, message: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(message);
  }

  return normalized;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? undefined : normalized;
}

function createDecisionTimestamp(value: Timestamp, message: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(message);
  }

  return value;
}

function createBoundedDecisionValue(value: number, message: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(message);
  }

  return value;
}

function assertConstraintType(value: DecisionConstraintType): void {
  if (!DECISION_CONSTRAINT_TYPES.includes(value)) {
    throw new Error(`Unsupported decision constraint type: ${value}.`);
  }
}

function assertConstraintSeverity(value: DecisionConstraintSeverity): void {
  if (!DECISION_CONSTRAINT_SEVERITIES.includes(value)) {
    throw new Error(`Unsupported decision constraint severity: ${value}.`);
  }
}

function freezeList<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      clone[key] = cloneDeep(child);
    }

    return clone as T;
  }

  return value;
}

function freezeDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) {
      freezeDeep(item);
    }

    return Object.freeze(value) as T;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      freezeDeep(child);
    }

    return Object.freeze(value) as T;
  }

  return value;
}
