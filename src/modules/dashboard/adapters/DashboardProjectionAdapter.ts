import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { journeyStateService } from '@/modules/journey/services/JourneyStateService';
import { cooPlanService } from '@/modules/ai-coo/services/COOPlanService';
import { growthLoopStateService } from '@/modules/growth-loop/services/GrowthLoopStateService';
import { growthLoopEngine } from '@/modules/growth-loop/services/growth-loop-engine';
import type { GrowthProjection } from '@/modules/growth-loop/contracts/GrowthProjection';
import { optimizationEngine } from '@/modules/optimization/services/optimization-engine';
import type { OptimizationProjection } from '@/modules/optimization/contracts/OptimizationProjection';
import { activationEngine } from '@/modules/activation/services/activation-engine';
import type { ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';
import type { ValueProjection } from '@/modules/value/contracts/ValueProjection';
import { userSuccessEngine } from '@/modules/user-success/services/user-success-engine';
import type { UserSuccessProjection } from '@/modules/user-success/contracts/UserSuccessProjection';
import { expansionEngine } from '@/modules/expansion/services/expansion-engine';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import { referralEngine } from '@/modules/referral/services/referral-engine';
import type { ReferralProjection } from '@/modules/referral/contracts/ReferralProjection';
import { buildCustomerHealthProjection } from '@/modules/customer-health/services/customer-health-projection';
import type { CustomerHealthProjection } from '@/modules/customer-health/contracts/CustomerHealthProjection';
import { getAnalyticsProjection } from '@/modules/analytics/adapters/AnalyticsProjectionAdapter';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import type {
  AICommandCenter,
  MissionBottleneck,
  MissionBusinessStage,
  MissionLifecycleStatus,
  MissionStep,
  MissionType,
} from '@/modules/mission-engine/contracts/MissionAuthority';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';
import type { ExecutionPattern } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import type { AICOODecisionPriority, AICOODecisionConfidence } from '@/modules/ai-coo/contracts/AICOODecision';
import type { COOPlan } from '@/modules/ai-coo/contracts/COOPlan';
import { autonomousExecutionEngine } from '@/modules/autonomous-execution/services/autonomous-execution-engine';
import type { ExecutionProjection } from '@/modules/autonomous-execution/contracts/AutonomousExecution';
import { agentWorkforceService } from '@/modules/agent-workforce/services/agent-workforce-service';
import type { AgentWorkforceProjection } from '@/modules/agent-workforce/contracts/AgentWorkforce';
import type { FirstUserExperienceProjection } from '@/modules/product-experience/services/FirstUserExperienceService';
import { firstUserExperienceService } from '@/modules/product-experience/services/FirstUserExperienceService';
import prisma from '@/lib/prisma';
import { emitDashboardProjectionConsumed } from '../telemetry/dashboard-telemetry';

const STATIC_CTA_FALLBACK = 'Start Mission';

function missionWorkspaceRoute(missionId: string) {
  return `/mission/${encodeURIComponent(missionId)}`;
}

export type DashboardProjection = {
  versions: {
    businessStateVersion: string;
    journeyVersion: string;
    cooPlanVersion: string;
    growthLoopVersion: string;
  };
  currentJourney: {
    type: string;
    title: string;
    reason: string;
  };
  missionControl: {
    locale: string;
    source: string;
    title: string;
    objective: string;
    description: string;
    steps: MissionStep[];
    currentStep: MissionStep | null;
    progress: number;
    passedChecks: string[];
    failedChecks: string[];
    remainingChecks: number;
    nextRequiredCheck: string | null;
    verificationStatus: 'VERIFIED' | 'VERIFYING' | 'BLOCKED';
    successCriteria: string[];
    completionChecks: string[];
    missionType: MissionType;
    currentGap: string;
    completedItems: string[];
    reasoning: string;
    decisionReason: string;
    whyThis: string;
    whyNow: string;
    whyNotOthers: string;
    whyItMatters: string;
    expectedOutcome: string;
    expectedRisk: string;
    nextMilestone: string;
    estimatedTime: string;
    route: string;
    ctaLabel: string;
    priority: AICommandCenter['priority'];
  };
  firstUserExperience: FirstUserExperienceProjection;
  aiCommandCenter: AICommandCenter;
  missionEngine: {
    businessStage: MissionBusinessStage;
    bottleneck: MissionBottleneck;
    lifecycle: MissionLifecycleStatus;
    reasoning: string;
    severity: string;
  };
  businessState: {
    currentState: string;
    completedStates: string[];
    missingRequirements: string[];
    nextState: string;
    reasoning: string;
  };
  currentMission: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
  nextAction: {
    title: string;
    description: string;
    route: string;
  };
  aiDecision: {
    currentFocus: string;
    nextBestAction: {
      title: string;
      reason: string;
      route?: string;
      successMetric: string;
    };
    primaryRisk: {
      title: string;
      reason: string;
      priority: AICOODecisionPriority;
    } | null;
    primaryOpportunity: {
      title: string;
      reason: string;
      priority: AICOODecisionPriority;
    } | null;
    decisionReason: string;
    priority: AICOODecisionPriority;
    confidence: AICOODecisionConfidence;
  };
  readiness: {
    value: number;
    stage: string;
    bottleneckCount: number;
  };
  progress: {
    value: number;
    stage: string;
    currentMilestone: string;
    nextMilestone: string;
  };
  growth: {
    value: number;
    health: string;
    recommendationCount: number;
  };
  growthProjection: GrowthProjection;
  optimization: OptimizationProjection;
  activation: ActivationProjection;
  retention: RetentionProjection;
  value: ValueProjection;
  userSuccess: UserSuccessProjection;
  expansion: ExpansionProjection;
  referral: ReferralProjection;
  customerHealth: CustomerHealthProjection;
  snapshot: {
    readiness: number;
    progress: number;
    growth: number;
    leads: number;
  };
  progressPath: Array<{
    id: string;
    step: number;
    label: string;
    status: 'completed' | 'current' | 'locked';
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    summary: string;
    expectedOutcome: string;
    source: string;
    route?: string;
  }>;
  quickAccess: Array<{
    label: string;
    route: string;
    unlocked: boolean;
  }>;
  businessMemory: {
    currentFocus: string;
    recentWins: string[];
    blockedAreas: string[];
    recentActivities: Array<{
      title: string;
      summary: string;
      occurredAt: string;
    }>;
    executionPattern: ExecutionPattern;
  };
  executions: ExecutionProjection;
  workforce: AgentWorkforceProjection;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function quickAccessFor(input: { progress: number; readiness: number; growth: number; activation: ActivationProjection }) {
  const firstWinAchieved = input.activation.firstWin.achieved;
  const activated = !input.activation.shouldHideAdvancedModules && (input.progress >= 30 || input.readiness >= 50);
  const advanced = !input.activation.shouldHideAdvancedModules && firstWinAchieved && (input.progress >= 60 || input.growth >= 50);

  return [
    { label: '内容引擎', route: '/content-engine', unlocked: firstWinAchieved || activated },
    { label: '漏斗工具', route: '/funnel', unlocked: activated },
    { label: 'AI 工作队', route: '/ai-workforce', unlocked: advanced },
    { label: '数据分析', route: '/analytics', unlocked: advanced },
    { label: '设置', route: '/settings', unlocked: true },
  ];
}

const LABELS: Record<string, string> = {
  BRAND_FOUNDATION: '品牌基础',
  BRAND_POSITIONING: '品牌定位',
  CONTENT_SYSTEM: '内容系统',
  LEAD_MAGNET: '引流资源',
  FUNNEL: '双漏斗落地页',
  LEAD_GENERATION: '获客',
  SALES_CONVERSION: '销售转化',
  SALES: '销售转化',
  TEAM_BUILDING: '团队复制',
  NO_BRAND: 'AI 访谈还没完成',
  NO_POSITIONING: 'Brand DNA 还没确认',
  NO_CONTENT: '还没有稳定内容',
  NO_AUDIENCE: '目标受众还没清楚',
  NO_LEAD_MAGNET: '还没有引流资源',
  NO_FUNNEL: '还没有漏斗落地页',
  NO_TRAFFIC: '还没有流量测试',
  NO_LEADS: '还没有潜在客户进入漏斗',
  NO_CONVERSION: 'Leads 尚未转化',
  NO_CUSTOMERS: '有成交机会尚未完成',
  NO_SALES: '还没有第一笔成交',
  NO_RETENTION: '客户留存尚未系统化',
  BUSINESS_HEALTHY: '业务状态健康',
  NO_SYSTEM: '业务信号暂时不可用',
  NO_TEAM: '还没有团队复制系统',
  Traffic: '流量',
  'Traffic Source Active': '流量来源尚未启动',
  'First Lead Generated': '还没有产生第一位潜在客户',
  'AI Interview Completed': 'AI 访谈',
  'Brand DNA Confirmed': 'Brand DNA',
};

function humanLabel(value: string) {
  if (!LABELS[value] && !value.includes('_')) {
    return value.replace(/引流磁铁/g, '引流资源');
  }

  const label =
    LABELS[value] ??
    value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^\w/, (char) => char.toUpperCase());
  return label.replace(/引流磁铁/g, '引流资源');
}

function commandCenterFor(missionAuthority: Awaited<ReturnType<typeof missionEngineAuthorityService.getCurrentMission>>): AICommandCenter {
  const authorityCtaLabel = missionAuthority.dashboardCommandCenter?.ctaLabel
    ?? missionAuthority.priorityAction?.ctaLabel
    ?? missionAuthority.priorityResult?.ctaLabel
    ?? STATIC_CTA_FALLBACK;

  if (missionAuthority.dashboardCommandCenter) {
    return {
      ...missionAuthority.dashboardCommandCenter,
      ctaLabel: authorityCtaLabel,
    };
  }

  return missionAuthority.dashboardCommandCenter ?? {
    currentStage: missionAuthority.businessStage ?? 'BRAND_FOUNDATION',
    missionTitle: missionAuthority.currentMission.title,
    missionDescription: missionAuthority.currentMission.description,
    reasoning: missionAuthority.explainability.reasoning,
    expectedOutcome: missionAuthority.explainability.expectedOutcome,
    estimatedTime: missionAuthority.estimatedCompletion.label,
    route: missionAuthority.currentMission.route,
    ctaLabel: authorityCtaLabel,
    decisionReason: missionAuthority.explainability.decisionReason,
    priority: missionAuthority.priorityAction?.priority ?? (missionAuthority.currentMission.priority >= 90 ? 'Critical' : missionAuthority.currentMission.priority >= 50 ? 'High' : 'Normal'),
  };
}

async function recordMissionDecisionAudit(input: {
  tenantId?: string;
  userId: string;
  projection: DashboardProjection;
  missionAuthority: Awaited<ReturnType<typeof missionEngineAuthorityService.getCurrentMission>>;
}) {
  if (!input.tenantId || process.env.NODE_ENV === 'test') return;

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: 'mission.decision.projected',
        targetType: 'mission',
        metadata: {
          currentState: input.projection.businessState.currentState,
          bottleneck: input.projection.missionEngine.bottleneck,
          missionId: input.projection.currentMission.id,
          missionTitle: input.projection.missionControl.title,
          missionEvent: 'Mission Generated',
          missionType: input.missionAuthority.priorityAction.missionType,
          priorityAction: input.missionAuthority.priorityResult.priorityAction,
          explainabilitySource: input.projection.missionControl.source,
          objective: input.projection.missionControl.objective,
          steps: input.projection.missionControl.steps,
          completionChecks: input.projection.missionControl.completionChecks,
          completionPercentage: input.missionAuthority.missionCompletion.completionPercentage,
          passedChecks: input.missionAuthority.missionCompletion.passedChecks,
          failedChecks: input.missionAuthority.missionCompletion.failedChecks,
          nextRequiredCheck: input.missionAuthority.missionCompletion.nextRequiredCheck,
          verificationStatus: input.missionAuthority.missionCompletion.verificationStatus,
          verificationSource: input.missionAuthority.missionCompletion.verificationSource,
          verificationTimestamp: input.missionAuthority.missionCompletion.verifiedAt,
          completionResult: input.missionAuthority.missionCompletion,
          locale: input.projection.missionControl.locale,
          reasoning: input.projection.missionControl.reasoning,
          whyThis: input.projection.missionControl.whyThis,
          whyNow: input.projection.missionControl.whyNow,
          whyNotOthers: input.projection.missionControl.whyNotOthers,
          expectedOutcome: input.projection.missionControl.expectedOutcome,
          expectedRisk: input.projection.missionControl.expectedRisk,
          nextMilestone: input.projection.missionControl.nextMilestone,
          route: input.projection.missionControl.route,
          completionStatus: input.projection.currentMission.status,
        },
      },
    });
  } catch {
    // Dashboard rendering should not fail because audit telemetry is unavailable.
  }
}

