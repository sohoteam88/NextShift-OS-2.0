import type { RevenueDriverId } from './revenue-drivers';

export type RevenueDriverIntentStatus = 'resolved' | 'invalid' | 'fallback';

export type RevenueDriverResolvedIntent = {
  status: 'resolved';
  driverId: RevenueDriverId;
  route: string;
  intent: string;
  toolId: string;
  titleKey: string;
  descriptionKey: string;
  focusTargetId: string;
  state: Record<string, string>;
};

export type RevenueDriverIntentResolution =
  | RevenueDriverResolvedIntent
  | {
      status: 'invalid' | 'fallback';
      route: string;
      intent: string | null;
      titleKey: string;
      descriptionKey: string;
      focusTargetId: string;
      state: Record<string, string>;
    };

type IntentDefinition = Omit<RevenueDriverResolvedIntent, 'status' | 'intent'> & {
  intent: string;
  aliases?: string[];
};

export const REVENUE_DRIVER_INTENT_FOCUS_ID = 'revenue-driver-intent-focus';

const CONTENT_FOCUS_ID = 'content-engine-output-panel';
const TRAFFIC_FOCUS_ID = 'traffic-generator-controls';
const VIDEO_FOCUS_ID = 'video-generator-controls';
const WEBINAR_FOCUS_ID = 'webinar-generator-output';
const WHATSAPP_FOCUS_ID = 'whatsapp-ai-workspace';

