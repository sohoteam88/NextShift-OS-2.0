import { beforeEach, describe, expect, it, vi } from 'vitest';

const businessMocks = vi.hoisted(() => ({
  businessStateService: { getBusinessState: vi.fn() },
}));

const journeyMocks = vi.hoisted(() => ({
  journeyStateService: { getJourneyState: vi.fn() },
}));

const cooMocks = vi.hoisted(() => ({
  cooPlanService: { getCOOPlan: vi.fn() },
}));

const growthMocks = vi.hoisted(() => ({
  growthLoopStateService: { getGrowthLoopState: vi.fn() },
}));

const growthProjectionMocks = vi.hoisted(() => ({
  growthLoopEngine: { getProjection: vi.fn() },
}));

const optimizationMocks = vi.hoisted(() => ({
  optimizationEngine: { getProjection: vi.fn() },
}));

const activationMocks = vi.hoisted(() => ({
  activationEngine: { getProjection: vi.fn() },
}));

const retentionMocks = vi.hoisted(() => ({
  retentionEngine: { getProjection: vi.fn() },
}));

const valueMocks = vi.hoisted(() => ({
  valueRealizationEngine: { getProjection: vi.fn() },
}));

const expansionMocks = vi.hoisted(() => ({
  expansionEngine: { getProjection: vi.fn() },
}));

const referralMocks = vi.hoisted(() => ({
  referralEngine: { getProjection: vi.fn() },
}));

const analyticsMocks = vi.hoisted(() => ({
  getAnalyticsProjection: vi.fn(),
}));

const missionMocks = vi.hoisted(() => ({
  missionEngineAuthorityService: { getCurrentMission: vi.fn() },
}));

const memoryMocks = vi.hoisted(() => ({
  businessContextMemoryService: { getBusinessContext: vi.fn() },
}));

const executionMocks = vi.hoisted(() => ({
  autonomousExecutionEngine: { getProjection: vi.fn() },
}));

const workforceMocks = vi.hoisted(() => ({
  agentWorkforceService: { getProjection: vi.fn() },
}));

vi.mock('@/modules/business-state/services/BusinessStateService', () => businessMocks);
vi.mock('@/modules/journey/services/JourneyStateService', () => journeyMocks);
vi.mock('@/modules/ai-coo/services/COOPlanService', () => cooMocks);
vi.mock('@/modules/growth-loop/services/GrowthLoopStateService', () => growthMocks);
vi.mock('@/modules/growth-loop/services/growth-loop-engine', () => growthProjectionMocks);
vi.mock('@/modules/optimization/services/optimization-engine', () => optimizationMocks);
vi.mock('@/modules/activation/services/activation-engine', () => activationMocks);
vi.mock('@/modules/retention/services/retention-engine', () => retentionMocks);
vi.mock('@/modules/value/services/value-realization-engine', () => valueMocks);
vi.mock('@/modules/expansion/services/expansion-engine', () => expansionMocks);
vi.mock('@/modules/referral/services/referral-engine', () => referralMocks);
vi.mock('@/modules/analytics/adapters/AnalyticsProjectionAdapter', () => analyticsMocks);
vi.mock('@/modules/mission-engine/services/MissionEngineAuthorityService', () => missionMocks);
vi.mock('@/modules/business-context-memory/services/business-context-memory-service', () => memoryMocks);
vi.mock('@/modules/autonomous-execution/services/autonomous-execution-engine', () => executionMocks);
vi.mock('@/modules/agent-workforce/services/agent-workforce-service', () => workforceMocks);

import { getDashboardProjection } from '@/modules/dashboard/adapters/DashboardProjectionAdapter';

