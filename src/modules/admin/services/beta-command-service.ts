import prisma from '@/lib/prisma';

export type BetaHealthTone = 'green' | 'yellow' | 'red';

export type BetaMetric = {
  key: string;
  label: string;
  value: number;
  denominator: number;
  rate: number;
};

export type BetaReportItem = {
  label: string;
  detail: string;
  severity: BetaHealthTone;
  count: number;
};

export type BetaCommandCenterData = {
  healthScore: number;
  healthTone: BetaHealthTone;
  metrics: BetaMetric[];
  bottlenecks: BetaReportItem[];
  requestedFeatures: BetaReportItem[];
  uxProblems: BetaReportItem[];
};

function pct(value: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((value / denominator) * 100);
}

function toneFromScore(score: number): BetaHealthTone {
  if (score > 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

async function distinctUserCount<T extends { ownerId?: string; userId?: string }>(rows: T[], key: 'ownerId' | 'userId') {
  return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
}

function topFive(items: BetaReportItem[]) {
  return items.sort((a, b) => b.count - a.count).slice(0, 5);
}

export const betaCommandService = {
  async getTenantReport(tenantId: string): Promise<BetaCommandCenterData> {
    const [
      invitedUsers,
      activeUsers,
      allUsers,
      brandProfiles,
      contents,
      videoProjects,
      funnels,
      leads,
      appointmentLeads,
      appointmentActivities,
      customers,
      members,
      voiceProfiles,
      contentCalendars,
      aiUsageLogs,
    ] = await Promise.all([
      prisma.inviteCode.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, deletedAt: null, status: 'active' } }),
      prisma.user.count({ where: { tenantId, deletedAt: null } }),
      prisma.brandProfile.findMany({
        where: { tenantId },
        select: { userId: true, confidenceScore: true, publishedAt: true },
      }),
      prisma.content.findMany({ where: { tenantId }, select: { ownerId: true } }),
      prisma.videoProject.findMany({ where: { tenantId }, select: { userId: true } }),
      prisma.funnel.findMany({ where: { tenantId }, select: { ownerId: true, status: true, publishedAt: true } }),
      prisma.lead.findMany({ where: { tenantId, deletedAt: null }, select: { ownerId: true } }),
      prisma.lead.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { pipelineStage: { contains: 'appointment', mode: 'insensitive' } },
            { pipelineStage: { contains: 'consult', mode: 'insensitive' } },
            { pipelineStage: { contains: 'call', mode: 'insensitive' } },
          ],
        },
        select: { ownerId: true },
      }),
      prisma.activity.findMany({
        where: {
          tenantId,
          OR: [
            { type: { contains: 'appointment', mode: 'insensitive' } },
            { type: { contains: 'consult', mode: 'insensitive' } },
            { description: { contains: 'appointment', mode: 'insensitive' } },
            { description: { contains: '预约', mode: 'insensitive' } },
          ],
        },
        select: { userId: true },
      }),
      prisma.customer.findMany({ where: { tenantId }, select: { ownerId: true } }),
      prisma.user.findMany({
        where: { tenantId, deletedAt: null, status: 'active', role: { in: ['member', 'leader'] } },
        select: { id: true },
      }),
      prisma.voiceProfile.findMany({ where: { tenantId }, select: { userId: true, status: true } }),
      prisma.contentCalendar.findMany({ where: { tenantId }, select: { userId: true } }),
      prisma.aIUsageLog.findMany({ where: { tenantId }, select: { feature: true } }),
    ]);

    const denominator = Math.max(activeUsers, invitedUsers, allUsers, 1);
    const brandCompletion = new Set(
      brandProfiles
        .filter((profile) => profile.publishedAt || profile.confidenceScore >= 60)
        .map((profile) => profile.userId),
    ).size;
    const contentCompletion = await distinctUserCount(contents, 'ownerId');
    const funnelCompletion = new Set(
      funnels.filter((funnel) => funnel.publishedAt || funnel.status !== 'draft').map((funnel) => funnel.ownerId),
    ).size;
    const firstLead = await distinctUserCount(leads, 'ownerId');
    const firstAppointment = new Set([
      ...appointmentLeads.map((lead) => lead.ownerId),
      ...appointmentActivities.map((activity) => activity.userId),
    ]).size;
    const firstCustomer = await distinctUserCount(customers, 'ownerId');
    const firstMember = members.length;

    const metrics: BetaMetric[] = [
      { key: 'invited', label: 'Invited users', value: invitedUsers, denominator: Math.max(invitedUsers, 1), rate: 100 },
      { key: 'activated', label: 'Activated users', value: activeUsers, denominator, rate: pct(activeUsers, denominator) },
      { key: 'brand', label: 'Brand completion', value: brandCompletion, denominator, rate: pct(brandCompletion, denominator) },
      { key: 'content', label: 'Content completion', value: contentCompletion, denominator, rate: pct(contentCompletion, denominator) },
      { key: 'funnel', label: 'Funnel completion', value: funnelCompletion, denominator, rate: pct(funnelCompletion, denominator) },
      { key: 'lead', label: 'First lead', value: firstLead, denominator, rate: pct(firstLead, denominator) },
      { key: 'appointment', label: 'First appointment', value: firstAppointment, denominator, rate: pct(firstAppointment, denominator) },
      { key: 'customer', label: 'First customer', value: firstCustomer, denominator, rate: pct(firstCustomer, denominator) },
      { key: 'member', label: 'First member', value: firstMember, denominator, rate: pct(firstMember, denominator) },
    ];

    const funnelRates = metrics.filter((metric) => metric.key !== 'invited').map((metric) => metric.rate);
    const healthScore = Math.round(funnelRates.reduce((sum, rate) => sum + rate, 0) / Math.max(funnelRates.length, 1));

    const bottlenecks = topFive(
      metrics
        .filter((metric) => metric.key !== 'invited')
        .map((metric) => ({
          label: metric.label,
          detail: `${metric.denominator - metric.value} beta users have not reached this step.`,
          severity: toneFromScore(metric.rate),
          count: metric.denominator - metric.value,
        })),
    );

    const videoUsers = await distinctUserCount(videoProjects, 'userId');
    const voiceUsers = await distinctUserCount(voiceProfiles, 'userId');
    const calendarUsers = await distinctUserCount(contentCalendars, 'userId');
    const aiFeatureSet = new Set(aiUsageLogs.map((log) => log.feature));

    const requestedFeatures = topFive([
      {
        label: 'One-click funnel recovery',
        detail: 'Users create content before publishing a funnel; recovery should guide them to the missing funnel step.',
        severity: funnelCompletion < contentCompletion ? 'yellow' : 'green',
        count: Math.max(contentCompletion - funnelCompletion, 0),
      },
      {
        label: 'Video workflow shortcuts',
        detail: 'Show a direct path from content idea to video script and shot list.',
        severity: videoUsers < contentCompletion ? 'yellow' : 'green',
        count: Math.max(contentCompletion - videoUsers, 0),
      },
      {
        label: 'Voice onboarding reminder',
        detail: 'Prompt beta users to record voice notes when brand completion is low.',
        severity: voiceUsers < brandCompletion ? 'yellow' : 'green',
        count: Math.max(brandCompletion - voiceUsers, 0),
      },
      {
        label: 'Content calendar handoff',
        detail: 'Turn generated content into scheduled calendar items faster.',
        severity: calendarUsers < contentCompletion ? 'yellow' : 'green',
        count: Math.max(contentCompletion - calendarUsers, 0),
      },
      {
        label: 'AI usage visibility',
        detail: 'Surface which AI tools beta users actually use most often.',
        severity: aiFeatureSet.size < 3 ? 'yellow' : 'green',
        count: Math.max(3 - aiFeatureSet.size, 0),
      },
    ]);

    const uxProblems = topFive([
      {
        label: 'Activation gap',
        detail: 'Invited users are not all reaching active status.',
        severity: toneFromScore(pct(activeUsers, denominator)),
        count: Math.max(denominator - activeUsers, 0),
      },
      {
        label: 'Brand setup friction',
        detail: 'Users are not completing a strong brand profile before content generation.',
        severity: toneFromScore(pct(brandCompletion, denominator)),
        count: Math.max(denominator - brandCompletion, 0),
      },
      {
        label: 'Lead capture gap',
        detail: 'Users publish or generate assets but do not capture their first lead.',
        severity: toneFromScore(pct(firstLead, denominator)),
        count: Math.max(denominator - firstLead, 0),
      },
      {
        label: 'Follow-up ambiguity',
        detail: 'Leads are not consistently becoming appointments.',
        severity: toneFromScore(pct(firstAppointment, denominator)),
        count: Math.max(firstLead - firstAppointment, 0),
      },
      {
        label: 'Revenue proof gap',
        detail: 'Beta success needs clearer progress from appointment to first customer.',
        severity: toneFromScore(pct(firstCustomer, denominator)),
        count: Math.max(firstAppointment - firstCustomer, 0),
      },
    ]);

    return {
      healthScore,
      healthTone: toneFromScore(healthScore),
      metrics,
      bottlenecks,
      requestedFeatures,
      uxProblems,
    };
  },
};

