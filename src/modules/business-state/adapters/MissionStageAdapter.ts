import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import {
  extractCheckKeys,
  getProgressPercent,
  type CompletedCheckEntry,
  type CompletedChecksValue,
} from '@/modules/mission/constants/journey-map';
import type { BusinessStage } from '../contracts/BusinessStage';
import type { BusinessStateAdapterResult } from './business-state-adapter-diagnostics';

function toCompletedChecks(value: unknown): CompletedChecksValue {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return value.filter((item): item is CompletedCheckEntry => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Record<string, unknown>;
    return typeof entry.check === 'string' && typeof entry.completed_at === 'string';
  });
}

function stageFromChecks(completedChecks: string[], progressPercent: number): BusinessStage {
  const checks = new Set(completedChecks);
  if (checks.has('growth_mode_active') || progressPercent >= 95) return 'scale';
  if (checks.has('first_sale_completed') || progressPercent >= 85) return 'growth';
  if (checks.has('crm_active') || progressPercent >= 75) return 'customer_acquisition';
  if (checks.has('campaign_launched') || checks.has('funnel_published') || checks.has('lead_magnet_created')) return 'lead_generation';
  if (checks.has('content_published') || checks.has('first_content_generated')) return 'content_active';
  if (checks.has('positioning_completed') || checks.has('brand_dna_confirmed')) return 'offer_defined';
  if (checks.has('brand_discovery_completed')) return 'audience_defined';
  return 'foundation';
}

export async function adaptMissionStage(user: AuthUser): Promise<BusinessStateAdapterResult> {
  const progress = await prisma.userProgress.findUnique({
    where: { userId: user.id },
    select: { completedChecks: true },
  });
  const completedChecksValue = toCompletedChecks(progress?.completedChecks);
  const completedChecks = extractCheckKeys(completedChecksValue);

  return {
    source: 'userProgress',
    scope: 'user',
    confidence: progress ? 'derived' : 'fallback',
    fallback: progress ? 'none' : 'userProgress_missing',
    stage: stageFromChecks(completedChecks, getProgressPercent(completedChecksValue)),
    bottlenecks: [],
    opportunities: [],
  };
}
