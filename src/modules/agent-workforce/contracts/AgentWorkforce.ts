import type { AgentId } from '@/modules/ai/types/agents';
import type {
  AutonomousActionType,
  AutonomousExecutionAction,
  ExecutionLevel,
  GuardrailDecision,
} from '@/modules/autonomous-execution/contracts/AutonomousExecution';
import type { MissionType } from '@/modules/mission-engine/contracts/MissionAuthority';

export type WorkforceAgentType =
  | 'coo_agent'
  | 'content_agent'
  | 'lead_magnet_agent'
  | 'funnel_agent'
  | 'landing_page_agent'
  | 'traffic_agent'
  | 'analytics_agent'
  | 'crm_agent'
  | 'offer_agent'
  | 'sop_generator_agent';

export type WorkforceTaskStatus =
  | 'assigned'
  | 'running'
  | 'completed'
  | 'failed'
  | 'approval_required';

export type WorkforceAgentDefinition = {
  agentType: WorkforceAgentType;
  runtimeAgentId: AgentId;
  name: string;
  capabilities: string[];
  supportedActions: AutonomousActionType[];
  priority: number;
  availability: 'available' | 'limited' | 'offline';
};

export type WorkforceAssignment = {
  assignmentId: string;
  actionId: string;
  agentType: WorkforceAgentType;
  runtimeAgentId: AgentId;
  action: AutonomousExecutionAction;
  status: WorkforceTaskStatus;
  priority: AutonomousExecutionAction['priority'];
  reason: string;
};

export type WorkforceExecutionResult = {
  assignmentId: string;
  actionId: string;
  agentType: WorkforceAgentType;
  status: WorkforceTaskStatus;
  output: Record<string, unknown>;
  confidence: 'low' | 'medium' | 'high';
  executionSummary: string;
  recommendedNextAction?: string;
  completedAt: string;
};

export type AgentPerformanceSummary = {
  agentType: WorkforceAgentType;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
};

export type AgentWorkforceProjection = {
  activeAgents: WorkforceAgentDefinition[];
  completedAgentTasks: WorkforceExecutionResult[];
  agentPerformance: AgentPerformanceSummary[];
  currentAssignments: WorkforceAssignment[];
};

export type WorkforceMode = 'sequential' | 'parallel' | 'hybrid';

export type WorkforceAssignmentQueueState =
  | 'QUEUED'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'WAITING';

export type WorkforceDependencyGraphNode = {
  assignmentId: string;
  dependsOn: string[];
  unlocks: string[];
};

export type WorkforcePlanAssignment = {
  assignmentId: string;
  agentId: string;
  agentType: WorkforceAgentType;
  agentName: string;
  task: string;
  actionId: string;
  assetType: string;
  dependsOn: string[];
  executionLevel: ExecutionLevel;
  status: WorkforceAssignmentQueueState;
  outputAssetIds: string[];
  handoffFrom: string[];
  handoffTo: string[];
  guardrail: GuardrailDecision;
};

export type WorkforcePlan = {
  missionId: string;
  missionType: MissionType;
  mode: WorkforceMode;
  agents: WorkforcePlanAssignment[];
  dependencyGraph: WorkforceDependencyGraphNode[];
  currentAssignmentId?: string;
  verificationBoundary: 'workforce_completion_not_mission_completion';
};
