import { prisma } from '@/lib/prisma';
import { EXECUTION_ROADMAP_STEPS, type ExecutionRoadmapStepId } from '@/modules/mission/constants/execution-roadmap';

const DAY_MS = 24 * 60 * 60 * 1000;

export type AttentionSeverity = 'critical' | 'high' | 'normal';

export type WorkspaceAttention = {
  label: string;
  value: number;
  severity: AttentionSeverity;
  href: string;
};

export type WorkspaceMemberHealth = {
  id: string;
  name: string;
  email: string;
  role: string;
  journeyProgress: number;
  currentStage: string;
  currentStepId: ExecutionRoadmapStepId;
  missingRequirement: string;
  recommendedAction: string;
  recommendedRoute: string;
  inactiveDays: number;
  priority: AttentionSeverity;
  currentFunnel: string;
  lastActiveAt: string;
  healthScore: number;
  needsHelp: boolean;
};

export type WorkspaceFunnelHealth = {
  id: string;
  title: string;
  status: string;
  published: boolean;
  leads: number;
  appointments: number;
  customers: number;
  views: number;
  conversions: number;
  conversionRate: number;
  healthScore: number;
  inactive: boolean;
};

export type WorkspaceJourneyStage = {
  id: string;
  label: string;
  users: number;
};

export type WorkspaceExecutionStep = {
  id: ExecutionRoadmapStepId;
  order: number;
  label: string;
  route: string;
  outcome: string;
  users: number;
  completed: number;
  blocked: number;
};

export type WorkspacePriorityUser = {
  id: string;
  name: string;
  email: string;
  currentStep: string;
  missingRequirement: string;
  recommendedAction: string;
  route: string;
  inactiveDays: number;
  priority: AttentionSeverity;
};

export type WorkspaceContentStats = {
  postsGenerated: number;
  videosGenerated: number;
  publishingActivity: number;
  platforms: { label: string; value: number }[];
};

export type WorkspaceBillingStats = {
  activePlans: number;
  trials: number;
  expired: number;
  failedPayments: number;
  gracePeriodUsers: number;
  mrr: number;
};