export const REVENUE_DRIVER_INTENTS: IntentDefinition[] = [
  {
    driverId: 'content',
    route: '/content-engine',
    intent: 'facebook-post',
    toolId: 'content.facebook-post',
    titleKey: 'intent.tools.content.facebookPost.title',
    descriptionKey: 'intent.tools.content.facebookPost.description',
    focusTargetId: CONTENT_FOCUS_ID,
    state: { outputTab: 'first-seven', platform: 'facebook' },
  },
  {
    driverId: 'content',
    route: '/content-engine',
    intent: 'instagram-post',
    toolId: 'content.instagram-post',
    titleKey: 'intent.tools.content.instagramPost.title',
    descriptionKey: 'intent.tools.content.instagramPost.description',
    focusTargetId: CONTENT_FOCUS_ID,
    state: { outputTab: 'first-seven', platform: 'instagram' },
  },
  {
    driverId: 'content',
    route: '/content-engine',
    intent: 'tiktok-post',
    toolId: 'content.tiktok-post',
    titleKey: 'intent.tools.content.tiktokPost.title',
    descriptionKey: 'intent.tools.content.tiktokPost.description',
    focusTargetId: CONTENT_FOCUS_ID,
    state: { outputTab: 'first-seven', platform: 'tiktok' },
  },
  {
    driverId: 'content',
    route: '/content-engine',
    intent: 'xhs-post',
    toolId: 'content.xhs-post',
    titleKey: 'intent.tools.content.xhsPost.title',
    descriptionKey: 'intent.tools.content.xhsPost.description',
    focusTargetId: CONTENT_FOCUS_ID,
    state: { outputTab: 'first-seven', platform: 'xhs' },
  },
  {
    driverId: 'content',
    route: '/content-engine',
    intent: 'email-content',
    toolId: 'content.email-content',
    titleKey: 'intent.tools.content.emailContent.title',
    descriptionKey: 'intent.tools.content.emailContent.description',
    focusTargetId: CONTENT_FOCUS_ID,
    state: { outputTab: 'cta', platform: 'email' },
  },
  {
    driverId: 'content',
    route: '/content-engine',
    intent: 'whatsapp-content',
    aliases: ['whatsapp-broadcast'],
    toolId: 'content.whatsapp-content',
    titleKey: 'intent.tools.content.whatsappContent.title',
    descriptionKey: 'intent.tools.content.whatsappContent.description',
    focusTargetId: CONTENT_FOCUS_ID,
    state: { outputTab: 'cta', platform: 'whatsapp' },
  },
  {
    driverId: 'ads',
    route: '/traffic-engine',
    intent: 'facebook-ad',
    toolId: 'ads.facebook-ad',
    titleKey: 'intent.tools.ads.facebookAd.title',
    descriptionKey: 'intent.tools.ads.facebookAd.description',
    focusTargetId: TRAFFIC_FOCUS_ID,
    state: { platform: 'facebook', goal: 'lead_generation' },
  },
  {
    driverId: 'ads',
    route: '/traffic-engine',
    intent: 'instagram-ad',
    toolId: 'ads.instagram-ad',
    titleKey: 'intent.tools.ads.instagramAd.title',
    descriptionKey: 'intent.tools.ads.instagramAd.description',
    focusTargetId: TRAFFIC_FOCUS_ID,
    state: { platform: 'instagram', goal: 'webinar_registration' },
  },
  {
    driverId: 'ads',
    route: '/traffic-engine',
    intent: 'lead-generation-ad',
    toolId: 'ads.lead-generation-ad',
    titleKey: 'intent.tools.ads.leadGenerationAd.title',
    descriptionKey: 'intent.tools.ads.leadGenerationAd.description',
    focusTargetId: TRAFFIC_FOCUS_ID,
    state: { platform: 'facebook', goal: 'lead_generation' },
  },
  {
    driverId: 'ads',
    route: '/traffic-engine',
    intent: 'retargeting-ad',
    toolId: 'ads.retargeting-ad',
    titleKey: 'intent.tools.ads.retargetingAd.title',
    descriptionKey: 'intent.tools.ads.retargetingAd.description',
    focusTargetId: TRAFFIC_FOCUS_ID,
    state: { platform: 'facebook', goal: 'whatsapp_conversation' },
  },
  {
    driverId: 'ads',
    route: '/traffic-engine',
    intent: 'campaign-strategy',
    toolId: 'ads.campaign-strategy',
    titleKey: 'intent.tools.ads.campaignStrategy.title',
    descriptionKey: 'intent.tools.ads.campaignStrategy.description',
    focusTargetId: TRAFFIC_FOCUS_ID,
    state: { platform: 'facebook', goal: 'consultation_booking' },
  },
  {
    driverId: 'ads',
    route: '/traffic-engine',
    intent: 'audience-research',
    toolId: 'ads.audience-research',
    titleKey: 'intent.tools.ads.audienceResearch.title',
    descriptionKey: 'intent.tools.ads.audienceResearch.description',
    focusTargetId: TRAFFIC_FOCUS_ID,
    state: { platform: 'instagram', goal: 'content_growth' },
  },
  {
    driverId: 'ads',
    route: '/traffic-engine',
    intent: 'offer-testing',
    toolId: 'ads.offer-testing',
    titleKey: 'intent.tools.ads.offerTesting.title',
    descriptionKey: 'intent.tools.ads.offerTesting.description',
    focusTargetId: TRAFFIC_FOCUS_ID,
    state: { platform: 'facebook', goal: 'consultation_booking' },
  },
  {
    driverId: 'video',
    route: '/video-production',
    intent: 'hook-generator',
    toolId: 'video.hook-generator',
    titleKey: 'intent.tools.video.hookGenerator.title',
    descriptionKey: 'intent.tools.video.hookGenerator.description',
    focusTargetId: VIDEO_FOCUS_ID,
    state: { videoType: 'education', funnelStage: 'awareness' },
  },
  {
    driverId: 'video',
    route: '/video-production',
    intent: 'video-script',
    aliases: ['master-script'],
    toolId: 'video.video-script',
    titleKey: 'intent.tools.video.videoScript.title',
    descriptionKey: 'intent.tools.video.videoScript.description',
    focusTargetId: VIDEO_FOCUS_ID,
    state: { videoType: 'personal_story', funnelStage: 'trust_building' },
  },
  {
    driverId: 'video',
    route: '/video-production',
    intent: 'shot-list',
    aliases: ['b-roll-plan'],
    toolId: 'video.shot-list',
    titleKey: 'intent.tools.video.shotList.title',
    descriptionKey: 'intent.tools.video.shotList.description',
    focusTargetId: VIDEO_FOCUS_ID,
    state: { videoType: 'transformation', funnelStage: 'consideration' },
  },
  {
    driverId: 'video',
    route: '/video-production',
    intent: 'capcut-script',
    toolId: 'video.capcut-script',
    titleKey: 'intent.tools.video.capcutScript.title',
    descriptionKey: 'intent.tools.video.capcutScript.description',
    focusTargetId: VIDEO_FOCUS_ID,
    state: { videoType: 'education', funnelStage: 'conversion' },
  },
  {
    driverId: 'video',
    route: '/video-production',
    intent: 'veo-prompt',
    aliases: ['google-veo-prompt'],
    toolId: 'video.veo-prompt',
    titleKey: 'intent.tools.video.veoPrompt.title',
    descriptionKey: 'intent.tools.video.veoPrompt.description',
    focusTargetId: VIDEO_FOCUS_ID,
    state: { videoType: 'lifestyle', funnelStage: 'awareness' },
  },
  {
    driverId: 'video',
    route: '/video-production',
    intent: 'minimax-prompt',
    toolId: 'video.minimax-prompt',
    titleKey: 'intent.tools.video.miniMaxPrompt.title',
    descriptionKey: 'intent.tools.video.miniMaxPrompt.description',
    focusTargetId: VIDEO_FOCUS_ID,
    state: { videoType: 'testimonial', funnelStage: 'trust_building' },
  },
  {
    driverId: 'video',
    route: '/video-production',
    intent: 'subtitle-generator',
    aliases: ['platform-adaptation'],
    toolId: 'video.subtitle-generator',
    titleKey: 'intent.tools.video.subtitleGenerator.title',
    descriptionKey: 'intent.tools.video.subtitleGenerator.description',
    focusTargetId: VIDEO_FOCUS_ID,
    state: { videoType: 'education', funnelStage: 'follow_up' },
  },
  {
    driverId: 'webinar',
    route: '/webinar-center',
    intent: 'presentation-slides',
    toolId: 'webinar.presentation-slides',
    titleKey: 'intent.tools.webinar.presentationSlides.title',
    descriptionKey: 'intent.tools.webinar.presentationSlides.description',
    focusTargetId: WEBINAR_FOCUS_ID,
    state: { output: 'slides' },
  },
  {
    driverId: 'webinar',
    route: '/webinar-center',
    intent: 'speaker-script',
    toolId: 'webinar.speaker-script',
    titleKey: 'intent.tools.webinar.speakerScript.title',
    descriptionKey: 'intent.tools.webinar.speakerScript.description',
    focusTargetId: WEBINAR_FOCUS_ID,
    state: { output: 'script' },
  },
  {
    driverId: 'webinar',
    route: '/webinar-center',
    intent: 'offer-stack',
    aliases: ['cta-slides'],
    toolId: 'webinar.offer-stack',
    titleKey: 'intent.tools.webinar.offerStack.title',
    descriptionKey: 'intent.tools.webinar.offerStack.description',
    focusTargetId: WEBINAR_FOCUS_ID,
    state: { output: 'offer' },
  },
  {
    driverId: 'webinar',
    route: '/webinar-center',
    intent: 'qa-generator',
    aliases: ['qa-handling'],
    toolId: 'webinar.qa-generator',
    titleKey: 'intent.tools.webinar.qaGenerator.title',
    descriptionKey: 'intent.tools.webinar.qaGenerator.description',
    focusTargetId: WEBINAR_FOCUS_ID,
    state: { output: 'qa' },
  },
  {
    driverId: 'webinar',
    route: '/webinar-center',
    intent: 'follow-up-sequence',
    aliases: ['whatsapp-follow-up', 'email-follow-up', 'replay-sequence', 'closing-reminder'],
    toolId: 'webinar.follow-up-sequence',
    titleKey: 'intent.tools.webinar.followUpSequence.title',
    descriptionKey: 'intent.tools.webinar.followUpSequence.description',
    focusTargetId: WEBINAR_FOCUS_ID,
    state: { output: 'followUp' },
  },
  {
    driverId: 'webinar',
    route: '/webinar-center',
    intent: 'webinar-strategy',
    aliases: ['strategy'],
    toolId: 'webinar.strategy',
    titleKey: 'intent.tools.webinar.strategy.title',
    descriptionKey: 'intent.tools.webinar.strategy.description',
    focusTargetId: WEBINAR_FOCUS_ID,
    state: { output: 'strategy' },
  },
  {
    driverId: 'whatsapp',
    route: '/whatsapp-ai',
    intent: 'connect-whatsapp',
    aliases: ['connect'],
    toolId: 'whatsapp.connect',
    titleKey: 'intent.tools.whatsapp.connect.title',
    descriptionKey: 'intent.tools.whatsapp.connect.description',
    focusTargetId: WHATSAPP_FOCUS_ID,
    state: { output: 'connect' },
  },
  {
    driverId: 'whatsapp',
    route: '/whatsapp-ai',
    intent: 'train-ai',
    aliases: ['train', 'knowledge'],
    toolId: 'whatsapp.train',
    titleKey: 'intent.tools.whatsapp.train.title',
    descriptionKey: 'intent.tools.whatsapp.train.description',
    focusTargetId: WHATSAPP_FOCUS_ID,
    state: { output: 'train' },
  },
  {
    driverId: 'whatsapp',
    route: '/whatsapp-ai',
    intent: 'test-reply',
    aliases: ['test-reply', 'conversations'],
    toolId: 'whatsapp.test-reply',
    titleKey: 'intent.tools.whatsapp.testReply.title',
    descriptionKey: 'intent.tools.whatsapp.testReply.description',
    focusTargetId: WHATSAPP_FOCUS_ID,
    state: { output: 'reply' },
  },
  {
    driverId: 'whatsapp',
    route: '/whatsapp-ai',
    intent: 'follow-up-generator',
    aliases: ['follow-up'],
    toolId: 'whatsapp.follow-up',
    titleKey: 'intent.tools.whatsapp.followUp.title',
    descriptionKey: 'intent.tools.whatsapp.followUp.description',
    focusTargetId: WHATSAPP_FOCUS_ID,
    state: { output: 'followUp' },
  },
  {
    driverId: 'whatsapp',
    route: '/whatsapp-ai',
    intent: 'objection-handler',
    aliases: ['objection-handling'],
    toolId: 'whatsapp.objection-handler',
    titleKey: 'intent.tools.whatsapp.objectionHandler.title',
    descriptionKey: 'intent.tools.whatsapp.objectionHandler.description',
    focusTargetId: WHATSAPP_FOCUS_ID,
    state: { output: 'objections' },
  },
  {
    driverId: 'whatsapp',
    route: '/whatsapp-ai',
    intent: 'closing-assistant',
    aliases: ['closing'],
    toolId: 'whatsapp.closing-assistant',
    titleKey: 'intent.tools.whatsapp.closingAssistant.title',
    descriptionKey: 'intent.tools.whatsapp.closingAssistant.description',
    focusTargetId: WHATSAPP_FOCUS_ID,
    state: { output: 'closing' },
  },
  {
    driverId: 'leadMagnet',
    route: '/lead-magnet',
    intent: 'idea',
    toolId: 'lead-magnet.idea',
    titleKey: 'intent.tools.leadMagnet.idea.title',
    descriptionKey: 'intent.tools.leadMagnet.idea.description',
    focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
    state: { output: 'idea' },
  },
  {
    driverId: 'leadMagnet',
    route: '/lead-magnet',
    intent: 'copy',
    toolId: 'lead-magnet.copy',
    titleKey: 'intent.tools.leadMagnet.copy.title',
    descriptionKey: 'intent.tools.leadMagnet.copy.description',
    focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
    state: { output: 'copy' },
  },
  {
    driverId: 'leadMagnet',
    route: '/lead-magnet',
    intent: 'opt-in-cta',
    toolId: 'lead-magnet.opt-in-cta',
    titleKey: 'intent.tools.leadMagnet.optInCta.title',
    descriptionKey: 'intent.tools.leadMagnet.optInCta.description',
    focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
    state: { output: 'cta' },
  },
  {
    driverId: 'funnels',
    route: '/funnel',
    intent: 'landing-page',
    toolId: 'funnel.landing-page',
    titleKey: 'intent.tools.funnel.landingPage.title',
    descriptionKey: 'intent.tools.funnel.landingPage.description',
    focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
    state: { output: 'landing' },
  },
  {
    driverId: 'funnels',
    route: '/funnel',
    intent: 'thank-you-page',
    toolId: 'funnel.thank-you-page',
    titleKey: 'intent.tools.funnel.thankYouPage.title',
    descriptionKey: 'intent.tools.funnel.thankYouPage.description',
    focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
    state: { output: 'thankYou' },
  },
  {
    driverId: 'funnels',
    route: '/funnel',
    intent: 'follow-up-path',
    toolId: 'funnel.follow-up-path',
    titleKey: 'intent.tools.funnel.followUpPath.title',
    descriptionKey: 'intent.tools.funnel.followUpPath.description',
    focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
    state: { output: 'followUp' },
  },
];

