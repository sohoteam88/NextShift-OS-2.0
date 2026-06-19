import prisma from '@/lib/prisma';
import { extractCheckKeys } from '@/modules/mission/utils/completed-checks';
import type { GrowthLoopHealth, GrowthLoopState } from '../contracts/GrowthLoopState';
import type { GrowthSignal, GrowthSignalRecommendation } from '../contracts/GrowthSignal';
import { adaptAcquisitionSignals } from './AcquisitionSignalAdapter';
import { adaptActivationSignals } from './ActivationSignalAdapter';
import { adaptExpansionSignals } from './ExpansionSignalAdapter';
import { adaptReferralSignals } from './ReferralSignalAdapter';
import { adaptRetentionSignals } from './RetentionSignalAdapter';

function metadataArrayLength(metadata: unknown, key: string): number {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 0;
  const value = (metadata as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.length : value ? 1 : 0;
}

function aggregateScore(signals: GrowthSignal[]): number {
  if (signals.length === 0) return 0;
  return Math.round(signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length);
}

function deriveHealth(score: number, signals: GrowthSignal[]): GrowthLoopHealth {
  if (signals.some((signal) => signal.status === 'blocked')) return 'blocked';
  if (score === 0) return 'empty';
  if (score >= 75) return 'scaling';
  if (score >= 45) return 'active';
  return 'building';
}

function flattenRecommendations(signals: GrowthSignal[]): GrowthSignalRecommendation[] {
  return signals.flatMap((signal) => signal.recommendations);
}

export async function assembleGrowthLoopState(userId: string): Promise<GrowthLoopState> {
  const generatedAt = new Date().toISOString();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      onboardingCompleted: true,
      metadata: true,
      userProgress: {
        select: {
          currentStageId: true,
          completedChecks: true,
        },
      },
    },
  });

  if (!user) throw new Error('User not found');

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const recentWindow = new Date(now);
  recentWindow.setDate(recentWindow.getDate() - 30);

  const [
    leadCount,
    referralLeadCount,
    funnelAggregates,
    publishedFunnelCount,
    contentCount,
    completedMissionCount,
    totalMissionCount,
    customerCount,
    overdueFollowups,
    dueTodayFollowups,
    upcomingFollowups,
    recentActivityCount,
    createdInvites,
    usedInvites,
    expiredInvites,
    referralMemberCount,
    aiUsageCount,
  ] = await Promise.all([
    prisma.lead.count({ where: { tenantId: user.tenantId, ownerId: user.id, deletedAt: null } }),
    prisma.lead.count({ where: { tenantId: user.tenantId, ownerId: user.id, deletedAt: null, source: 'referral' } }),
    prisma.funnel.aggregate({
      where: { tenantId: user.tenantId, ownerId: user.id },
      _count: { _all: true },
      _sum: { views: true, conversions: true },
    }),
    prisma.funnel.count({ where: { tenantId: user.tenantId, ownerId: user.id, status: 'published' } }),
    prisma.content.count({ where: { tenantId: user.tenantId, ownerId: user.id } }),
    prisma.mission.count({ where: { tenantId: user.tenantId, userId: user.id, status: 'completed' } }),
    prisma.mission.count({ where: { tenantId: user.tenantId, userId: user.id } }),
    prisma.customer.count({ where: { tenantId: user.tenantId, ownerId: user.id } }),
    prisma.lead.count({
      where: { tenantId: user.tenantId, ownerId: user.id, deletedAt: null, nextFollowup: { lt: todayStart } },
    }),
    prisma.lead.count({
      where: { tenantId: user.tenantId, ownerId: user.id, deletedAt: null, nextFollowup: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.lead.count({
      where: { tenantId: user.tenantId, ownerId: user.id, deletedAt: null, nextFollowup: { gte: tomorrowStart, lte: nextWeek } },
    }),
    prisma.activity.count({ where: { tenantId: user.tenantId, userId: user.id, createdAt: { gte: recentWindow } } }),
    prisma.inviteCode.count({ where: { tenantId: user.tenantId, sponsorId: user.id } }),
    prisma.inviteCode.count({ where: { tenantId: user.tenantId, sponsorId: user.id, used: true } }),
    prisma.inviteCode.count({ where: { tenantId: user.tenantId, sponsorId: user.id, used: false, expiresAt: { lt: now } } }),
    prisma.user.count({ where: { tenantId: user.tenantId, sponsorId: user.id, deletedAt: null } }),
    prisma.aIUsageLog.count({ where: { tenantId: user.tenantId, userId: user.id } }),
  ]);

  const funnelCount = funnelAggregates._count._all;
  const funnelViews = funnelAggregates._sum.views ?? 0;
  const funnelConversions = funnelAggregates._sum.conversions ?? 0;
  const activeInvites = Math.max(createdInvites - usedInvites - expiredInvites, 0);
  const automationWorkflowCount = metadataArrayLength(user.metadata, 'automation_workflows');
  const completedChecks = extractCheckKeys(user.userProgress?.completedChecks);

  const acquisitionSignals = adaptAcquisitionSignals({
    userId: user.id,
    tenantId: user.tenantId,
    leadCount,
    funnelCount,
    publishedFunnelCount,
    funnelViews,
    funnelConversions,
    contentCount,
    generatedAt,
  });
  const activationSignals = adaptActivationSignals({
    userId: user.id,
    tenantId: user.tenantId,
    onboardingCompleted: user.onboardingCompleted,
    currentStageId: user.userProgress?.currentStageId,
    completedChecks,
    completedMissionCount,
    totalMissionCount,
    generatedAt,
  });
  const retentionSignals = adaptRetentionSignals({
    userId: user.id,
    tenantId: user.tenantId,
    leadCount,
    customerCount,
    overdueFollowups,
    dueTodayFollowups,
    upcomingFollowups,
    recentActivityCount,
    generatedAt,
  });
  const referralSignals = adaptReferralSignals({
    userId: user.id,
    tenantId: user.tenantId,
    createdInvites,
    activeInvites,
    usedInvites,
    expiredInvites,
    referralLeadCount,
    referralMemberCount,
    generatedAt,
  });
  const expansionSignals = adaptExpansionSignals({
    userId: user.id,
    tenantId: user.tenantId,
    teamSize: referralMemberCount,
    customerCount,
    automationWorkflowCount,
    aiUsageCount,
    generatedAt,
  });

  const signals: GrowthSignal[] = [
    ...acquisitionSignals,
    ...activationSignals,
    ...retentionSignals,
    ...referralSignals,
    ...expansionSignals,
  ];
  const overallScore = aggregateScore(signals);

  return {
    source: 'GrowthLoopAssembler',
    scope: 'user',
    confidence: signals.some((signal) => signal.fallback !== 'none') ? 'fallback' : 'derived',
    fallback: signals.some((signal) => signal.fallback !== 'none')
      ? signals.filter((signal) => signal.fallback !== 'none').map((signal) => signal.fallback).join('+')
      : 'none',

    subjectId: user.id,
    tenantId: user.tenantId,
    generatedAt,
    health: deriveHealth(overallScore, signals),
    overallScore,

    acquisition: acquisitionSignals[0],
    activation: activationSignals[0],
    retention: retentionSignals[0],
    referral: referralSignals[0],
    expansion: expansionSignals[0],

    signals,
    recommendations: flattenRecommendations(signals),
  };
}