function dashboardBusinessStateFor(
  businessState: Awaited<ReturnType<typeof businessStateService.getBusinessState>>,
  missionAuthority: Awaited<ReturnType<typeof missionEngineAuthorityService.getCurrentMission>>,
): DashboardProjection['businessState'] {
  if (businessState.stateResult) {
    return {
      currentState: businessState.stateResult.currentState,
      completedStates: businessState.stateResult.completedStates,
      missingRequirements: businessState.stateResult.missingRequirements,
      nextState: businessState.stateResult.nextState,
      reasoning: businessState.stateResult.explainability.reason,
    };
  }

  return {
    currentState: missionAuthority.businessStage,
    completedStates: missionAuthority.explainability.completed,
    missingRequirements: [missionAuthority.explainability.currentGap],
    nextState: missionAuthority.businessStage,
    reasoning: missionAuthority.explainability.reasoning,
  };
}

type MissionAuthorityProjection = Awaited<ReturnType<typeof missionEngineAuthorityService.getCurrentMission>>;

function missionStageToBusinessStage(stage: MissionBusinessStage): BusinessState['stage'] {
  switch (stage) {
    case 'BRAND_FOUNDATION':
      return 'foundation';
    case 'BRAND_POSITIONING':
      return 'audience_defined';
    case 'CONTENT_SYSTEM':
      return 'content_active';
    case 'LEAD_MAGNET':
    case 'FUNNEL':
      return 'offer_defined';
    case 'LEAD_GENERATION':
      return 'lead_generation';
    case 'SALES':
      return 'customer_acquisition';
    case 'TEAM_BUILDING':
      return 'growth';
  }
}