const INTENT_BY_ROUTE_AND_VALUE = new Map<string, IntentDefinition>();

for (const definition of REVENUE_DRIVER_INTENTS) {
  INTENT_BY_ROUTE_AND_VALUE.set(`${definition.route}:${definition.intent}`, definition);
  for (const alias of definition.aliases ?? []) {
    INTENT_BY_ROUTE_AND_VALUE.set(`${definition.route}:${alias}`, definition);
  }
}

export function resolveRevenueDriverIntent(input: {
  route: string;
  intent?: string | null;
}): RevenueDriverIntentResolution {
  const route = input.route.split('?')[0];
  const intent = input.intent?.trim() || null;

  if (!intent) {
    return {
      status: 'fallback',
      route,
      intent,
      titleKey: 'intent.fallback.title',
      descriptionKey: 'intent.fallback.description',
      focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
      state: {},
    };
  }

  const definition = INTENT_BY_ROUTE_AND_VALUE.get(`${route}:${intent}`);
  if (!definition) {
    return {
      status: 'invalid',
      route,
      intent,
      titleKey: 'intent.invalid.title',
      descriptionKey: 'intent.invalid.description',
      focusTargetId: REVENUE_DRIVER_INTENT_FOCUS_ID,
      state: {},
    };
  }

  return {
    status: 'resolved',
    driverId: definition.driverId,
    route: definition.route,
    intent: definition.intent,
    toolId: definition.toolId,
    titleKey: definition.titleKey,
    descriptionKey: definition.descriptionKey,
    focusTargetId: definition.focusTargetId,
    state: definition.state,
  };
}
