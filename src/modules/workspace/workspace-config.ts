import type {
  WorkspaceCapability,
  WorkspaceConfig,
  WorkspaceManifest,
  WorkspaceType,
} from './types';

const capabilityRoutes: Readonly<Record<WorkspaceCapability, string>> = {
  dashboard: '/dashboard',
  crm: '/crm-center',
  content: '/content-engine',
  funnel: '/funnel-builder',
  landing: '/funnel-builder',
  analytics: '/analytics-center',
  ai_coach: '/ai',
};

const sharedCapabilities: readonly WorkspaceCapability[] = [
  'dashboard',
  'crm',
  'content',
  'funnel',
  'landing',
  'analytics',
  'ai_coach',
];

const capabilityRequiredPermissions: Readonly<Record<WorkspaceCapability, string>> = {
  dashboard: 'dashboard:read',
  crm: 'crm:read',
  content: 'content:read',
  funnel: 'funnel:read',
  landing: 'landing:read',
  analytics: 'analytics:read',
  ai_coach: 'ai_coach:use',
};

export const RETAIL_WORKSPACE_CONFIG: WorkspaceConfig = {
  workspaceType: 'retail',
  workspaceName: 'Retail Business OS',
  label: 'Retail Business OS',
  contentTrack: 'retail',
  themeKey: 'retail',
  templateNamespace: 'retail',
  promptProfile: {
    namespace: 'retail',
    tone: ['customer-first', 'practical', 'commercially clear'],
    constraints: ['preserve retail customer lifecycle language', 'avoid recruitment-specific duplication language'],
  },
  businessCapabilities: [
    'dashboard',
    'crm',
    'content',
    'funnel',
    'landing',
    'analytics',
    'ai_coach',
    'ai_coo',
    'customer_journey',
    'customer_success',
    'offer_builder',
    'lead_magnet',
    'repeat_purchase',
    'referral',
    'customer_retention',
  ],
  enabledCapabilities: sharedCapabilities,
  dashboard: {
    focus: ['customer pipeline', 'sales', 'retention', 'orders', 'repeat purchase', 'referral'],
    metrics: ['sales', 'retention', 'repeat purchase', 'referral'],
    language: ['customer lifecycle', 'offer journey', 'customer health'],
  },
  dashboardWidgets: [
    {
      id: 'retail_sales_snapshot',
      title: 'Sales Overview',
      metric: 'revenue',
      route: '/analytics-center',
      capability: 'analytics',
    },
    {
      id: 'retail_customer_pipeline',
      title: 'Customer Pipeline',
      metric: 'lead conversion',
      route: '/crm-center',
      capability: 'crm',
    },
    {
      id: 'retail_revenue',
      title: 'Retail Revenue',
      metric: 'sales',
      route: '/analytics-center',
      capability: 'analytics',
    },
    {
      id: 'retail_repeat_purchase_health',
      title: 'Repeat Purchase',
      metric: 'repeat purchase readiness',
      route: '/crm-center',
      capability: 'crm',
    },
    {
      id: 'retail_referral_loop',
      title: 'Referral Loop',
      metric: 'referral readiness',
      route: '/analytics-center',
      capability: 'analytics',
    },
    {
      id: 'retail_retention_health',
      title: 'Retention Health',
      metric: 'retention',
      route: '/analytics-center',
      capability: 'analytics',
    },
    {
      id: 'retail_lead_magnet_performance',
      title: 'Lead Magnet Performance',
      metric: 'lead magnet engagement',
      route: '/lead-magnet',
      capability: 'landing',
    },
    {
      id: 'retail_funnel_conversion',
      title: 'Funnel Conversion',
      metric: 'conversion',
      route: '/funnel-builder',
      capability: 'funnel',
    },
    {
      id: 'retail_customer_success_status',
      title: 'Customer Success Status',
      metric: 'customer health',
      route: '/journey',
      capability: 'crm',
    },
    {
      id: 'retail_ai_coo_recommendations',
      title: 'AI COO Recommendations',
      metric: 'next best action',
      route: '/ceo-mode',
      capability: 'ai_coach',
    },
  ],
  crm: {
    focus: ['leads', 'customers', 'purchase intent', 'follow-up stage', 'customer health'],
    metrics: ['lead conversion', 'customer status', 'purchase intent', 'repeat purchase readiness', 'referral readiness', 'retention status'],
    language: ['customer', 'follow-up', 'retention', 'repeat purchase', 'referral', 'customer health'],
  },
  content: {
    focus: ['retail', 'customer acquisition', 'customer education', 'product benefits', 'repeat purchase'],
    metrics: ['content output', 'lead magnet engagement', 'customer education', 'repeat purchase prompts', 'referral content'],
    language: ['education', 'story', 'offer', 'retention', 'customer proof', 'objection handling', 'lifestyle content'],
  },
  funnel: {
    focus: ['offer', 'customer journey', 'lead magnet', 'first purchase', 'repeat purchase', 'referral activation'],
    metrics: ['visits', 'lead capture', 'conversion', 'offer readiness', 'funnel performance'],
    language: ['offer', 'benefit', 'proof', 'customer result', 'clear next step', 'product interest'],
  },
  landing: {
    focus: ['lead capture', 'offer clarity', 'conversion', 'customer education', 'first purchase'],
    metrics: ['landing page readiness', 'form completion', 'cta click-through', 'lead magnet conversion'],
    language: ['customer result', 'proof', 'clear next step', 'first purchase'],
  },
  analytics: {
    focus: ['sales', 'revenue', 'conversion', 'customer pipeline', 'repeat purchase', 'retention', 'referral', 'funnel performance', 'content performance'],
    metrics: ['revenue', 'retention', 'repeat purchase', 'referral', 'conversion', 'customer pipeline'],
    language: ['sales performance', 'customer health', 'growth loop', 'content performance', 'funnel performance'],
  },
  ai: {
    focus: ['customer acquisition', 'sales improvement', 'follow-up quality', 'retention', 'customer health', 'repeat purchase', 'referral growth'],
    metrics: ['next best action', 'customer risk', 'follow-up priority', 'repeat purchase opportunity', 'referral opportunity'],
    language: ['sales coach', 'retention coach', 'customer health advisor', 'referral advisor', 'follow-up quality'],
  },
  aiProfile: {
    mission: 'Guide retail operators from customer acquisition to repeat purchase and referral using shared NextShift engines.',
    directives: [
      'Prioritize customer lifecycle clarity before advanced automation.',
      'Recommend actions that improve sales, retention, repeat purchase, or referral readiness.',
      'Use retail language centered on customers, offers, proof, and follow-up.',
    ],
    guardrails: [
      'Do not introduce recruitment or duplication language.',
      'Do not create retail-specific engine behavior outside workspace configuration.',
      'Preserve member-centric identity and shared business memory.',
    ],
  },
  aiCooProfile: {
    mission: 'Analyze Retail operating performance and recommend the next operational action through shared AI COO infrastructure.',
    directives: [
      'Prioritize sales, customer pipeline, retention, repeat orders, referral activity, and funnel conversion.',
      'Surface content gaps that block customer acquisition, repeat purchase, or referral activation.',
      'Recommend operational actions using the active Workspace Context and shared Business Memory.',
    ],
    guardrails: [
      'Do not create Retail-only COO engine branches.',
      'Do not introduce Operator identity concepts.',
      'Keep recommendations tied to member-centric workspace state.',
    ],
  },
  templates: [
    {
      id: 'retail_customer_education_post',
      name: 'Customer Education Post',
      namespace: 'retail.content.customer_education',
      capability: 'content',
      purpose: 'Teach prospects why the offer solves a real customer problem.',
      format: 'social_post',
    },
    {
      id: 'retail_offer_landing_page',
      name: 'Retail Offer Landing Page',
      namespace: 'retail.funnel.offer_landing',
      capability: 'landing',
      purpose: 'Convert interested customers into captured leads or conversations.',
      format: 'landing_page',
    },
    {
      id: 'retail_lead_magnet_education',
      name: 'Retail Lead Magnet Education',
      namespace: 'retail.landing.lead_magnet_education',
      capability: 'landing',
      purpose: 'Educate prospects and capture customer leads before the first purchase.',
      format: 'lead_magnet',
    },
    {
      id: 'retail_repeat_purchase_followup',
      name: 'Repeat Purchase Follow-Up',
      namespace: 'retail.crm.repeat_purchase_followup',
      capability: 'crm',
      purpose: 'Prompt existing customers toward the next appropriate purchase.',
      format: 'follow_up_sequence',
    },
    {
      id: 'retail_referral_prompt',
      name: 'Referral Prompt',
      namespace: 'retail.analytics.referral_prompt',
      capability: 'analytics',
      purpose: 'Identify and activate customers likely to refer.',
      format: 'recommendation',
    },
  ],
  navigation: {
    primaryWorkspaceRoute: '/dashboard',
    items: [
      { id: 'retail_dashboard', label: 'Dashboard', route: '/dashboard', capability: 'dashboard', priority: 10 },
      { id: 'retail_customers', label: 'Customers', route: '/customers', capability: 'crm', priority: 20 },
      { id: 'retail_crm', label: 'CRM', route: '/crm-center', capability: 'crm', priority: 30 },
      { id: 'retail_content', label: 'Content Studio', route: '/content-engine', capability: 'content', priority: 40 },
      { id: 'retail_offer_builder', label: 'Offers', route: '/lead-magnet', capability: 'landing', priority: 50 },
      { id: 'retail_funnel', label: 'Funnels', route: '/funnel-builder', capability: 'funnel', priority: 60 },
      { id: 'retail_landing_pages', label: 'Landing Pages', route: '/funnel-builder', capability: 'landing', priority: 70 },
      { id: 'retail_lead_magnets', label: 'Lead Magnets', route: '/lead-magnet', capability: 'landing', priority: 80 },
      { id: 'retail_customer_journey', label: 'Customer Journey', route: '/journey', capability: 'crm', priority: 90 },
      { id: 'retail_analytics', label: 'Analytics', route: '/analytics-center', capability: 'analytics', priority: 100 },
      { id: 'retail_ai_coach', label: 'AI Coach', route: '/ai/coach', capability: 'ai_coach', priority: 110 },
      { id: 'retail_ai_coo', label: 'AI COO', route: '/ceo-mode', capability: 'ai_coach', priority: 120 },
      { id: 'retail_referral', label: 'Referral', route: '/analytics-center', capability: 'analytics', priority: 130 },
      { id: 'retail_repeat_purchase', label: 'Repeat Purchase', route: '/crm-center', capability: 'crm', priority: 140 },
    ],
    capabilityRoutes,
  },
};

