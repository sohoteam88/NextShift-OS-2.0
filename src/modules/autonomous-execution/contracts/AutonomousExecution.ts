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

export type ExecutionState =
  | 'queued'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AutonomousExecutionAction = {
  actionId: string;
  decisionId: string;
  actionType: AutonomousActionType;
  title: string;
  reason: string;
  route?: string;
  priority: AICOODecisionPriority;
  executionMode: ExecutionMode;
  requiresApproval: boolean;
  estimatedImpact: 'low' | 'medium' | 'high';
  estimatedEffort: 'low' | 'medium' | 'high';
  successMetric: string;
  state: ExecutionState;
  createdAt: string;
  updatedAt: string;
  outcome?: string;
};

export type ExecutionProjection = {
  currentExecution: AutonomousExecutionAction | null;
  pendingApprovals: AutonomousExecutionAction[];
  completedExecutions: AutonomousExecutionAction[];
  queuedExecutions: AutonomousExecutionAction[];
  automationLevel: 'manual' | 'assisted' | 'autonomous';
};
