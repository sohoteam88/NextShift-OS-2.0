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
import { expansionEngine } from '@/modules/expansion/services/expansion-engine';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import { referralEngine } from '@/modules/referral/services/referral-engine';
import type { ReferralProjection } from '@/modules/referral/contracts/ReferralProjection';
import { getAnalyticsProjection } from '@/modules/analytics/adapters/AnalyticsProjectionAdapter';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import type { AICommandCenter, MissionBottleneck, MissionBusinessStage, MissionLifecycleStatus } from '@/modules/mission-engine/contracts/MissionAuthority';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';
import type { ExecutionPattern } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import type { AICOODecisionPriority, AICOODecisionConfidence } from '@/modules/ai-coo/contracts/AICOODecision';
import { autonomousExecutionEngine } from '@/modules/autonomous-execution/services/autonomous-execution-engine';
import type { ExecutionProjection } from '@/modules/autonomous-execution/contracts/AutonomousExecution';
import { agentWorkforceService } from '@/modules/agent-workforce/services/agent-workforce-service';
import type { AgentWorkforceProjection } from '@/modules/agent-workforce/contracts/AgentWorkforce';
import { emitDashboardProjectionConsumed } from '../telemetry/dashboard-telemetry';

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
    title: string;
    whyItMatters: string;
    expectedOutcome: string;
    estimatedTime: string;
    route: string;
    ctaLabel: string;
  };
  aiCommandCenter: AICommandCenter;
  missionEngine: {
    businessStage: MissionBusinessStage;
    bottleneck: MissionBottleneck;
    lifecycle: MissionLifecycleStatus;
    reasoning: string;
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
  expansion: ExpansionProjection;
  referral: ReferralProjection;
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
    { label: '漏斗工具', route: '/funnel-builder', unlocked: activated },
    { label: 'AI 工作队', route: '/ai-workforce', unlocked: advanced },
    { label: '数据分析', route: '/analytics', unlocked: advanced },
    { label: '设置', route: '/settings', unlocked: true },
  ];
}

function commandCenterFor(missionAuthority: Awaited<ReturnType<typeof missionEngineAuthorityService.getCurrentMission>>): AICommandCenter {
  return missionAuthority.dashboardCommandCenter ?? {
    currentStage: missionAuthority.businessStage ?? 'BRAND_FOUNDATION',
    missionTitle: missionAuthority.currentMission.title,
    missionDescription: missionAuthority.currentMission.description,
    reasoning: missionAuthority.explainability?.reasoning ?? missionAuthority.currentMission.description,
    expectedOutcome: missionAuthority.currentMission.expectedOutcome,
    estimatedTime: missionAuthority.estimatedCompletion.label,
    route: missionAuthority.currentMission.route,
    priority: missionAuthority.priorityAction?.priority ?? (missionAuthority.currentMission.priority >= 90 ? 'Critical' : missionAuthority.currentMission.priority >= 50 ? 'High' : 'Normal'),
  };
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
    completedStates: missionAuthority.explainability?.completed ?? [],
    missingRequirements: [missionAuthority.explainability?.currentGap ?? missionAuthority.bottleneck ?? 'NO_BRAND'],
    nextState: missionAuthority.businessStage,
    reasoning: missionAuthority.explainability?.reasoning ?? missionAuthority.dashboardCommandCenter?.reasoning ?? missionAuthority.currentMission.description,
  };
}

export async function getDashboardProjection(userId: string, tenantId?: string): Promise<DashboardProjection> {
  const [businessState, journeyState, missionAuthority, cooPlan, growthLoopState, analyticsProjection, businessContext, executions, workforce, growthProjection, optimization, activation, retention, value, expansion, referral] = await Promise.all([
    businessStateService.getBusinessState(userId),
    journeyStateService.getJourneyState(userId),
    missionEngineAuthorityService.getCurrentMission(userId),
    cooPlanService.getCOOPlan(userId),
    growthLoopStateService.getGrowthLoopState(userId),
    getAnalyticsProjection(userId, tenantId),
    businessContextMemoryService.getBusinessContext(userId, tenantId),
    autonomousExecutionEngine.getProjection(userId, tenantId),
    agentWorkforceService.getProjection(userId, tenantId),
    growthLoopEngine.getProjection(userId),
    optimizationEngine.getProjection(userId, tenantId),
    activationEngine.getProjection(userId, tenantId),
    retentionEngine.getProjection(userId, tenantId),
    valueRealizationEngine.getProjection(userId, tenantId),
    expansionEngine.getProjection(userId, tenantId),
    referralEngine.getProjection(userId, tenantId),
  ]);

  const readiness = clamp(businessState.readiness.percentage);
  const progress = clamp(missionAuthority.progress.completionPercentage);
  const growth = clamp(growthLoopState.overallScore);
  const leads = Math.max(0, Math.round(growthLoopState.acquisition?.leadCount ?? 0));
  const currentMission = missionAuthority.currentMission;
  const aiDecision = cooPlan.decision;
  const aiCommandCenter = commandCenterFor(missionAuthority);

  const projection: DashboardProjection = {
    versions: {
      businessStateVersion: analyticsProjection.businessStateVersion,
      journeyVersion: analyticsProjection.journeyVersion,
      cooPlanVersion: `${cooPlan.source}:${cooPlan.id}:${cooPlan.generatedAt}`,
      growthLoopVersion: analyticsProjection.growthLoopVersion,
    },
    currentJourney: missionAuthority.currentJourney,
    missionControl: {
      title: aiCommandCenter.missionTitle,
      whyItMatters: aiCommandCenter.missionDescription,
      expectedOutcome: aiCommandCenter.expectedOutcome,
      estimatedTime: aiCommandCenter.estimatedTime,
      route: aiCommandCenter.route,
      ctaLabel: '继续任务',
    },
    aiCommandCenter,
    missionEngine: {
      businessStage: missionAuthority.businessStage ?? aiCommandCenter.currentStage,
      bottleneck: missionAuthority.bottleneck ?? 'NO_BRAND',
      lifecycle: missionAuthority.lifecycle ?? 'ACTIVE',
      reasoning: missionAuthority.explainability?.reasoning ?? aiCommandCenter.reasoning,
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
    expansion,
    referral,
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

  return projection;
}