export const RECRUITMENT_WORKSPACE_CONFIG: WorkspaceConfig = {
  workspaceType: 'recruitment',
  workspaceName: 'Recruitment Business OS',
  label: 'Recruitment Business OS',
  contentTrack: 'recruitment',
  themeKey: 'recruitment',
  templateNamespace: 'recruitment',
  promptProfile: {
    namespace: 'recruitment',
    tone: ['opportunity-aware', 'duplication-focused', 'leadership-oriented'],
    constraints: ['preserve recruitment journey language', 'avoid retail customer-only framing'],
  },
  businessCapabilities: [
    'dashboard',
    'crm',
    'content',
    'recruitment_content',
    'funnel',
    'landing',
    'analytics',
    'ai_coach',
    'ai_coo',
    'personal_brand',
    'authority_building',
    'lead_generation',
    'business_journey',
    'opportunity_pipeline',
    'opportunity_funnel',
    'lead_magnet',
    'webinar',
    'fast_start',
    'team_building',
    'duplication',
    'leadership',
  ],
  enabledCapabilities: sharedCapabilities,
  dashboard: {
    focus: ['leads', 'appointments', 'presentations', 'activation', 'duplication', 'leadership', 'fast start', 'webinar'],
    metrics: ['appointments', 'activation', 'team growth', 'leadership', 'duplication', 'webinar readiness'],
    language: ['prospect journey', 'team growth', 'duplication'],
  },
  dashboardWidgets: [
    {
      id: 'recruitment_lead_pipeline',
      title: 'Recruitment Lead Pipeline',
      metric: 'lead status',
      route: '/crm-center',
      capability: 'crm',
    },
    {
      id: 'recruitment_appointment_velocity',
      title: 'Appointment Velocity',
      metric: 'appointments',
      route: '/analytics-center',
      capability: 'analytics',
    },
    {
      id: 'recruitment_presentation_readiness',
      title: 'Presentation Readiness',
      metric: 'presentation bookings',
      route: '/webinar-center',
      capability: 'funnel',
    },
    {
      id: 'recruitment_activation_health',
      title: 'Activation Health',
      metric: 'activation readiness',
      route: '/journey',
      capability: 'crm',
    },
    {
      id: 'recruitment_duplication_health',
      title: 'Duplication Health',
      metric: 'duplication readiness',
      route: '/ai-workforce',
      capability: 'analytics',
    },
    {
      id: 'recruitment_leadership_pipeline',
      title: 'Leadership Pipeline',
      metric: 'leader pipeline',
      route: '/ai-workforce',
      capability: 'analytics',
    },
    {
      id: 'recruitment_team_growth',
      title: 'Team Growth',
      metric: 'team growth',
      route: '/ai-workforce',
      capability: 'analytics',
    },
    {
      id: 'recruitment_opportunity_funnel_conversion',
      title: 'Opportunity Funnel Conversion',
      metric: 'activation interest',
      route: '/funnel-builder',
      capability: 'funnel',
    },
    {
      id: 'recruitment_webinar_readiness',
      title: 'Webinar Readiness',
      metric: 'webinar readiness',
      route: '/webinar-center',
      capability: 'funnel',
    },
    {
      id: 'recruitment_fast_start_progress',
      title: 'Fast Start Progress',
      metric: 'fast start progress',
      route: '/journey',
      capability: 'crm',
    },
    {
      id: 'recruitment_ai_coo_recommendations',
      title: 'AI COO Recommendations',
      metric: 'next best action',
      route: '/ceo-mode',
      capability: 'ai_coach',
    },
  ],
  crm: {
    focus: ['prospects', 'business journey', 'appointments', 'presentations', 'activation', 'fast start'],
    metrics: ['lead status', 'appointment progress', 'presentation readiness', 'activation readiness', 'duplication readiness'],
    language: ['prospect', 'appointment', 'presentation', 'activation', 'sponsor follow-up', 'fast start'],
  },
  content: {
    focus: ['personal brand', 'authority building', 'lead generation', 'recruitment', 'opportunity education', 'webinar invitation', 'duplication education', 'leadership proof'],
    metrics: ['authority content', 'lead generation', 'opportunity engagement', 'lead intent', 'webinar invite engagement', 'duplication content'],
    language: ['personal brand', 'authority', 'story', 'opportunity', 'education', 'objection handling', 'leadership'],
  },
  funnel: {
    focus: ['opportunity pipeline', 'opportunity funnel', 'business presentation', 'webinar', 'lead magnet', 'activation', 'duplication'],
    metrics: ['opt-ins', 'presentation bookings', 'webinar registrations', 'activation interest', 'opportunity conversion', 'duplication readiness'],
    language: ['opportunity', 'business presentation', 'opportunity pipeline', 'duplication', 'webinar', 'fast start'],
  },
  landing: {
    focus: ['opportunity education', 'presentation booking', 'activation intent', 'lead magnet', 'webinar registration'],
    metrics: ['landing page readiness', 'presentation booking rate', 'activation interest', 'lead magnet opt-in', 'webinar registration'],
    language: ['opportunity', 'proof', 'duplication path', 'clear invitation'],
  },
  analytics: {
    focus: ['appointments', 'activation', 'team growth', 'leadership', 'duplication', 'webinar', 'funnel performance'],
    metrics: ['appointment rate', 'activation rate', 'team growth', 'leader pipeline', 'duplication rate', 'webinar attendance'],
    language: ['team performance', 'duplication health', 'leadership growth', 'opportunity funnel'],
  },
  ai: {
    focus: ['recruitment', 'duplication', 'leadership', 'fast start', 'sponsor follow-up', 'activation'],
    metrics: ['next best action', 'prospect priority', 'leader development', 'fast start progress', 'duplication readiness'],
    language: ['recruitment coach', 'duplication coach', 'leadership advisor', 'sponsor coach'],
  },
  aiProfile: {
    mission: 'Guide recruitment builders from prospect education to activation, duplication, and leadership using shared NextShift engines.',
    directives: [
      'Prioritize appointment, presentation, activation, duplication, and leadership clarity.',
      'Recommend actions that improve sponsor follow-up, fast start progress, webinar readiness, or duplication readiness.',
      'Use recruitment language centered on opportunity, proof, presentation, activation, and team growth.',
    ],
    guardrails: [
      'Do not introduce retail customer-only framing.',
      'Do not create recruitment-specific engine behavior outside workspace configuration.',
      'Preserve member-centric identity and shared business memory.',
    ],
  },
  aiCooProfile: {
    mission: 'Analyze Recruitment operating performance and recommend the next operational action through shared AI COO infrastructure.',
    directives: [
      'Prioritize lead pipeline, appointments, presentations, activation, duplication, webinar readiness, and leadership growth.',
      'Surface content or funnel gaps that block opportunity education, fast start activation, or team duplication.',
      'Recommend operational actions using the active Workspace Context and shared Business Memory.',
    ],
    guardrails: [
      'Do not create Recruitment-only COO engine branches.',
      'Do not introduce Operator identity concepts.',
      'Keep recommendations tied to member-centric workspace state.',
    ],
  },
  templates: [
    {
      id: 'recruitment_opportunity_post',
      name: 'Opportunity Education Post',
      namespace: 'recruitment.content.opportunity_education',
      capability: 'content',
      purpose: 'Educate prospects on the business opportunity and invite a next step.',
      format: 'social_post',
    },
    {
      id: 'recruitment_authority_building_post',
      name: 'Authority Building Post',
      namespace: 'recruitment.content.authority_building',
      capability: 'content',
      purpose: 'Build personal-brand authority before inviting prospects into the opportunity pipeline.',
      format: 'social_post',
    },
    {
      id: 'recruitment_opportunity_landing_page',
      name: 'Opportunity Landing Page',
      namespace: 'recruitment.funnel.opportunity_landing',
      capability: 'landing',
      purpose: 'Convert opportunity interest into a presentation booking or webinar registration.',
      format: 'landing_page',
    },
    {
      id: 'recruitment_lead_magnet',
      name: 'Recruitment Lead Magnet',
      namespace: 'recruitment.landing.lead_magnet',
      capability: 'landing',
      purpose: 'Capture prospects seeking business education before a presentation.',
      format: 'lead_magnet',
    },
    {
      id: 'recruitment_webinar_invitation',
      name: 'Webinar Invitation',
      namespace: 'recruitment.funnel.webinar_invitation',
      capability: 'funnel',
      purpose: 'Invite prospects to an opportunity webinar or business presentation.',
      format: 'webinar_invitation',
    },
    {
      id: 'recruitment_fast_start_followup',
      name: 'Fast Start Follow-Up',
      namespace: 'recruitment.crm.fast_start_followup',
      capability: 'crm',
      purpose: 'Move new recruits through activation and first duplication steps.',
      format: 'follow_up_sequence',
    },
    {
      id: 'recruitment_duplication_prompt',
      name: 'Duplication Prompt',
      namespace: 'recruitment.analytics.duplication_prompt',
      capability: 'analytics',
      purpose: 'Identify next actions that improve team duplication readiness.',
      format: 'recommendation',
    },
    {
      id: 'recruitment_leadership_coaching_prompt',
      name: 'Leadership Coaching Prompt',
      namespace: 'recruitment.ai.leadership_coaching',
      capability: 'ai_coach',
      purpose: 'Coach members toward leadership behavior and team growth.',
      format: 'coach_prompt',
    },
  ],
  navigation: {
    primaryWorkspaceRoute: '/dashboard',
    items: [
      { id: 'recruitment_dashboard', label: 'Dashboard', route: '/dashboard', capability: 'dashboard', priority: 10 },
      { id: 'recruitment_leads', label: 'Leads', route: '/leads', capability: 'crm', priority: 20 },
      { id: 'recruitment_crm', label: 'CRM', route: '/crm-center', capability: 'crm', priority: 30 },
      { id: 'recruitment_business_journey', label: 'Business Journey', route: '/journey', capability: 'crm', priority: 40 },
      { id: 'recruitment_content', label: 'Recruitment Content', route: '/content-engine', capability: 'content', priority: 50 },
      { id: 'recruitment_opportunity_funnel', label: 'Opportunity Funnel', route: '/funnel-builder', capability: 'funnel', priority: 60 },
      { id: 'recruitment_landing_pages', label: 'Landing Pages', route: '/funnel-builder', capability: 'landing', priority: 70 },
      { id: 'recruitment_lead_magnets', label: 'Lead Magnets', route: '/lead-magnet', capability: 'landing', priority: 80 },
      { id: 'recruitment_webinar', label: 'Webinar', route: '/webinar-center', capability: 'funnel', priority: 90 },
      { id: 'recruitment_analytics', label: 'Analytics', route: '/analytics-center', capability: 'analytics', priority: 100 },
      { id: 'recruitment_ai_coach', label: 'AI Coach', route: '/ai/coach', capability: 'ai_coach', priority: 110 },
      { id: 'recruitment_ai_coo', label: 'AI COO', route: '/ceo-mode', capability: 'ai_coach', priority: 120 },
      { id: 'recruitment_fast_start', label: 'Fast Start', route: '/journey', capability: 'crm', priority: 130 },
      { id: 'recruitment_duplication', label: 'Duplication', route: '/ai-workforce', capability: 'analytics', priority: 140 },
      { id: 'recruitment_leadership', label: 'Leadership', route: '/ai-workforce', capability: 'analytics', priority: 150 },
    ],
    capabilityRoutes,
  },
};