function fallbackBusinessStateFor(missionAuthority: MissionAuthorityProjection): BusinessState {
  return {
    stage: missionStageToBusinessStage(missionAuthority.businessStage),
    readiness: {
      source: 'DashboardProjectionAdapter',
      scope: 'user',
      confidence: 'fallback',
      fallback: 'business_state_unavailable',
      score: 0,
      maxScore: 100,
      percentage: 0,
    },
    bottlenecks: [],
    opportunities: [],
    stateResult: {
      currentState: missionAuthority.businessStage,
      completedStates: [],
      missingRequirements: [missionAuthority.explainability.currentGap],
      nextState: missionAuthority.businessStage,
      readinessScore: 0,
      explainability: {
        completed: [],
        missing: [
          {
            id: missionAuthority.explainability.currentGap,
            label: missionAuthority.explainability.currentGap,
            completed: false,
          },
        ],
        reason: missionAuthority.explainability.reasoning,
      },
    },
  };
}

function fallbackCOOPlanFor(userId: string, missionAuthority: MissionAuthorityProjection): COOPlan {
  const mission = missionAuthority.currentMission;
  const generatedAt = new Date().toISOString();
  const decision = {
    decisionId: `coo-decision-fallback-${userId}-${mission.id}`,
    focusArea: 'activate_user' as const,
    currentFocus: mission.title,
    reason: missionAuthority.explainability.reasoning,
    priority: 'medium' as const,
    confidence: 'low' as const,
    estimatedImpact: 'medium' as const,
    estimatedEffort: 'medium' as const,
    recommendedAction: {
      id: `fallback-action-${mission.id}`,
      title: mission.title,
      reason: missionAuthority.explainability.reasoning,
      route: mission.route,
      successMetric: mission.expectedOutcome,
    },
    nextBestAction: {
      id: `fallback-action-${mission.id}`,
      title: mission.title,
      reason: missionAuthority.explainability.reasoning,
      route: mission.route,
      successMetric: mission.expectedOutcome,
    },
    successMetric: mission.expectedOutcome,
    primaryRisk: null,
    primaryOpportunity: null,
    recommendedMission: {
      id: mission.id,
      title: mission.title,
      route: mission.route,
    },
    decisionReason: missionAuthority.explainability.decisionReason,
    supportingActions: [],
  };

  return {
    source: 'DashboardProjectionAdapter',
    scope: 'user',
    confidence: 'fallback',
    fallback: 'coo_plan_unavailable',
    id: `coo-plan-fallback-${userId}`,
    subjectId: userId,
    generatedAt,
    horizon: 'today',
    strategicFocus: mission.title,
    decision,
    recommendations: [],
    assignments: [],
    delegations: [],
  };
}