describe('AUTH-005 dashboard projection adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);

    businessMocks.businessStateService.getBusinessState.mockResolvedValue({
      stage: 'lead_generation',
      readiness: {
        source: 'BusinessStateAssembler',
        scope: 'user',
        confidence: 'derived',
        fallback: 'none',
        score: 64,
        maxScore: 100,
        percentage: 64,
      },
      bottlenecks: [{ code: 'traffic_missing' }, { code: 'offer_missing' }],
      opportunities: [],
    });

    journeyMocks.journeyStateService.getJourneyState.mockResolvedValue({
      source: 'JourneyStateAssembler',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      stage: 'lead_generation',
      milestones: [],
      missions: [
        {
          source: 'JourneyMissionAdapter',
          scope: 'user',
          confidence: 'derived',
          fallback: 'none',
          id: 'mission_1',
          title: 'Create first lead magnet',
          description: 'Publish the first lead magnet from Journey State.',
          status: 'in_progress',
        },
      ],
      nextAction: {
        source: 'JourneyNextActionAdapter',
        scope: 'user',
        confidence: 'derived',
        fallback: 'none',
        title: 'Launch lead magnet',
        description: 'Create a simple opt-in asset for your audience.',
        route: '/lead-magnet',
        actionType: 'mission',
      },
      revenueProgress: {
        completionPercent: 57,
        currentMilestone: 'First lead',
        nextMilestone: 'First customer',
      },
    });

    cooMocks.cooPlanService.getCOOPlan.mockResolvedValue({
      source: 'COOPlanAssembler',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      id: 'coo-plan-user_1',
      subjectId: 'user_1',
      generatedAt: '2026-06-19T00:00:00.000Z',
      horizon: 'today',
      strategicFocus: 'lead_generation',
      decision: {
        decisionId: 'coo-decision-user_1-generate_leads-traffic_missing',
        focusArea: 'generate_leads',
        currentFocus: 'Generate Leads',
        reason: 'There is not enough traffic or lead flow to validate the next growth step.',
        priority: 'high',
        confidence: 'high',
        estimatedImpact: 'high',
        estimatedEffort: 'medium',
        recommendedAction: {
          id: 'decision-action-MISSION_005',
          title: '引流磁铁',
          reason: 'There is not enough traffic or lead flow to validate the next growth step.',
          route: '/lead-magnet',
          successMetric: 'Capture the first qualified lead',
        },
        nextBestAction: {
          id: 'decision-action-MISSION_005',
          title: '引流磁铁',
          reason: 'There is not enough traffic or lead flow to validate the next growth step.',
          route: '/lead-magnet',
          successMetric: 'Capture the first qualified lead',
        },
        successMetric: 'Capture the first qualified lead',
        primaryRisk: {
          code: 'traffic_missing',
          title: 'Traffic missing',
          reason: 'There is not enough traffic or lead flow to validate the next growth step.',
          domain: 'traffic',
          priority: 'high',
        },
        primaryOpportunity: {
          code: 'recent_milestone_completed',
          title: 'Recent milestone completed',
          reason: 'Recent progress creates momentum.',
          domain: 'operations',
          priority: 'medium',
        },
        recommendedMission: {
          id: 'MISSION_005',
          title: '引流磁铁',
          route: '/lead-magnet',
        },
        decisionReason: 'Primary focus: Generate Leads. Why now: Traffic missing.',
        supportingActions: [],
      },
      recommendations: [
        {
          source: 'BusinessStateProjectionAdapter',
          scope: 'user',
          confidence: 'derived',
          fallback: 'none',
          recommendationSource: 'business_state',
          id: 'rec_1',
          type: 'strategic',
          title: 'Fix the funnel gap',
          summary: 'Resolve the highest priority business bottleneck.',
          domain: 'funnel',
          priority: 'high',
          horizon: 'today',
          reasoning: [],
          expectedOutcome: 'More qualified leads',
          supportingSignals: [],
          relatedRoute: '/funnel-builder',
        },
      ],
      assignments: [],
      delegations: [],
    });

    growthMocks.growthLoopStateService.getGrowthLoopState.mockResolvedValue({
      source: 'GrowthLoopAssembler',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      subjectId: 'user_1',
      generatedAt: '2026-06-19T00:00:00.000Z',
      health: 'active',
      overallScore: 72,
      acquisition: {
        leadCount: 4,
      },
      activation: {},
      retention: {},
      referral: {},
      expansion: {},
      signals: [],
      recommendations: [{ id: 'growth_rec_1' }],
    });

    growthProjectionMocks.growthLoopEngine.getProjection.mockResolvedValue({
      source: 'GrowthLoopEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      currentGrowthStage: 'lead',
      growthScore: 58,
      primaryBottleneck: {
        stage: 'lead',
        title: 'Lead bottleneck',
        reason: 'No leads have been captured yet.',
        severity: 'high',
        metric: 'lead_count',
      },
      primaryOpportunity: {
        stage: 'content',
        title: 'Activation momentum',
        reason: 'Activation progress is strong.',
        impact: 'medium',
        metric: 'activation_progress',
      },
      recommendedGrowthAction: {
        title: 'Create or improve the lead magnet',
        reason: 'Lead capture is the current blocked step.',
        route: '/lead-magnet',
        owner: 'growth-loop',
        expectedMetricLift: 'Increase lead_count.',
      },
    });

    optimizationMocks.optimizationEngine.getProjection.mockResolvedValue({
      source: 'OptimizationEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      optimizationScore: 62,
      currentOptimizationFocus: 'Low mission completion pattern',
      topWinningPatterns: [
        {
          area: 'agent',
          title: 'Agent execution success pattern',
          reason: 'Agent workforce success rate is 80%.',
          confidenceDelta: 10,
          usageRecommendation: 'increase',
        },
      ],
      topFailurePatterns: [
        {
          area: 'mission',
          title: 'Low mission completion pattern',
          reason: 'Mission completion rate is only 30%.',
          confidenceDelta: -12,
          usageRecommendation: 'decrease',
        },
      ],
      recommendedSystemChanges: [
        {
          area: 'mission',
          title: 'Reduce friction from Low mission completion pattern',
          reason: 'Mission completion rate is only 30%.',
          priority: 'high',
        },
      ],
      recommendedAgentChanges: [],
      recommendedJourneyChanges: [
        {
          area: 'mission',
          title: 'Reduce friction from Low mission completion pattern',
          reason: 'Mission completion rate is only 30%.',
          priority: 'high',
        },
      ],
    });

    activationMocks.activationEngine.getProjection.mockResolvedValue({
      source: 'ActivationEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      activationScore: 90,
      activationThreshold: 80,
      activationRisk: 'low',
      dropOffStage: 'lead_magnet_dropoff',
      currentStep: {
        id: 'first_lead_captured',
        label: '获得第一位潜在客户',
        route: '/lead-magnet',
        status: 'current',
        completedAt: null,
        estimatedMinutes: 10,
      },
      steps: [
        { id: 'account_created', label: '账号已创建', route: '/dashboard', status: 'completed', completedAt: '2026-06-19T00:00:00.000Z', estimatedMinutes: 0 },
        { id: 'interview_started', label: '开始品牌访谈', route: '/brand-builder/step/interview', status: 'completed', completedAt: '2026-06-19T00:02:00.000Z', estimatedMinutes: 2 },
        { id: 'interview_completed', label: '完成品牌访谈', route: '/brand-builder/step/interview', status: 'completed', completedAt: '2026-06-19T00:08:00.000Z', estimatedMinutes: 8 },
        { id: 'brand_dna_generated', label: '生成品牌 DNA', route: '/brand-builder/profile', status: 'completed', completedAt: '2026-06-19T00:10:00.000Z', estimatedMinutes: 3 },
        { id: 'first_content_generated', label: '生成第一篇内容', route: '/content-engine', status: 'completed', completedAt: '2026-06-19T00:13:00.000Z', estimatedMinutes: 5 },
        { id: 'first_lead_captured', label: '获得第一位潜在客户', route: '/lead-magnet', status: 'current', completedAt: null, estimatedMinutes: 10 },
      ],
      firstWin: {
        achieved: true,
        targetMinutes: 15,
        timeToFirstWinMinutes: 13,
        progressPercent: 100,
        status: 'achieved',
      },
      currentMission: {
        title: '获得第一位潜在客户',
        description: 'Start lead capture.',
        route: '/lead-magnet',
        ctaLabel: '继续激活',
        estimatedMinutes: 10,
      },
      shouldHideAdvancedModules: false,
      kpis: {
        activationRate: 100,
        interviewCompletionRate: 100,
        timeToFirstWinMinutes: 13,
        sevenDayRetentionSignal: false,
        thirtyDayRetentionSignal: false,
      },
    });

    retentionMocks.retentionEngine.getProjection.mockResolvedValue({
      source: 'RetentionEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      retentionScore: 74,
      retentionState: 'active_user',
      retentionRisk: 'low',
      momentumScore: 82,
      currentMomentum: 'Momentum is strong. Keep the current weekly rhythm.',
      currentStreak: 5,
      daysInactive: 1,
      inactivityFlag: 'none',
      signals: {
        loginFrequency: { key: 'login_frequency', label: 'Login frequency', value: 5, target: 8, unit: 'count' },
        missionCompletionFrequency: { key: 'mission_completion_frequency', label: 'Mission completion frequency', value: 3, target: 4, unit: 'count' },
        contentCreationFrequency: { key: 'content_creation_frequency', label: 'Content creation frequency', value: 3, target: 4, unit: 'count' },
        executionConsistency: { key: 'execution_consistency', label: 'Execution consistency', value: 100, target: 80, unit: 'percent' },
        aiCooInteractionFrequency: { key: 'ai_coo_interaction_frequency', label: 'AI COO interaction frequency', value: 3, target: 4, unit: 'count' },
      },
      momentum: {
        missionsCompleted: 3,
        contentGenerated: 3,
        leadMagnetsCreated: 1,
        funnelsLaunched: 1,
        winsAchieved: 5,
        recentWins: [
          { type: 'mission', title: '发布第一篇内容', occurredAt: '2026-06-18T00:00:00.000Z' },
        ],
      },
      reEngagement: {
        needed: false,
        priority: 'low',
        title: 'Keep the current rhythm',
        reason: 'The user is returning and completing enough actions to maintain momentum.',
        route: '/dashboard',
      },
      kpis: {
        sevenDayRetention: true,
        fourteenDayRetention: true,
        thirtyDayRetention: false,
        missionCompletionRate: 75,
        subscriptionRetention: 'healthy',
      },
    });

    valueMocks.valueRealizationEngine.getProjection.mockResolvedValue({
      source: 'ValueRealizationEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      businessMode: 'retail',
      valueRealizationScore: 67,
      currentValueStage: 'first_win',
      valueRisk: 'low',
      outcomeMetrics: {
        leadsGenerated: 4,
        appointmentsBooked: 1,
        customersAcquired: 1,
        revenueGenerated: 500,
        teamMembersRecruited: 0,
        contentPublished: 1,
        viewsGenerated: 120,
      },
      milestones: [
        { id: 'first_lead', label: 'First Lead', achieved: true, achievedAt: '2026-06-18T00:00:00.000Z', route: '/crm' },
        { id: 'first_customer', label: 'First Customer', achieved: true, achievedAt: '2026-06-19T00:00:00.000Z', route: '/crm/customers' },
        { id: 'first_sale', label: 'First Sale', achieved: false, achievedAt: null, route: '/sales' },
      ],
      latestWin: { id: 'first_customer', label: 'First Customer', achieved: true, achievedAt: '2026-06-19T00:00:00.000Z', route: '/crm/customers' },
      nextMilestone: { id: 'first_sale', label: 'First Sale', achieved: false, achievedAt: null, route: '/sales' },
      blockers: [
        {
          code: 'next_value_milestone_pending',
          title: 'First Sale pending',
          reason: 'The next meaningful business outcome has not been completed yet.',
          route: '/sales',
        },
      ],
      recommendedValueAction: {
        title: 'Reach First Sale',
        reason: 'The next meaningful business outcome has not been completed yet.',
        route: '/sales',
        expectedOutcome: 'First Sale',
      },
      kpis: {
        firstLeadRate: 100,
        firstCustomerRate: 100,
        firstSaleRate: 0,
        revenueGenerated: 500,
        customerSuccessRate: 100,
      },
    });

    expansionMocks.expansionEngine.getProjection.mockResolvedValue({
      source: 'ExpansionEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      businessMode: 'retail',
      expansionScore: 76,
      expansionStage: 'scaling',
      currentGrowthLever: {
        lever: 'customer_growth',
        title: '提高客户获取',
        reason: 'Customer growth is already moving.',
        route: '/customers',
      },
      scaleReadiness: {
        score: 78,
        status: 'strong',
        reason: 'Value, retention, and repeatable growth signals are strong enough for focused scaling.',
      },
      expansionOpportunities: [
        {
          id: 'expand_customer_growth',
          lever: 'customer_growth',
          title: '提高客户获取',
          reason: 'Customer acquisition is ready to multiply.',
          route: '/customers',
          priority: 'high',
          expectedMetricLift: 'Increase customer growth rate.',
        },
      ],
      expansionRisks: [],
      nextGrowthMilestone: {
        title: 'Reach 3 customers',
        metric: 'customer_growth',
        target: 'customers: 3',
        route: '/customers',
      },
      metrics: {
        leads: { current: 6, previous: 3, growthRate: 100 },
        customers: { current: 2, previous: 1, growthRate: 100 },
        revenue: { current: 800, previous: 400, growthRate: 100 },
        audience: { current: 1200, previous: 600, growthRate: 100 },
        content: { current: 4, previous: 2, growthRate: 100 },
        team: { current: 0, previous: 0, growthRate: 0 },
      },
      kpis: {
        leadGrowthRate: 100,
        revenueGrowthRate: 100,
        customerGrowthRate: 100,
        teamGrowthRate: 0,
        expansionSuccessRate: 76,
      },
    });

    referralMocks.referralEngine.getProjection.mockResolvedValue({
      source: 'ReferralEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      businessMode: 'retail',
      referralReadiness: 'advocate',
      referralScore: 82,
      referralOpportunities: [
        {
          id: 'referral_customer_referral',
          type: 'customer_referral',
          title: '启动顾客转介绍',
          reason: 'The user has enough proof to ask for referrals.',
          route: '/customers',
          priority: 'high',
          expectedOutcome: 'Turn happy buyers into referral sources.',
        },
      ],
      referralRisks: [],
      nextReferralMilestone: {
        title: '启动顾客转介绍',
        target: 'Referral conversion: 1',
        route: '/customers',
      },
      signals: {
        valueRealizationScore: 67,
        expansionScore: 76,
        retentionScore: 74,
        recentWins: 2,
        missionCompletionConsistency: 75,
        customerSatisfactionSignals: 2,
        referralInvitesCreated: 2,
        referralInvitesUsed: 1,
        referralLeads: 2,
        referredMembers: 0,
      },
      kpis: {
        referralRate: 100,
        referralConversionRate: 50,
        advocateRate: 100,
      },
    });

    analyticsMocks.getAnalyticsProjection.mockResolvedValue({
      businessStateVersion: 'BusinessStateAssembler:lead_generation:64',
      journeyVersion: 'JourneyStateAssembler:lead_generation:57',
      growthLoopVersion: 'GrowthLoopAssembler:2026-06-19T00:00:00.000Z:72',
      readiness: {
        value: 64,
        stage: 'lead_generation',
        bottleneckCount: 2,
      },
      progress: {
        value: 57,
        stage: 'lead_generation',
        nextAction: {
          title: 'Launch lead magnet',
          description: 'Create a simple opt-in asset for your audience.',
          route: '/lead-magnet',
        },
      },
      growth: {
        value: 72,
        health: 'active',
        recommendationCount: 1,
      },
    });

    missionMocks.missionEngineAuthorityService.getCurrentMission.mockResolvedValue({
      source: 'MissionEngineAuthorityService',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      currentJourney: {
        type: 'retail',
        title: 'Retail Journey',
        reason: 'Selected retail journey from business mode retail.',
      },
      currentMission: {
        id: 'MISSION_005',
        title: '引流磁铁',
        description: '创建一个免费但有价值的资源，让潜在客户愿意留下联系方式。',
        expectedOutcome: '你的业务开始收集潜在客户。',
        estimatedMinutes: 15,
        status: 'active',
        priority: 60,
        unlockConditions: ['first_content_generated'],
        completionConditions: ['lead_magnet_created'],
        nextMissionId: 'MISSION_006',
        route: '/lead-magnet',
      },
      nextMission: {
        id: 'MISSION_006',
        title: '落地页',
        description: '把引流磁铁连接到一个清晰的领取页面。',
        expectedOutcome: '你会有一个可以接收流量的转化入口。',
        estimatedMinutes: 20,
        status: 'locked',
        priority: 50,
        unlockConditions: ['lead_magnet_created'],
        completionConditions: ['funnel_published'],
        nextMissionId: 'MISSION_007',
        route: '/funnel-builder',
      },
      progress: {
        completionPercentage: 50,
        completedMissions: 4,
        totalMissions: 8,
        nextMilestone: '落地页',
        progressPath: [
          { id: 'MISSION_001', step: 1, label: '资料设置', status: 'completed' },
          { id: 'MISSION_002', step: 2, label: '品牌访谈', status: 'completed' },
          { id: 'MISSION_003', step: 3, label: '确认品牌 DNA', status: 'completed' },
          { id: 'MISSION_004', step: 4, label: '第一篇内容', status: 'completed' },
          { id: 'MISSION_005', step: 5, label: '引流磁铁', status: 'current' },
          { id: 'MISSION_006', step: 6, label: '落地页', status: 'locked' },
          { id: 'MISSION_007', step: 7, label: '流量启动', status: 'locked' },
          { id: 'MISSION_008', step: 8, label: '发布上线', status: 'locked' },
        ],
      },
      estimatedCompletion: {
        minutes: 15,
        label: '15 分钟',
      },
    });

    memoryMocks.businessContextMemoryService.getBusinessContext.mockResolvedValue({
      recentActivities: [
        {
          type: 'MISSION_COMPLETED',
          title: '发布第一篇内容',
          summary: '完成内容启动任务。',
          occurredAt: '2026-06-18T00:00:00.000Z',
          referenceId: 'MISSION_004',
        },
      ],
      currentFocus: '引流磁铁',
      blockedAreas: ['Build the funnel'],
      completedMilestones: ['完成品牌访谈', '完成品牌 DNA', '发布第一篇内容'],
      executionPattern: {
        activityLevel: 'active',
        completionVelocity: 'steady',
        recommendationResponse: 'mixed',
        consistency: 'medium',
      },
      recommendedFocus: 'Build the funnel',
      recommendationMemory: {
        recentlyIssuedIds: [],
        acceptedIds: [],
        ignoredIds: [],
      },
    });

    executionMocks.autonomousExecutionEngine.getProjection.mockResolvedValue({
      currentExecution: {
        actionId: 'exec-1',
        decisionId: 'decision-1',
        actionType: 'LEAD_MAGNET_GENERATION',
        title: '引流磁铁',
        reason: 'Prepare lead magnet for lead generation.',
        route: '/lead-magnet',
        priority: 'high',
        executionMode: 'assisted',
        requiresApproval: false,
        estimatedImpact: 'high',
        estimatedEffort: 'medium',
        successMetric: 'Capture the first qualified lead',
        state: 'queued',
        createdAt: '2026-06-19T00:00:00.000Z',
        updatedAt: '2026-06-19T00:00:00.000Z',
      },
      pendingApprovals: [],
      completedExecutions: [],
      queuedExecutions: [
        {
          actionId: 'exec-1',
          decisionId: 'decision-1',
          actionType: 'LEAD_MAGNET_GENERATION',
          title: '引流磁铁',
          reason: 'Prepare lead magnet for lead generation.',
          route: '/lead-magnet',
          priority: 'high',
          executionMode: 'assisted',
          requiresApproval: false,
          estimatedImpact: 'high',
          estimatedEffort: 'medium',
          successMetric: 'Capture the first qualified lead',
          state: 'queued',
          createdAt: '2026-06-19T00:00:00.000Z',
          updatedAt: '2026-06-19T00:00:00.000Z',
        },
      ],
      automationLevel: 'assisted',
    });

    workforceMocks.agentWorkforceService.getProjection.mockResolvedValue({
      activeAgents: [
        {
          agentType: 'lead_magnet_agent',
          runtimeAgentId: 'funnel_architect',
          name: 'Lead Magnet Agent',
          capabilities: ['lead magnet creation'],
          supportedActions: ['LEAD_MAGNET_GENERATION'],
          priority: 90,
          availability: 'available',
        },
      ],
      completedAgentTasks: [],
      agentPerformance: [],
      currentAssignments: [
        {
          assignmentId: 'workforce-exec-1-lead_magnet_agent',
          actionId: 'exec-1',
          agentType: 'lead_magnet_agent',
          runtimeAgentId: 'funnel_architect',
          action: {
            actionId: 'exec-1',
            decisionId: 'decision-1',
            actionType: 'LEAD_MAGNET_GENERATION',
            title: '引流磁铁',
            reason: 'Prepare lead magnet for lead generation.',
            route: '/lead-magnet',
            priority: 'high',
            executionMode: 'assisted',
            requiresApproval: false,
            estimatedImpact: 'high',
            estimatedEffort: 'medium',
            successMetric: 'Capture the first qualified lead',
            state: 'queued',
            createdAt: '2026-06-19T00:00:00.000Z',
            updatedAt: '2026-06-19T00:00:00.000Z',
          },
          status: 'assigned',
          priority: 'high',
          reason: 'Assigned LEAD_MAGNET_GENERATION to Lead Magnet Agent.',
        },
      ],
    });
  });

  it('consumes authority projections without local dashboard mission rules', async () => {
    const projection = await getDashboardProjection('user_1', 'tenant_1');

    expect(projection.currentJourney).toMatchObject({
      type: 'retail',
      title: 'Retail Journey',
    });
    expect(projection.currentMission).toMatchObject({
      id: 'MISSION_005',
      title: '引流磁铁',
      status: 'active',
    });
    expect(projection.missionControl).toMatchObject({
      title: '引流磁铁',
      whyItMatters: '创建一个免费但有价值的资源，让潜在客户愿意留下联系方式。',
      expectedOutcome: '你的业务开始收集潜在客户。',
      route: '/lead-magnet',
      ctaLabel: '继续任务',
    });
    expect(projection.nextAction).toMatchObject({
      title: '引流磁铁',
      route: '/lead-magnet',
    });
    expect(projection.aiDecision).toMatchObject({
      currentFocus: 'Generate Leads',
      nextBestAction: {
        title: '引流磁铁',
        route: '/lead-magnet',
      },
      primaryRisk: {
        title: 'Traffic missing',
        priority: 'high',
      },
      priority: 'high',
      confidence: 'high',
    });
    expect(projection.readiness).toMatchObject({
      value: 64,
      stage: 'lead_generation',
      bottleneckCount: 2,
    });
    expect(projection.progress).toMatchObject({
      value: 50,
      currentMilestone: '引流磁铁',
      nextMilestone: '落地页',
    });
    expect(projection.growth).toMatchObject({
      value: 72,
      health: 'active',
      recommendationCount: 1,
    });
    expect(projection.growthProjection).toMatchObject({
      currentGrowthStage: 'lead',
      growthScore: 58,
      primaryBottleneck: {
        title: 'Lead bottleneck',
      },
      recommendedGrowthAction: {
        route: '/lead-magnet',
      },
    });
    expect(projection.optimization).toMatchObject({
      optimizationScore: 62,
      currentOptimizationFocus: 'Low mission completion pattern',
      topFailurePatterns: [
        {
          area: 'mission',
          usageRecommendation: 'decrease',
        },
      ],
    });
    expect(projection.activation).toMatchObject({
      activationScore: 90,
      activationRisk: 'low',
      firstWin: {
        achieved: true,
        timeToFirstWinMinutes: 13,
      },
    });
    expect(projection.retention).toMatchObject({
      retentionScore: 74,
      retentionState: 'active_user',
      retentionRisk: 'low',
      momentumScore: 82,
      currentStreak: 5,
    });
    expect(projection.value).toMatchObject({
      valueRealizationScore: 67,
      currentValueStage: 'first_win',
      valueRisk: 'low',
      outcomeMetrics: {
        leadsGenerated: 4,
        customersAcquired: 1,
        revenueGenerated: 500,
      },
      nextMilestone: {
        id: 'first_sale',
      },
    });
    expect(projection.expansion).toMatchObject({
      expansionScore: 76,
      expansionStage: 'scaling',
      currentGrowthLever: {
        lever: 'customer_growth',
        route: '/customers',
      },
      scaleReadiness: {
        score: 78,
        status: 'strong',
      },
      nextGrowthMilestone: {
        metric: 'customer_growth',
      },
    });
    expect(projection.referral).toMatchObject({
      referralScore: 82,
      referralReadiness: 'advocate',
      referralOpportunities: [
        {
          type: 'customer_referral',
          route: '/customers',
        },
      ],
      nextReferralMilestone: {
        target: 'Referral conversion: 1',
      },
      kpis: {
        referralRate: 100,
        referralConversionRate: 50,
        advocateRate: 100,
      },
    });
    expect(projection.snapshot).toMatchObject({
      readiness: 64,
      progress: 50,
      growth: 72,
      leads: 4,
    });
    expect(projection.progressPath).toEqual([
      { id: 'MISSION_001', step: 1, label: '资料设置', status: 'completed' },
      { id: 'MISSION_002', step: 2, label: '品牌访谈', status: 'completed' },
      { id: 'MISSION_003', step: 3, label: '确认品牌 DNA', status: 'completed' },
      { id: 'MISSION_004', step: 4, label: '第一篇内容', status: 'completed' },
      { id: 'MISSION_005', step: 5, label: '引流磁铁', status: 'current' },
      { id: 'MISSION_006', step: 6, label: '落地页', status: 'locked' },
      { id: 'MISSION_007', step: 7, label: '流量启动', status: 'locked' },
      { id: 'MISSION_008', step: 8, label: '发布上线', status: 'locked' },
    ]);
    expect(projection.recommendations[0]).toMatchObject({
      id: 'rec_1',
      title: 'Fix the funnel gap',
      source: 'business_state',
      route: '/funnel-builder',
    });
    expect(projection.recommendations).toHaveLength(1);
    expect(projection.quickAccess).toEqual([
      { label: '内容引擎', route: '/content-engine', unlocked: true },
      { label: '漏斗工具', route: '/funnel-builder', unlocked: true },
      { label: 'AI 工作队', route: '/ai/workforce', unlocked: true },
      { label: '数据分析', route: '/analytics', unlocked: true },
      { label: '设置', route: '/settings', unlocked: true },
    ]);
    expect(projection.businessMemory).toMatchObject({
      currentFocus: '引流磁铁',
      recentWins: ['完成品牌访谈', '完成品牌 DNA', '发布第一篇内容'],
      blockedAreas: ['Build the funnel'],
      executionPattern: {
        activityLevel: 'active',
        completionVelocity: 'steady',
      },
    });
    expect(projection.executions).toMatchObject({
      automationLevel: 'assisted',
      currentExecution: {
        actionType: 'LEAD_MAGNET_GENERATION',
        state: 'queued',
      },
    });
    expect(projection.workforce).toMatchObject({
      activeAgents: [
        {
          agentType: 'lead_magnet_agent',
          runtimeAgentId: 'funnel_architect',
        },
      ],
      currentAssignments: [
        {
          agentType: 'lead_magnet_agent',
          actionId: 'exec-1',
          status: 'assigned',
        },
      ],
    });
  });

  it('emits dashboard projection version telemetry', async () => {
    await getDashboardProjection('user_1', 'tenant_1');

    const event = JSON.parse(vi.mocked(console.info).mock.calls[0][0] as string);

    expect(event.eventName).toBe('dashboard.projection_consumed');
    expect(event.module).toBe('dashboard');
    expect(event.properties).toMatchObject({
      businessStateVersion: 'BusinessStateAssembler:lead_generation:64',
      journeyVersion: 'JourneyStateAssembler:lead_generation:57',
      cooPlanVersion: 'COOPlanAssembler:coo-plan-user_1:2026-06-19T00:00:00.000Z',
      growthLoopVersion: 'GrowthLoopAssembler:2026-06-19T00:00:00.000Z:72',
    });
  });
});
