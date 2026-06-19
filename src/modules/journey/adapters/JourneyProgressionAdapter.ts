import { getNextStage } from '@/modules/mission/constants/journey-map';
import type { BusinessMode } from '@/modules/interview-authority/contracts/BusinessContextSnapshot';
import type { BusinessBottleneck } from '@/modules/business-state/contracts/BusinessBottleneck';
import type { BusinessStage } from '@/modules/business-state/contracts/BusinessStage';
import type { ReadinessScore } from '@/modules/business-state/contracts/ReadinessScore';
import type { JourneyStage } from '../contracts/JourneyStage';
import { metadataFor, readJourneyProgress, type JourneySourceMetadata } from './journey-adapter-diagnostics';

export type JourneyProgressionContext = {
  businessMode?: BusinessMode;
  businessStage?: BusinessStage;
  readiness?: ReadinessScore;
  bottlenecks?: BusinessBottleneck[];
};

export type JourneyProgressionResult = JourneySourceMetadata & {
  stage: JourneyStage;
};

function mapNextStageToJourneyStage(stageId: string | null): JourneyStage {
  if (stageId === null) return 'scale';
  if (stageId === 'register' || stageId === 'admin_approve' || stageId === 'brand_discovery' || stageId === 'brand_dna') {
    return 'brand_foundation';
  }
  if (stageId === 'positioning' || stageId === 'fb_page_setup' || stageId === 'ig_account_setup' || stageId === 'generate_bio' || stageId === 'generate_avatar') {
    return 'audience_validation';
  }
  if (stageId === 'first_content' || stageId === 'first_video' || stageId === 'publish_content') {
    return 'content_activation';
  }
  if (stageId === 'lead_magnet' || stageId === 'webinar' || stageId === 'funnel') {
    return 'offer_creation';
  }
  if (stageId === 'traffic_campaign') return 'lead_generation';
  if (stageId === 'whatsapp_followup' || stageId === 'crm_setup' || stageId === 'first_sale') {
    return 'customer_acquisition';
  }
  if (stageId === 'growth_mode') return 'team_growth';
  return 'brand_foundation';
}

function mapBusinessStageToJourneyStage(stage?: BusinessStage): JourneyStage | null {
  switch (stage) {
    case 'foundation':
      return 'brand_foundation';
    case 'audience_defined':
      return 'audience_validation';
    case 'offer_defined':
      return 'offer_creation';
    case 'content_active':
      return 'content_activation';
    case 'lead_generation':
      return 'lead_generation';
    case 'customer_acquisition':
    case 'growth':
      return 'customer_acquisition';
    case 'scale':
      return 'scale';
    default:
      return null;
  }
}

function bottleneckStage(bottlenecks: BusinessBottleneck[] = []): JourneyStage | null {
  const high = bottlenecks.find((item) => item.severity === 'high');
  switch (high?.domain) {
    case 'brand':
      return 'brand_foundation';
    case 'content':
      return 'content_activation';
    case 'funnel':
      return 'offer_creation';
    case 'traffic':
      return 'lead_generation';
    case 'crm':
    case 'sales':
      return 'customer_acquisition';
    default:
      return null;
  }
}

function applyBusinessStateContext(fallbackStage: JourneyStage, context: JourneyProgressionContext): JourneyStage {
  const fromBusinessStage = mapBusinessStageToJourneyStage(context.businessStage) ?? fallbackStage;
  const fromBottleneck = bottleneckStage(context.bottlenecks);

  if (fromBottleneck) return fromBottleneck;
  if ((context.readiness?.percentage ?? 100) < 25 && fromBusinessStage !== 'brand_foundation') {
    return 'audience_validation';
  }

  return fromBusinessStage;
}

export async function adaptJourneyProgression(
  userId: string,
  context: JourneyProgressionContext = {},
): Promise<JourneyProgressionResult> {
  const progress = await readJourneyProgress(userId);
  const metadata = metadataFor('userProgress+JOURNEY_MAP', progress);
  const nextStage = progress.found ? getNextStage(progress.completedChecksValue) : null;
  const fallbackStage = progress.found ? mapNextStageToJourneyStage(nextStage?.id ?? null) : 'brand_foundation';

  return {
    ...metadata,
    source: context.businessStage ? 'BusinessState+userProgress+JOURNEY_MAP' : metadata.source,
    stage: applyBusinessStateContext(fallbackStage, context),
  };
}