export async function getDashboardProjection(userId: string, tenantId?: string): Promise<DashboardProjection> {
  const businessStatePromise = businessStateService.getBusinessState(userId);
  const [businessStateSettled, journeyState, growthLoopState, businessContext, executions, workforce, growthProjection, optimization, activation, retention, value, userSuccess, expansion, referral] = await Promise.all([
    businessStatePromise.then(
      (value) => ({ status: 'fulfilled' as const, value }),
      (reason) => ({ status: 'rejected' as const, reason }),
    ),
    journeyStateService.getJourneyState(userId),
    growthLoopStateService.getGrowthLoopState(userId),
    businessContextMemoryService.getBusinessContext(userId, tenantId),
    autonomousExecutionEngine.getProjection(userId, tenantId),
    agentWorkforceService.getProjection(userId, tenantId),
    growthLoopEngine.getProjection(userId),
    optimizationEngine.getProjection(userId, tenantId),
    activationEngine.getProjection(userId, tenantId),
    retentionEngine.getProjection(userId, tenantId),
    valueRealizationEngine.getProjection(userId, tenantId),
    userSuccessEngine.getProjection(userId, tenantId),
    expansionEngine.getProjection(userId, tenantId),
    referralEngine.getProjection(userId, tenantId),
  ]);
  const missionAuthority = await missionEngineAuthorityService.getCurrentMission(userId, {
    businessState: businessStateSettled.status === 'fulfilled'
      ? businessStateSettled.value.stateResult
      : null,
  });
  const businessState = businessStateSettled.status === 'fulfilled'
    ? businessStateSettled.value
    : fallbackBusinessStateFor(missionAuthority);
  const analyticsProjection = await getAnalyticsProjection(userId, tenantId, {
    businessState,
    journeyState,
    growthLoopState,
  });
  const cooPlan = await cooPlanService.getCOOPlan(userId, {
    businessState: businessStateSettled.status === 'fulfilled' ? businessStateSettled.value : undefined,
    missionAuthority,
  }).catch(() => fallbackCOOPlanFor(userId, missionAuthority));

  const readiness = clamp(businessState.readiness.percentage);
  const progress = clamp(missionAuthority.progress.completionPercentage);
  const growth = clamp(growthLoopState.overallScore);
  const leads = Math.max(0, Math.round(growthLoopState.acquisition?.leadCount ?? 0));
  const currentMission = missionAuthority.currentMission;
  const aiDecision = cooPlan.decision;
  const aiCommandCenter = commandCenterFor(missionAuthority);
  const currentGap = missionAuthority.bottleneck ?? 'NO_BRAND';
  const completedItems = missionAuthority.progress.progressPath
    .filter((step) => step.status === 'completed')
    .map((step) => humanLabel(step.label))
    .slice(-3);
  const missionReason = missionAuthority.explainability.whyThis;
  const decisionReason = missionAuthority.explainability.whyNotOthers;
  const whyThis = missionAuthority.explainability.whyThis;
  const whyNow = missionAuthority.explainability.whyNow;
  const whyNotOthers = missionAuthority.explainability.whyNotOthers;
  const expectedOutcome = missionAuthority.explainability.expectedOutcome;
  const expectedRisk = missionAuthority.explainability.expectedRisk;
  const nextMilestone = missionAuthority.explainability.nextMilestone;
  const currentStepIndex = Math.min(
    missionAuthority.missionCompletion.passedChecks.length,
    Math.max(missionAuthority.missionPlan.steps.length - 1, 0),
  );
  const currentStep = missionAuthority.missionCompletion.completed
    ? null
    : missionAuthority.missionPlan.steps[currentStepIndex] ?? null;
  const missionPlanProgress = missionAuthority.missionCompletion.completionPercentage;
  const customerHealth = buildCustomerHealthProjection({
    generatedAt: new Date().toISOString(),
    activationProjection: activation,
    userSuccessProjection: userSuccess,
    retentionProjection: retention,
    expansionProjection: expansion,
    referralProjection: referral,
    locale: activation.localization.locale,
    personalization: {
      businessModel: expansion.personalization.businessModel,
      stage: expansion.expansionState.currentExpansionStage,
    },
  });

  const missionControl: DashboardProjection['missionControl'] = {
    title: aiCommandCenter.missionTitle,
    locale: missionAuthority.explainability.locale,
    source: missionAuthority.explainability.source,
    objective: missionAuthority.missionPlan.objective,
    description: missionAuthority.missionPlan.description,
    steps: missionAuthority.missionPlan.steps,
    currentStep,
    progress: missionPlanProgress,
    passedChecks: missionAuthority.missionCompletion.passedChecks,
    failedChecks: missionAuthority.missionCompletion.failedChecks,
    remainingChecks: missionAuthority.missionCompletion.failedChecks.length,
    nextRequiredCheck: missionAuthority.missionCompletion.nextRequiredCheck,
    verificationStatus: missionAuthority.missionCompletion.verificationStatus,
    successCriteria: missionAuthority.missionPlan.successCriteria,
    completionChecks: missionAuthority.missionPlan.completionChecks,
    missionType: missionAuthority.missionPlan.missionType,
    currentGap: humanLabel(currentGap),
    completedItems,
    reasoning: missionReason,
    decisionReason,
    whyThis,
    whyNow,
    whyNotOthers,
    whyItMatters: aiCommandCenter.missionDescription,
    expectedOutcome,
    expectedRisk,
    nextMilestone,
    estimatedTime: aiCommandCenter.estimatedTime,
    route: missionWorkspaceRoute(missionAuthority.missionPlan.id),
    ctaLabel: aiCommandCenter.ctaLabel ?? STATIC_CTA_FALLBACK,
    priority: aiCommandCenter.priority,
  };

  const projection: DashboardProjection = {
    versions: {
      businessStateVersion: analyticsProjection.businessStateVersion,
      journeyVersion: analyticsProjection.journeyVersion,
      cooPlanVersion: `${cooPlan.source}:${cooPlan.id}:${cooPlan.generatedAt}`,
      growthLoopVersion: analyticsProjection.growthLoopVersion,
    },
    currentJourney: missionAuthority.currentJourney,
    missionControl,
    firstUserExperience: firstUserExperienceService.buildForDashboard({
      activation,
      missionControl,
    }),
    aiCommandCenter,
    missionEngine: {
      businessStage: missionAuthority.businessStage ?? aiCommandCenter.currentStage,
      bottleneck: missionAuthority.bottleneck ?? 'NO_BRAND',
      lifecycle: missionAuthority.lifecycle ?? 'ACTIVE',
      reasoning: missionAuthority.explainability.reasoning,
      severity: missionAuthority.bottleneckResult.severity,
    },
    businessState: dashboardBusinessStateFor(businessState, missionAuthority),
    currentMission: {
      id: currentMission.id,
      title: currentMission.title,
      description: currentMission.description,
      status: currentMission.status,
    },
    nextAction: {
      title: aiDecision.nextBestAction.title,
      description: aiDecision.nextBestAction.reason,
      route: aiDecision.nextBestAction.route ?? currentMission.route,
    },
    aiDecision: {
      currentFocus: aiDecision.currentFocus,
      nextBestAction: {
        title: aiDecision.nextBestAction.title,
        reason: aiDecision.nextBestAction.reason,
        route: aiDecision.nextBestAction.route,
        successMetric: aiDecision.nextBestAction.successMetric,
      },
      primaryRisk: aiDecision.primaryRisk ? {
        title: aiDecision.primaryRisk.title,
        reason: aiDecision.primaryRisk.reason,
        priority: aiDecision.primaryRisk.priority,
      } : null,
      primaryOpportunity: aiDecision.primaryOpportunity ? {
        title: aiDecision.primaryOpportunity.title,
        reason: aiDecision.primaryOpportunity.reason,
        priority: aiDecision.primaryOpportunity.priority,
      } : null,
      decisionReason: aiDecision.decisionReason,
      priority: aiDecision.priority,
      confidence: aiDecision.confidence,
    },
    readiness: {
      value: readiness,
      stage: businessState.stage,
      bottleneckCount: businessState.bottlenecks.length,
    },
    progress: {
      value: progress,
      stage: journeyState.stage,
      currentMilestone: currentMission.title,
      nextMilestone: missionAuthority.progress.nextMilestone,
    },
    growth: {
      value: growth,
      health: growthLoopState.health,
      recommendationCount: growthLoopState.recommendations.length,
    },
    growthProjection,
    optimization,
    activation,
    retention,
    value,
    userSuccess,
    expansion,
    referral,
    customerHealth,
    snapshot: {
      readiness,
      progress,
      growth,
      leads,
    },
    progressPath: missionAuthority.progress.progressPath,
    recommendations: cooPlan.recommendations.slice(0, 1).map((recommendation) => ({
      id: recommendation.id,
      title: recommendation.title,
      summary: recommendation.summary,
      expectedOutcome: recommendation.expectedOutcome,
      source: recommendation.recommendationSource,
      route: recommendation.relatedRoute,
    })),
    quickAccess: quickAccessFor({ progress, readiness, growth, activation }),
    businessMemory: {
      currentFocus: businessContext.currentFocus,
      recentWins: businessContext.completedMilestones.slice(0, 3),
      blockedAreas: businessContext.blockedAreas,
      recentActivities: businessContext.recentActivities.slice(0, 3).map((activity) => ({
        title: activity.title,
        summary: activity.summary,
        occurredAt: activity.occurredAt,
      })),
      executionPattern: businessContext.executionPattern,
    },
    executions,
    workforce,
  };

  emitDashboardProjectionConsumed({
    userId,
    tenantId,
    ...projection.versions,
  });

  await recordMissionDecisionAudit({ userId, tenantId, projection, missionAuthority });

  return projection;
}
