import type { AICOODecisionPriority } from '@/modules/ai-coo/contracts/AICOODecision';

export type AutonomousActionType =
  | 'CONTENT_GENERATION'
  | 'LEAD_MAGNET_GENERATION'
  | 'LANDING_PAGE_GENERATION'
  | 'FUNNEL_GENERATION'
  | 'TASK_CREATION'
  | 'REPORT_GENERATION'
  | 'CRM_UPDATE';

export type ExecutionMode = 'manual' | 'assisted' | 'autonomous';
export type AutonomousTriggerType = 'scheduled' | 'mission' | 'event' | 'manual';
export type AutonomousStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'CANCELLED';

export type ExecutionLevel =
  | 'READ_ONLY'
  | 'GENERATE'
  | 'PREPARE'
  | 'APPROVAL_REQUIRED'
  | 'AUTONOMOUS'
  | 'FORBIDDEN';

export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'blocked';

export type ExecutionState =
  | 'queued'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export type AutonomousExecutionAction = {
  actionId: string;
  decisionId: string;
  actionType: AutonomousActionType;
  title: string;
  reason: string;
  route?: string;
  agentId?: string;
  triggerType?: AutonomousTriggerType;
  priority: AICOODecisionPriority;
  executionMode: ExecutionMode;
  requiresApproval: boolean;
  estimatedImpact: 'low' | 'medium' | 'high';
  estimatedEffort: 'low' | 'medium' | 'high';
  successMetric: string;
  riskClass?: RiskClass;
  executionLevel?: ExecutionLevel;
  approvalStatus?: ApprovalStatus;
  approvalExpiresAt?: string;
  guardrail?: GuardrailDecision;
  state: ExecutionState;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string | null;
  assetIds?: string[];
  outcome?: string;
};

export type GuardrailDecision = {
  action: string;
  risk: RiskClass;
  executionLevel: ExecutionLevel;
  approvalRequired: boolean;
  approvalStatus: ApprovalStatus;
  allowed: boolean;
  autonomousAllowed: boolean;
  reason: string;
  requestedBy?: string;
  approvedBy?: string;
  affectedResources: string[];
  evaluatedAt: string;
  expiresAt?: string;
};

export type AutonomousPolicy = {
  action: string;
  risk: RiskClass;
  executionLevel: ExecutionLevel;
  approvalRequired: boolean;
};

export type AgentCapability = {
  action: string;
  executionLevel: ExecutionLevel;
};

export type AutonomousExecution = {
  id: string;
  action: string;
  agent: string;
  executionLevel: number;
  triggerType: AutonomousTriggerType;
  status: AutonomousStatus;
  startedAt: string;
  completedAt: string | null;
};

export type ExecutionProjection = {
  currentExecution: AutonomousExecutionAction | null;
  pendingApprovals: AutonomousExecutionAction[];
  completedExecutions: AutonomousExecutionAction[];
  queuedExecutions: AutonomousExecutionAction[];
  automationLevel: 'manual' | 'assisted' | 'autonomous';
};
