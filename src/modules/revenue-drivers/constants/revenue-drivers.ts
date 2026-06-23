import { CANONICAL_ROUTES } from '@/config/canonical-routes';
import type { MissionType } from '@/modules/mission-engine/contracts/MissionAuthority';

export type RevenueDriverId =
  | 'whatsapp'
  | 'content'
  | 'video'
  | 'ads'
  | 'webinar'
  | 'leadMagnet'
  | 'funnels';

export type RevenueDriverAction = {
  id: string;
  labelKey: string;
  href: string;
};

export type RevenueDriverDefinition = {
  id: RevenueDriverId;
  priority: number;
  route: string;
  titleKey: string;
  descriptionKey: string;
  outcomeKey: string;
  primaryActionKey: string;
  actions: RevenueDriverAction[];
};

function withIntent(route: string, intent: string) {
  return `${route}?intent=${encodeURIComponent(intent)}`;
}

export const REVENUE_DRIVERS: RevenueDriverDefinition[] = [
  {
    id: 'whatsapp',
    priority: 1,
    route: CANONICAL_ROUTES.whatsappAi,
    titleKey: 'drivers.whatsapp.title',
    descriptionKey: 'drivers.whatsapp.description',
    outcomeKey: 'drivers.whatsapp.outcome',
    primaryActionKey: 'drivers.whatsapp.primaryAction',
    actions: [
      { id: 'connect-whatsapp', labelKey: 'actions.connectWhatsApp', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'connect-whatsapp') },
      { id: 'train-ai', labelKey: 'actions.trainAi', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'train-ai') },
      { id: 'upload-knowledge', labelKey: 'actions.uploadKnowledge', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'train-ai') },
      { id: 'test-ai-reply', labelKey: 'actions.testAiReply', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'test-reply') },
      { id: 'view-conversations', labelKey: 'actions.viewConversations', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'test-reply') },
      { id: 'ai-follow-up', labelKey: 'actions.aiFollowUp', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'follow-up-generator') },
      { id: 'ai-objection-handling', labelKey: 'actions.aiObjectionHandling', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'objection-handler') },
      { id: 'ai-closing-assistant', labelKey: 'actions.aiClosingAssistant', href: withIntent(CANONICAL_ROUTES.whatsappAi, 'closing-assistant') },
    ],
  },
  {
    id: 'content',
    priority: 2,
    route: CANONICAL_ROUTES.contentEngine,
    titleKey: 'drivers.content.title',
    descriptionKey: 'drivers.content.description',
    outcomeKey: 'drivers.content.outcome',
    primaryActionKey: 'drivers.content.primaryAction',
    actions: [
      { id: 'facebook-post', labelKey: 'actions.facebookPost', href: withIntent(CANONICAL_ROUTES.contentEngine, 'facebook-post') },
      { id: 'instagram-post', labelKey: 'actions.instagramPost', href: withIntent(CANONICAL_ROUTES.contentEngine, 'instagram-post') },
      { id: 'tiktok-post', labelKey: 'actions.tiktokPost', href: withIntent(CANONICAL_ROUTES.contentEngine, 'tiktok-post') },
      { id: 'xhs-post', labelKey: 'actions.xhsPost', href: withIntent(CANONICAL_ROUTES.contentEngine, 'xhs-post') },
      { id: 'email-content', labelKey: 'actions.emailContent', href: withIntent(CANONICAL_ROUTES.contentEngine, 'email-content') },
      { id: 'whatsapp-broadcast', labelKey: 'actions.whatsappBroadcast', href: withIntent(CANONICAL_ROUTES.contentEngine, 'whatsapp-content') },
    ],
  },
  {
    id: 'video',
    priority: 3,
    route: '/video-production',
    titleKey: 'drivers.video.title',
    descriptionKey: 'drivers.video.description',
    outcomeKey: 'drivers.video.outcome',
    primaryActionKey: 'drivers.video.primaryAction',
    actions: [
      { id: 'hook-generator', labelKey: 'actions.hookGenerator', href: withIntent('/video-production', 'hook-generator') },
      { id: 'video-script', labelKey: 'actions.videoScript', href: withIntent('/video-production', 'video-script') },
      { id: 'master-script', labelKey: 'actions.masterScript', href: withIntent('/video-production', 'master-script') },
      { id: 'shot-list', labelKey: 'actions.shotList', href: withIntent('/video-production', 'shot-list') },
      { id: 'b-roll-plan', labelKey: 'actions.bRollPlan', href: withIntent('/video-production', 'b-roll-plan') },
      { id: 'capcut-script', labelKey: 'actions.capCutScript', href: withIntent('/video-production', 'capcut-script') },
      { id: 'subtitle-generator', labelKey: 'actions.subtitleGenerator', href: withIntent('/video-production', 'subtitle-generator') },
      { id: 'google-veo-prompt', labelKey: 'actions.googleVeoPrompt', href: withIntent('/video-production', 'veo-prompt') },
      { id: 'minimax-prompt', labelKey: 'actions.miniMaxPrompt', href: withIntent('/video-production', 'minimax-prompt') },
      { id: 'platform-adaptation', labelKey: 'actions.platformAdaptation', href: withIntent('/video-production', 'platform-adaptation') },
    ],
  },
  {
    id: 'ads',
    priority: 4,
    route: CANONICAL_ROUTES.trafficEngine,
    titleKey: 'drivers.ads.title',
    descriptionKey: 'drivers.ads.description',
    outcomeKey: 'drivers.ads.outcome',
    primaryActionKey: 'drivers.ads.primaryAction',
    actions: [
      { id: 'facebook-ad', labelKey: 'actions.facebookAd', href: withIntent(CANONICAL_ROUTES.trafficEngine, 'facebook-ad') },
      { id: 'instagram-ad', labelKey: 'actions.instagramAd', href: withIntent(CANONICAL_ROUTES.trafficEngine, 'instagram-ad') },
      { id: 'lead-generation-ad', labelKey: 'actions.leadGenerationAd', href: withIntent(CANONICAL_ROUTES.trafficEngine, 'lead-generation-ad') },
      { id: 'retargeting-ad', labelKey: 'actions.retargetingAd', href: withIntent(CANONICAL_ROUTES.trafficEngine, 'retargeting-ad') },
      { id: 'campaign-strategy', labelKey: 'actions.campaignStrategy', href: withIntent(CANONICAL_ROUTES.trafficEngine, 'campaign-strategy') },
      { id: 'audience-research', labelKey: 'actions.audienceResearch', href: withIntent(CANONICAL_ROUTES.trafficEngine, 'audience-research') },
      { id: 'offer-testing', labelKey: 'actions.offerTesting', href: withIntent(CANONICAL_ROUTES.trafficEngine, 'offer-testing') },
    ],
  },
  {
    id: 'webinar',
    priority: 5,
    route: '/webinar-center',
    titleKey: 'drivers.webinar.title',
    descriptionKey: 'drivers.webinar.description',
    outcomeKey: 'drivers.webinar.outcome',
    primaryActionKey: 'drivers.webinar.primaryAction',
    actions: [
      { id: 'webinar-strategy', labelKey: 'actions.webinarStrategy', href: withIntent('/webinar-center', 'webinar-strategy') },
      { id: 'presentation-slides', labelKey: 'actions.presentationSlides', href: withIntent('/webinar-center', 'presentation-slides') },
      { id: 'speaker-script', labelKey: 'actions.speakerScript', href: withIntent('/webinar-center', 'speaker-script') },
      { id: 'offer-stack', labelKey: 'actions.offerStack', href: withIntent('/webinar-center', 'offer-stack') },
      { id: 'cta-slides', labelKey: 'actions.ctaSlides', href: withIntent('/webinar-center', 'cta-slides') },
      { id: 'qa-handling', labelKey: 'actions.qaHandling', href: withIntent('/webinar-center', 'qa-generator') },
      { id: 'whatsapp-follow-up', labelKey: 'actions.whatsappFollowUp', href: withIntent('/webinar-center', 'follow-up-sequence') },
      { id: 'email-follow-up', labelKey: 'actions.emailFollowUp', href: withIntent('/webinar-center', 'follow-up-sequence') },
      { id: 'replay-sequence', labelKey: 'actions.replaySequence', href: withIntent('/webinar-center', 'follow-up-sequence') },
      { id: 'closing-reminder', labelKey: 'actions.closingReminder', href: withIntent('/webinar-center', 'follow-up-sequence') },
    ],
  },
  {
    id: 'leadMagnet',
    priority: 6,
    route: CANONICAL_ROUTES.leadMagnet,
    titleKey: 'drivers.leadMagnet.title',
    descriptionKey: 'drivers.leadMagnet.description',
    outcomeKey: 'drivers.leadMagnet.outcome',
    primaryActionKey: 'drivers.leadMagnet.primaryAction',
    actions: [
      { id: 'lead-magnet-idea', labelKey: 'actions.leadMagnetIdea', href: withIntent(CANONICAL_ROUTES.leadMagnet, 'idea') },
      { id: 'lead-magnet-copy', labelKey: 'actions.leadMagnetCopy', href: withIntent(CANONICAL_ROUTES.leadMagnet, 'copy') },
      { id: 'opt-in-cta', labelKey: 'actions.optInCta', href: withIntent(CANONICAL_ROUTES.leadMagnet, 'opt-in-cta') },
    ],
  },
  {
    id: 'funnels',
    priority: 7,
    route: CANONICAL_ROUTES.funnel,
    titleKey: 'drivers.funnels.title',
    descriptionKey: 'drivers.funnels.description',
    outcomeKey: 'drivers.funnels.outcome',
    primaryActionKey: 'drivers.funnels.primaryAction',
    actions: [
      { id: 'landing-page', labelKey: 'actions.landingPage', href: withIntent(CANONICAL_ROUTES.funnel, 'landing-page') },
      { id: 'thank-you-page', labelKey: 'actions.thankYouPage', href: withIntent(CANONICAL_ROUTES.funnel, 'thank-you-page') },
      { id: 'follow-up-path', labelKey: 'actions.followUpPath', href: withIntent(CANONICAL_ROUTES.funnel, 'follow-up-path') },
    ],
  },
];