export type WorkspaceCommandData = {
  overview: {
    totalMembers: number;
    activeThisWeek: number;
    funnels: number;
    leads: number;
    appointments: number;
    customers: number;
    teamMembers: number;
    revenue: number;
    conversionRate: number;
    healthScore: number;
    healthTone: 'green' | 'yellow' | 'red';
  };
  execution: {
    activeUsers: number;
    usersStuck: number;
    missionEngineFailures: number;
    leadsUnfollowed: number;
    currentStep: string;
    primaryAction: string;
    primaryActionHref: string;
    steps: WorkspaceExecutionStep[];
    priorityUsers: WorkspacePriorityUser[];
  };
  attention: WorkspaceAttention[];
  members: WorkspaceMemberHealth[];
  funnels: WorkspaceFunnelHealth[];
  journey: WorkspaceJourneyStage[];
  content: WorkspaceContentStats;
  billing: WorkspaceBillingStats;
  activity: { id: string; label: string; createdAt: string }[];
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function healthTone(score: number): 'green' | 'yellow' | 'red' {
  if (score > 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

function stageLabel(stageId?: string | null) {
  const stage = (stageId ?? '').toLowerCase();
  if (stage.includes('brand')) return 'Brand Discovery';
  if (stage.includes('content')) return 'Content';
  if (stage.includes('lead') || stage.includes('funnel')) return 'Lead Generation';
  if (stage.includes('crm') || stage.includes('customer')) return 'CRM';
  if (stage.includes('team') || stage.includes('recruit')) return 'Team Building';
  return stageId || 'Not started';
}

function estimateJourneyProgress(stageId?: string | null, completedChecks?: unknown) {
  const checks = Array.isArray(completedChecks) ? completedChecks.length : 0;
  const stage = (stageId ?? '').toLowerCase();
  let base = 8;
  if (stage.includes('brand')) base = 20;
  if (stage.includes('content')) base = 40;
  if (stage.includes('lead') || stage.includes('funnel')) base = 60;
  if (stage.includes('crm') || stage.includes('customer')) base = 78;
  if (stage.includes('team') || stage.includes('recruit')) base = 88;
  return clampScore(base + checks * 3);
}

function memberHealth(progress: number, lastActiveAt: Date, onboardingCompleted: boolean) {
  const inactiveDays = daysSince(lastActiveAt);
  const activityScore = inactiveDays <= 2 ? 30 : inactiveDays <= 7 ? 20 : inactiveDays <= 14 ? 10 : 0;
  const onboardingScore = onboardingCompleted ? 20 : 5;
  return clampScore(progress * 0.5 + activityScore + onboardingScore);
}

function funnelHealth(views: number, conversions: number, published: boolean) {
  const trafficScore = views > 100 ? 35 : views > 20 ? 24 : views > 0 ? 12 : 0;
  const conversionScore = conversions > 10 ? 35 : conversions > 2 ? 22 : conversions > 0 ? 12 : 0;
  return clampScore((published ? 30 : 10) + trafficScore + conversionScore);
}

function appointmentWhere(tenantId: string) {
  return {
    tenantId,
    deletedAt: null,
    OR: [
      { pipelineStage: { contains: 'appointment', mode: 'insensitive' as const } },
      { pipelineStage: { contains: 'booking', mode: 'insensitive' as const } },
      { pipelineStage: { contains: 'demo', mode: 'insensitive' as const } },
    ],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hasMetadataObject(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return Boolean(value && typeof value === 'object');
}

function hasAny(checks: Set<string>, keys: string[]) {
  return keys.some((key) => checks.has(key));
}

function hasBrandProfile(profile: {
  brandPositioning: string;
  targetAudience: string;
  primaryOffer: string;
  coreMessage: string;
} | null) {
  if (!profile) return false;
  return Boolean(
    profile.brandPositioning.trim()
      && profile.targetAudience.trim()
      && (profile.primaryOffer.trim() || profile.coreMessage.trim()),
  );
}

function executionStatusFor(input: {
  user: {
    metadata: unknown;
    onboardingCompleted: boolean;
    brandProfile: {
      brandPositioning: string;
      targetAudience: string;
      primaryOffer: string;
      coreMessage: string;
    } | null;
    brandInterviews: { status: string }[];
    contentCalendars: { id: string }[];
    userProgress: { completedChecks: unknown } | null;
  };
  funnels: { status: string; publishedAt: Date | null }[];
  leads: { pipelineStage: string; lastContacted: Date | null; score: number }[];
  customers: { id: string }[];
  sponsoredMembers: number;
}) {
  const metadata = asRecord(input.user.metadata);
  const checks = new Set(
    Array.isArray(input.user.userProgress?.completedChecks)
      ? input.user.userProgress.completedChecks.map((item) => String(item))
      : [],
  );
  const trackCalendars = asRecord(metadata.content_engine_track_calendars);
  const leadMagnetTracks = asRecord(metadata.lead_magnet_tracks);
  const hasRetailAndRecruitmentCalendar = Boolean(trackCalendars.retail && trackCalendars.recruitment);
  const hasLeadMagnetTracks = Boolean(leadMagnetTracks.retail || leadMagnetTracks.recruitment);
  const hasPublishedFunnel = input.funnels.some((funnel) => funnel.status === 'published' || funnel.publishedAt);
  const hasHandledLead = input.leads.some((lead) => lead.lastContacted || lead.score > 0 || lead.pipelineStage !== 'new');

  const completed: Record<ExecutionRoadmapStepId, boolean> = {
    brand_interview: input.user.brandInterviews.some((item) => item.status === 'completed' || item.status === 'finished')
      || hasAny(checks, ['brand_discovery_completed', 'ai_interview_completed'])
      || input.user.onboardingCompleted,
    brand_dna: hasBrandProfile(input.user.brandProfile)
      || hasMetadataObject(metadata, 'brand_profile')
      || hasAny(checks, ['brand_dna_confirmed', 'positioning_completed']),
    ai_coo: hasBrandProfile(input.user.brandProfile) || hasAny(checks, ['brand_dna_confirmed']),
    content_engine: hasRetailAndRecruitmentCalendar
      || input.user.contentCalendars.length > 0
      || hasAny(checks, ['content_calendar_generated', 'first_content_generated']),
    lead_magnet: hasMetadataObject(metadata, 'lead_magnet')
      || hasLeadMagnetTracks
      || hasAny(checks, ['lead_magnet_created']),
    funnel_landing_page: input.funnels.length > 0
      || hasPublishedFunnel
      || hasAny(checks, ['funnel_published', 'landing_page_created']),
    traffic_test: hasMetadataObject(metadata, 'traffic_engine')
      || hasAny(checks, ['campaign_launched', 'traffic_campaign_launched']),
    leads: input.leads.length > 0 || hasAny(checks, ['first_lead_generated']),
    crm: hasHandledLead || hasAny(checks, ['crm_setup_completed', 'lead_followed_up']),
    sales: input.customers.length > 0 || hasAny(checks, ['first_sale_completed']),
    workforce: hasMetadataObject(metadata, 'agent_memory')
      || hasAny(checks, ['content_agent_activated', 'lead_magnet_agent_activated', 'funnel_agent_activated', 'agent_completed_work'])
      || input.sponsoredMembers > 0,
  };

  const current = EXECUTION_ROADMAP_STEPS.find((step) => !completed[step.id]) ?? EXECUTION_ROADMAP_STEPS[EXECUTION_ROADMAP_STEPS.length - 1]!;

  return { completed, current };
}

class WorkspaceHealthService {
  async getCommandData(tenantId: string): Promise<WorkspaceCommandData> {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS);
    const monthAgo = new Date(Date.now() - 30 * DAY_MS);

    const [
      users,
      funnels,
      leadCount,
      appointmentCount,
      customerCount,
      leadRows,
      customerRows,
      contents,
      videos,
      activity,
    ] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          userProgress: true,
          brandProfile: {
            select: {
              brandPositioning: true,
              targetAudience: true,
              primaryOffer: true,
              coreMessage: true,
            },
          },
          brandInterviews: {
            select: { status: true },
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
          contentCalendars: {
            select: { id: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          funnels: { take: 1, orderBy: { updatedAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.funnel.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' } }),
      prisma.lead.count({ where: { tenantId, deletedAt: null } }),
      prisma.lead.count({ where: appointmentWhere(tenantId) }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.lead.findMany({
        where: { tenantId, deletedAt: null },
        select: {
          ownerId: true,
          pipelineStage: true,
          lastContacted: true,
          score: true,
          createdAt: true,
        },
      }),
      prisma.customer.findMany({
        where: { tenantId },
        select: { id: true, ownerId: true },
      }),
      prisma.content.findMany({ where: { tenantId, createdAt: { gte: monthAgo } }, orderBy: { createdAt: 'desc' } }),
      prisma.videoProject.findMany({ where: { tenantId, createdAt: { gte: monthAgo } }, orderBy: { createdAt: 'desc' } }),
      prisma.activity.findMany({ where: { tenantId }, take: 8, orderBy: { createdAt: 'desc' } }),
    ]);

    const members = users.filter((user) => user.role !== 'platform_admin');
    const activeThisWeek = members.filter((user) => {
      const lastActive = user.userProgress?.lastActivityAt ?? user.updatedAt;
      return lastActive >= weekAgo;
    }).length;
    const pendingApprovals = users.filter((user) => user.status === 'pending').length;
    const inactiveMembers = members.filter((user) => {
      const lastActive = user.userProgress?.lastActivityAt ?? user.updatedAt;
      return daysSince(lastActive) > 7;
    }).length;
    const stuckBrandDiscovery = members.filter((user) => {
      const stage = user.userProgress?.currentStageId ?? '';
      return stage.toLowerCase().includes('brand') && daysSince(user.userProgress?.lastActivityAt ?? user.updatedAt) > 3;
    }).length;

    const funnelsByOwner = new Map<string, typeof funnels>();
    for (const funnel of funnels) {
      funnelsByOwner.set(funnel.ownerId, [...(funnelsByOwner.get(funnel.ownerId) ?? []), funnel]);
    }

    const leadsByOwner = new Map<string, typeof leadRows>();
    for (const lead of leadRows) {
      leadsByOwner.set(lead.ownerId, [...(leadsByOwner.get(lead.ownerId) ?? []), lead]);
    }

    const customersByOwner = new Map<string, typeof customerRows>();
    for (const customer of customerRows) {
      customersByOwner.set(customer.ownerId, [...(customersByOwner.get(customer.ownerId) ?? []), customer]);
    }

    const sponsoredMembersByOwner = new Map<string, number>();
    for (const member of members) {
      if (!member.sponsorId) continue;
      sponsoredMembersByOwner.set(member.sponsorId, (sponsoredMembersByOwner.get(member.sponsorId) ?? 0) + 1);
    }

    const executionByUser = new Map<string, ReturnType<typeof executionStatusFor>>();
    for (const user of members) {
      executionByUser.set(user.id, executionStatusFor({
        user,
        funnels: funnelsByOwner.get(user.id) ?? [],
        leads: leadsByOwner.get(user.id) ?? [],
        customers: customersByOwner.get(user.id) ?? [],
        sponsoredMembers: sponsoredMembersByOwner.get(user.id) ?? 0,
      }));
    }

    const memberRows: WorkspaceMemberHealth[] = members.slice(0, 50).map((user) => {
      const lastActive = user.userProgress?.lastActivityAt ?? user.updatedAt;
      const inactiveDays = daysSince(lastActive);
      const progress = estimateJourneyProgress(user.userProgress?.currentStageId, user.userProgress?.completedChecks);
      const score = memberHealth(progress, lastActive, user.onboardingCompleted);
      const execution = executionByUser.get(user.id);
      const priority: AttentionSeverity = inactiveDays > 7 ? 'critical' : inactiveDays > 3 ? 'high' : 'normal';
      return {
        id: user.id,
        name: user.name || 'Unnamed member',
        email: user.email,
        role: user.role,
        journeyProgress: progress,
        currentStage: execution?.current.label_zh ?? stageLabel(user.userProgress?.currentStageId),
        currentStepId: execution?.current.id ?? 'brand_interview',
        missingRequirement: execution?.current.outcome_zh ?? '等待系统资料',
        recommendedAction: `推进 ${execution?.current.short_zh ?? '当前步骤'}`,
        recommendedRoute: execution?.current.route ?? '/admin/members',
        inactiveDays,
        priority,
        currentFunnel: user.funnels[0]?.title ?? 'No funnel',
        lastActiveAt: lastActive.toISOString(),
        healthScore: score,
        needsHelp: score < 50 || inactiveDays > 3,
      };
    });

    const funnelRows: WorkspaceFunnelHealth[] = funnels.map((funnel) => {
      const published = funnel.status === 'published' || Boolean(funnel.publishedAt);
      const conversionRate = funnel.views > 0 ? Math.round((funnel.conversions / funnel.views) * 1000) / 10 : 0;
      const score = funnelHealth(funnel.views, funnel.conversions, published);
      return {
        id: funnel.id,
        title: funnel.title,
        status: funnel.status,
        published,
        leads: funnel.conversions,
        appointments: 0,
        customers: 0,
        views: funnel.views,
        conversions: funnel.conversions,
        conversionRate,
        healthScore: score,
        inactive: published && funnel.views === 0,
      };
    });

    const journeyMap = new Map<string, number>();
    for (const member of members) {
      const label = executionByUser.get(member.id)?.current.label_zh ?? stageLabel(member.userProgress?.currentStageId);
      journeyMap.set(label, (journeyMap.get(label) ?? 0) + 1);
    }

    const platformCounts = new Map<string, number>();
    for (const item of contents) {
      const platform = item.platform || 'Unassigned';
      platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
    }
    for (const item of videos) {
      const platform = item.platform || 'Unassigned';
      platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
    }

    const totalFunnels = funnels.length;
    const inactiveFunnels = funnelRows.filter((funnel) => funnel.inactive).length;
    const contentPublished = contents.filter((item) => item.status === 'published').length;
    const conversionRate = leadCount > 0 ? Math.round((customerCount / leadCount) * 1000) / 10 : 0;
    const leadsUnfollowed = leadRows.filter((lead) => !lead.lastContacted && daysSince(lead.createdAt) >= 1).length;
    const executionSteps: WorkspaceExecutionStep[] = EXECUTION_ROADMAP_STEPS.map((step) => {
      const usersInStep = members.filter((member) => executionByUser.get(member.id)?.current.id === step.id);
      return {
        id: step.id,
        order: step.order,
        label: step.label_zh,
        route: step.route,
        outcome: step.outcome_zh,
        users: usersInStep.length,
        completed: members.filter((member) => Boolean(executionByUser.get(member.id)?.completed[step.id])).length,
        blocked: usersInStep.filter((member) => daysSince(member.userProgress?.lastActivityAt ?? member.updatedAt) > 3).length,
      };
    });
    const priorityUsers: WorkspacePriorityUser[] = members
      .map((member) => {
        const execution = executionByUser.get(member.id);
        const lastActive = member.userProgress?.lastActivityAt ?? member.updatedAt;
        const inactiveDays = daysSince(lastActive);
        const priority: AttentionSeverity = inactiveDays > 7 ? 'critical' : inactiveDays > 3 ? 'high' : 'normal';
        return {
          id: member.id,
          name: member.name || 'Unnamed member',
          email: member.email,
          currentStep: execution?.current.label_zh ?? '未开始',
          missingRequirement: execution?.current.outcome_zh ?? '等待系统资料',
          recommendedAction: `打开 ${execution?.current.short_zh ?? '当前步骤'}`,
          route: execution?.current.route ?? '/admin/members',
          inactiveDays,
          priority,
        };
      })
      .filter((item) => item.priority !== 'normal')
      .sort((a, b) => {
        const severityRank: Record<AttentionSeverity, number> = { critical: 0, high: 1, normal: 2 };
        return severityRank[a.priority] - severityRank[b.priority] || b.inactiveDays - a.inactiveDays;
      })
      .slice(0, 6);
    const mostCrowdedStep = [...executionSteps].sort((a, b) => b.users - a.users)[0];
    const healthScore = clampScore(
      (members.length ? (activeThisWeek / members.length) * 30 : 30) +
        (totalFunnels ? ((totalFunnels - inactiveFunnels) / totalFunnels) * 25 : 15) +
        (leadCount > 0 ? 20 : 5) +
        (contentPublished > 0 ? 15 : 5) +
        (pendingApprovals === 0 ? 10 : 3),
    );

    const attentionCandidates: WorkspaceAttention[] = [
      { label: 'Pending Approvals', value: pendingApprovals, severity: pendingApprovals > 5 ? 'critical' : 'high', href: '/admin/approvals' },
      { label: 'Members Inactive > 7 Days', value: inactiveMembers, severity: inactiveMembers > 5 ? 'critical' : 'high', href: '/admin/members' },
      { label: 'Funnels Without Traffic', value: inactiveFunnels, severity: inactiveFunnels > 0 ? 'high' : 'normal', href: '/admin/funnels' },
      { label: 'Failed Payments', value: 0, severity: 'normal', href: '/admin/billing' },
      { label: 'Users Stuck In Brand Discovery', value: stuckBrandDiscovery, severity: stuckBrandDiscovery > 3 ? 'high' : 'normal', href: '/admin/journey' },
    ];
    const severityRank: Record<AttentionSeverity, number> = { critical: 0, high: 1, normal: 2 };
    const attention = attentionCandidates
      .filter((item) => item.value > 0 || item.label === 'Failed Payments')
      .sort((a, b) => {
        return severityRank[a.severity] - severityRank[b.severity] || b.value - a.value;
      });

    return {
      overview: {
        totalMembers: members.length,
        activeThisWeek,
        funnels: totalFunnels,
        leads: leadCount,
        appointments: appointmentCount,
        customers: customerCount,
        teamMembers: members.filter((user) => user.sponsorId).length,
        revenue: 0,
        conversionRate,
        healthScore,
        healthTone: healthTone(healthScore),
      },
      execution: {
        activeUsers: activeThisWeek,
        usersStuck: priorityUsers.length,
        missionEngineFailures: 0,
        leadsUnfollowed,
        currentStep: mostCrowdedStep?.label ?? 'AI 访谈',
        primaryAction: priorityUsers.length > 0 ? '处理卡住成员' : '查看成员介入队列',
        primaryActionHref: '/admin/members',
        steps: executionSteps,
        priorityUsers,
      },
      attention,
      members: memberRows,
      funnels: funnelRows,
      journey: Array.from(journeyMap.entries()).map(([label, users], index) => ({ id: `${index}-${label}`, label, users })),
      content: {
        postsGenerated: contents.length,
        videosGenerated: videos.length,
        publishingActivity: contentPublished + videos.filter((item) => item.status === 'published').length,
        platforms: Array.from(platformCounts.entries()).map(([label, value]) => ({ label, value })),
      },
      billing: {
        activePlans: 1,
        trials: 0,
        expired: 0,
        failedPayments: 0,
        gracePeriodUsers: 0,
        mrr: 0,
      },
      activity: activity.map((item) => ({
        id: item.id,
        label: item.description,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}

export const workspaceHealthService = new WorkspaceHealthService();
