import prisma from '@/lib/prisma';
import type { AICOODecision } from '@/modules/ai-coo/contracts/AICOODecision';
import type {
  ApprovalStatus,
  AutonomousActionType,
  AutonomousPolicy,
  ExecutionLevel,
  GuardrailDecision,
  RiskClass,
} from '../contracts/AutonomousExecution';

const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

const BASE_POLICIES: Record<AutonomousActionType, AutonomousPolicy> = {
  CONTENT_GENERATION: {
    action: 'CONTENT_GENERATION',
    risk: 'MEDIUM',
    executionLevel: 'GENERATE',
    approvalRequired: false,
  },
  LEAD_MAGNET_GENERATION: {
    action: 'LEAD_MAGNET_GENERATION',
    risk: 'MEDIUM',
    executionLevel: 'GENERATE',
    approvalRequired: false,
  },
  LANDING_PAGE_GENERATION: {
    action: 'LANDING_PAGE_GENERATION',
    risk: 'MEDIUM',
    executionLevel: 'GENERATE',
    approvalRequired: false,
  },
  FUNNEL_GENERATION: {
    action: 'FUNNEL_GENERATION',
    risk: 'MEDIUM',
    executionLevel: 'PREPARE',
    approvalRequired: false,
  },
  TASK_CREATION: {
    action: 'TASK_CREATION',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  REPORT_GENERATION: {
    action: 'REPORT_GENERATION',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  CRM_UPDATE: {
    action: 'CRM_UPDATE',
    risk: 'HIGH',
    executionLevel: 'APPROVAL_REQUIRED',
    approvalRequired: true,
  },
};

const AUTONOMOUS_LEVEL_4_POLICIES: Record<string, AutonomousPolicy> = {
  AUTO_GENERATE_WEEKLY_CONTENT_DRAFTS: {
    action: 'AUTO_GENERATE_WEEKLY_CONTENT_DRAFTS',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_CONTENT_DRAFT: {
    action: 'AUTO_GENERATE_CONTENT_DRAFT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_LEAD_MAGNET_DRAFT: {
    action: 'AUTO_GENERATE_LEAD_MAGNET_DRAFT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_FUNNEL_DRAFT: {
    action: 'AUTO_GENERATE_FUNNEL_DRAFT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_CRM_FOLLOW_UP_DRAFT: {
    action: 'AUTO_GENERATE_CRM_FOLLOW_UP_DRAFT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_OFFER_DRAFT: {
    action: 'AUTO_GENERATE_OFFER_DRAFT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_INTERNAL_REPORT: {
    action: 'AUTO_GENERATE_INTERNAL_REPORT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_SOP_DRAFT: {
    action: 'AUTO_GENERATE_SOP_DRAFT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_MEETING_NOTES: {
    action: 'AUTO_GENERATE_MEETING_NOTES',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_REFRESH_ANALYTICS_SUMMARY: {
    action: 'AUTO_REFRESH_ANALYTICS_SUMMARY',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
  AUTO_GENERATE_OPPORTUNITY_REPORT: {
    action: 'AUTO_GENERATE_OPPORTUNITY_REPORT',
    risk: 'LOW',
    executionLevel: 'AUTONOMOUS',
    approvalRequired: false,
  },
};

const CRITICAL_FORBIDDEN_PATTERNS = [
  /delete/i,
  /override/i,
  /mark.*mission.*complete/i,
  /mission.*complete/i,
  /modify.*verification/i,
  /verification.*result/i,
  /completion.*check/i,
  /change.*business.*state/i,
  /business.*state/i,
  /change.*bottleneck/i,
  /bottleneck/i,
  /change.*priority/i,
  /priority/i,
  /explainability/i,
  /mission.*generator/i,
  /revenue.*record/i,
];

const HIGH_RISK_PATTERNS = [
  /publish/i,
  /deploy/i,
  /send/i,
  /activate/i,
  /launch/i,
];

const MEDIUM_RISK_PATTERNS = [
  /generate/i,
  /create/i,
  /draft/i,
  /lead.*magnet/i,
  /landing.*page/i,
  /funnel/i,
  /offer/i,
  /content/i,
];

function matchesAny(action: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(action));
}

export function isAutonomyEnabled() {
  return process.env.AI_AUTONOMY_ENABLED !== 'false';
}

function policyFromAction(action: string): AutonomousPolicy {
  const autonomousPolicy = AUTONOMOUS_LEVEL_4_POLICIES[action];
  if (autonomousPolicy) return autonomousPolicy;

  const basePolicy = BASE_POLICIES[action as AutonomousActionType];
  if (basePolicy) return basePolicy;

  if (matchesAny(action, CRITICAL_FORBIDDEN_PATTERNS)) {
    return {
      action,
      risk: 'CRITICAL',
      executionLevel: 'FORBIDDEN',
      approvalRequired: false,
    };
  }

  if (matchesAny(action, HIGH_RISK_PATTERNS)) {
    return {
      action,
      risk: 'HIGH',
      executionLevel: 'APPROVAL_REQUIRED',
      approvalRequired: true,
    };
  }

  if (matchesAny(action, MEDIUM_RISK_PATTERNS)) {
    return {
      action,
      risk: 'MEDIUM',
      executionLevel: 'GENERATE',
      approvalRequired: false,
    };
  }

  return {
    action,
    risk: 'LOW',
    executionLevel: 'READ_ONLY',
    approvalRequired: false,
  };
}

function decisionOverride(input: {
  policy: AutonomousPolicy;
  decision?: AICOODecision;
}): AutonomousPolicy {
  const decision = input.decision;
  if (!decision) return input.policy;

  const text = [
    decision.focusArea,
    decision.currentFocus,
    decision.nextBestAction.title,
    decision.nextBestAction.reason,
    decision.nextBestAction.route,
  ].filter(Boolean).join(' ');

  if (matchesAny(text, CRITICAL_FORBIDDEN_PATTERNS)) {
    return {
      ...input.policy,
      risk: 'CRITICAL',
      executionLevel: 'FORBIDDEN',
      approvalRequired: false,
    };
  }

  if (decision.focusArea === 'launch_offer' || matchesAny(text, HIGH_RISK_PATTERNS)) {
    return {
      ...input.policy,
      risk: 'HIGH',
      executionLevel: 'APPROVAL_REQUIRED',
      approvalRequired: true,
    };
  }

  if (input.policy.executionLevel === 'AUTONOMOUS' && decision.priority === 'critical') {
    return {
      ...input.policy,
      risk: 'HIGH',
      executionLevel: 'APPROVAL_REQUIRED',
      approvalRequired: true,
    };
  }

  return input.policy;
}

function approvalStatusFor(input: {
  policy: AutonomousPolicy;
  allowed: boolean;
  approvedBy?: string;
}): ApprovalStatus {
  if (!input.allowed) return 'blocked';
  if (input.approvedBy) return 'approved';
  if (input.policy.approvalRequired) return 'pending';
  return 'not_required';
}

function allowedFor(policy: AutonomousPolicy) {
  if (policy.executionLevel === 'FORBIDDEN') return false;
  if (policy.executionLevel === 'AUTONOMOUS' && !isAutonomyEnabled()) return false;
  return true;
}

function reasonFor(input: {
  policy: AutonomousPolicy;
  allowed: boolean;
}) {
  if (input.policy.executionLevel === 'FORBIDDEN') return 'Action is permanently forbidden for agents.';
  if (input.policy.executionLevel === 'AUTONOMOUS' && !isAutonomyEnabled()) return 'Autonomous execution is disabled by kill switch.';
  if (input.policy.approvalRequired) return 'Action affects live systems and requires user approval.';
  return 'Action is allowed inside configured guardrails.';
}

export function evaluateGuardrail(input: {
  action: string;
  decision?: AICOODecision;
  requestedBy?: string;
  approvedBy?: string;
  affectedResources?: string[];
  now?: Date;
}): GuardrailDecision {
  const now = input.now ?? new Date();
  const policy = decisionOverride({
    policy: policyFromAction(input.action),
    decision: input.decision,
  });
  const allowed = allowedFor(policy);
  const approvalStatus = approvalStatusFor({
    policy,
    allowed,
    approvedBy: input.approvedBy,
  });
  const expiresAt = policy.approvalRequired
    ? new Date(now.getTime() + APPROVAL_TTL_MS).toISOString()
    : undefined;

  return {
    action: input.action,
    risk: policy.risk,
    executionLevel: policy.executionLevel,
    approvalRequired: policy.approvalRequired,
    approvalStatus,
    allowed,
    autonomousAllowed: allowed && policy.executionLevel === 'AUTONOMOUS' && !policy.approvalRequired,
    reason: reasonFor({ policy, allowed }),
    requestedBy: input.requestedBy,
    approvedBy: input.approvedBy,
    affectedResources: input.affectedResources ?? [],
    evaluatedAt: now.toISOString(),
    expiresAt,
  };
}

export function guardrailStateFor(decision: GuardrailDecision) {
  if (!decision.allowed) return 'cancelled' as const;
  return 'queued' as const;
}

export function riskFor(action: string): RiskClass {
  return evaluateGuardrail({ action }).risk;
}

export function executionLevelFor(action: string): ExecutionLevel {
  return evaluateGuardrail({ action }).executionLevel;
}

export function isApprovalExpired(input: {
  expiresAt?: string;
  now?: Date;
}) {
  if (!input.expiresAt) return false;
  return new Date(input.expiresAt).getTime() < (input.now ?? new Date()).getTime();
}

export async function writeGuardrailAudit(input: {
  tenantId: string;
  actorId: string;
  action: 'agent.action.executed' | 'agent.action.rejected' | 'agent.action.approved' | 'agent.action.blocked';
  guardrail: GuardrailDecision;
  targetId?: string;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      targetType: 'autonomous_guardrail',
      targetId: input.targetId,
      metadata: {
        guardrail: input.guardrail,
        action: input.guardrail.action,
        executionLevel: input.guardrail.executionLevel,
        approvalStatus: input.guardrail.approvalStatus,
        risk: input.guardrail.risk,
        affectedResources: input.guardrail.affectedResources,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

export const guardrailEngine = {
  evaluate: evaluateGuardrail,
  guardrailStateFor,
  riskFor,
  executionLevelFor,
  isApprovalExpired,
  writeAudit: writeGuardrailAudit,
  isAutonomyEnabled,
};