export const WORKSPACE_CONFIG_REGISTRY: Readonly<Record<string, WorkspaceConfig>> = {
  retail: RETAIL_WORKSPACE_CONFIG,
  recruitment: RECRUITMENT_WORKSPACE_CONFIG,
};

export const RETAIL_WORKSPACE_MANIFEST: WorkspaceManifest = {
  workspaceType: 'retail',
  configuration: RETAIL_WORKSPACE_CONFIG,
};

export const RECRUITMENT_WORKSPACE_MANIFEST: WorkspaceManifest = {
  workspaceType: 'recruitment',
  configuration: RECRUITMENT_WORKSPACE_CONFIG,
};

export const WORKSPACE_MANIFEST_REGISTRY: Readonly<Record<string, WorkspaceManifest>> = {
  retail: RETAIL_WORKSPACE_MANIFEST,
  recruitment: RECRUITMENT_WORKSPACE_MANIFEST,
};

export const CAPABILITY_REGISTRY = sharedCapabilities.map((capability) => ({
  capability,
  enabledByDefault: true,
  requiredPermissions: [capabilityRequiredPermissions[capability]],
}));

export function getWorkspaceManifest(workspaceType: WorkspaceType): WorkspaceManifest {
  return WORKSPACE_MANIFEST_REGISTRY[workspaceType] ?? RETAIL_WORKSPACE_MANIFEST;
}

export function getWorkspaceConfig(workspaceType: WorkspaceType): WorkspaceConfig {
  return getWorkspaceManifest(workspaceType).configuration;
}
