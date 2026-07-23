import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext, getBrandDnaVersion } from '@/modules/brand-dna/services/BrandContextProvider';
import { extractCheckKeys } from '@/modules/mission/utils/completed-checks';
import type { TrafficGoal, TrafficPlatform, BudgetTier, TrafficPackage, TrafficPrerequisites } from './types';
import { generateTrafficPackage } from './trafficGenerators';
import type { WorkspaceContext } from '@/modules/workspace/types';

function hasPublishedLandingPage(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const pkg = value as Record<string, unknown>;
  const landingPage = pkg.landingPage as Record<string, unknown> | undefined;
  return Boolean(landingPage?.publicPath || pkg.status === 'launched');
}

function isObjectMap(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export const trafficEngineService = {
  async generate(
    userId: string,
    goal: TrafficGoal,
    platform: TrafficPlatform,
    budget: BudgetTier,
    workspaceContext?: WorkspaceContext,
  ): Promise<TrafficPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');

    const prerequisites = await this.getPrerequisites(userId, workspaceContext);
    const funnelExists = workspaceContext
      ? Boolean(prerequisites.activeWorkspaceLandingPageReady)
      : prerequisites.retailLandingPageReady && prerequisites.recruitmentLandingPageReady;
    const lmExists = prerequisites.leadMagnetReady;
    const contentCount = await prisma.content.count({ where: { ownerId: userId } });

    const pkg = generateTrafficPackage(ctx, goal, platform, budget, funnelExists, lmExists, contentCount);
    pkg.brandDnaVersion = await getBrandDnaVersion(userId);
    pkg.campaign.readinessScore = pkg.readiness.score;
    pkg.prerequisites = prerequisites;
    if (workspaceContext) {
      pkg.workspaceContext = {
        workspaceId: workspaceContext.workspaceId,
        workspaceType: workspaceContext.workspaceType,
        templateNamespace: workspaceContext.templateNamespace,
        themeKey: workspaceContext.themeKey,
      };
    }
    await this.save(userId, pkg);
    return pkg;
  },

  async getPrerequisites(userId: string, workspaceContext?: WorkspaceContext): Promise<TrafficPrerequisites> {
    const [user, progress, contentCount, calendarCount, recentFunnels, brandProfile] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }),
      prisma.userProgress.findUnique({ where: { userId }, select: { completedChecks: true } }),
      prisma.content.count({ where: { ownerId: userId } }),
      prisma.contentCalendar.count({ where: { userId } }),
      prisma.funnel.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { config: true, status: true },
      }),
      prisma.brandProfile.findUnique({ where: { userId }, select: { id: true } }),
    ]);

    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const checks = new Set(extractCheckKeys(progress?.completedChecks));
    const funnelTracks = isObjectMap(meta.funnel_builder_tracks) ? meta.funnel_builder_tracks : {};
    const leadMagnetTracks = isObjectMap(meta.lead_magnet_tracks) ? meta.lead_magnet_tracks : {};
    const contentCalendars = isObjectMap(meta.content_engine_track_calendars) ? meta.content_engine_track_calendars : {};

    let retailLandingPageReady = hasPublishedLandingPage(funnelTracks.retail)
      || hasPublishedLandingPage(meta.funnel_builder_2)
      || hasPublishedLandingPage(meta.funnel_builder);
    let recruitmentLandingPageReady = hasPublishedLandingPage(funnelTracks.recruitment);

    for (const funnel of recentFunnels) {
      if (funnel.status !== 'published' && !hasPublishedLandingPage(funnel.config)) continue;
      const config = isObjectMap(funnel.config) ? funnel.config : {};
      const track = config.track === 'recruitment' ? 'recruitment' : 'retail';
      if (track === 'recruitment') recruitmentLandingPageReady = true;
      if (track === 'retail') retailLandingPageReady = true;
    }

    const hasLegacyLeadMagnet = Boolean(meta.lead_magnet && typeof meta.lead_magnet === 'object');
    const hasDualLeadMagnets = Boolean(leadMagnetTracks.retail && leadMagnetTracks.recruitment);
    const hasDualContentCalendars = Boolean(contentCalendars.retail && contentCalendars.recruitment);
    const activeTrack = workspaceContext?.workspaceConfig.contentTrack === 'recruitment'
      ? 'recruitment'
      : 'retail';
    const activeWorkspaceLandingPageReady = activeTrack === 'recruitment'
      ? recruitmentLandingPageReady
      : retailLandingPageReady;

    return {
      brandDnaReady: Boolean(brandProfile) || checks.has('brand_dna_confirmed') || checks.has('positioning_completed'),
      contentPlanReady: hasDualContentCalendars
        || calendarCount > 0
        || contentCount > 0
        || checks.has('content_calendar_generated')
        || checks.has('first_content_generated')
        || checks.has('content_published'),
      leadMagnetReady: hasDualLeadMagnets || hasLegacyLeadMagnet || checks.has('lead_magnet_created'),
      retailLandingPageReady,
      recruitmentLandingPageReady,
      activeWorkspaceLandingPageReady,
      trackingPlanned: Boolean(meta.traffic_engine) || checks.has('traffic_campaign_launched'),
    };
  },

  async save(userId: string, pkg: TrafficPackage) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({ where: { id: userId }, data: { metadata: { ...meta, traffic_engine: pkg as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
  },

  async get(userId: string): Promise<TrafficPackage | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const t = meta.traffic_engine; return t && typeof t === 'object' ? (t as TrafficPackage) : null;
  },
};