const DRIVER_BY_ID = new Map(REVENUE_DRIVERS.map((driver) => [driver.id, driver]));

const DRIVER_BY_ROUTE = new Map(
  REVENUE_DRIVERS.flatMap((driver) => [
    [driver.route, driver],
    [`/revenue-drivers?driver=${driver.id}`, driver],
  ] as Array<[string, RevenueDriverDefinition]>),
);

const DRIVER_BY_MISSION_TYPE: Partial<Record<MissionType, RevenueDriverId>> = {
  CONTENT: 'content',
  LEAD_MAGNET: 'leadMagnet',
  FUNNEL: 'funnels',
  TRAFFIC: 'ads',
  WEBINAR: 'webinar',
  CUSTOMERS: 'whatsapp',
  RETENTION: 'whatsapp',
  OPTIMIZATION: 'video',
};

export function getRevenueDriver(id: RevenueDriverId) {
  return DRIVER_BY_ID.get(id) ?? null;
}

export function getRevenueDriverForRoute(route: string | undefined) {
  if (!route) return null;
  return DRIVER_BY_ROUTE.get(route.split('?')[0]) ?? null;
}

export function getRevenueDriverForMissionType(missionType: MissionType | undefined) {
  if (!missionType) return null;
  const id = DRIVER_BY_MISSION_TYPE[missionType];
  return id ? getRevenueDriver(id) : null;
}

export function revenueDriverHubRoute(driverId: RevenueDriverId) {
  return `/revenue-drivers?driver=${driverId}`;
}

export function revenueDriverHubRouteForMission(input: {
  route?: string;
  missionType?: MissionType;
}) {
  const driver = getRevenueDriverForMissionType(input.missionType) ?? getRevenueDriverForRoute(input.route);
  return driver ? revenueDriverHubRoute(driver.id) : null;
}
