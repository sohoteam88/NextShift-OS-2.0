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
  label: 'Retail Business OS',
  contentTrack: 'retail',
  themeKey: 'retail',
  templateNamespace: 'retail',
  promptProfile: {
    namespace: 'retail',
    tone: ['customer-first', 'practical', 'commercially clear'],
    constraints: ['preserve retail customer lifecycle language', 'avoid recruitment-specific duplication language'],
  },
  enabledCapabilities: sharedCapabilities,
  dashboard: {
    focus: ['customer pipeline', 'sales', 'retention', 'orders', 'repeat purchase', 'referral'],
    metrics: ['sales', 'retention', 'repeat purchase', 'referral'],
    language: ['customer lifecycle', 'offer journey', 'customer health'],
  },
  crm: {
    focus: ['customer lifecycle'],
    metrics: ['lead conversion', 'customer status', 'repeat purchase readiness'],
    language: ['customer', 'follow-up', 'retention'],
  },
  content: {
    focus: ['retail', 'customer acquisition'],
    metrics: ['content output', 'lead magnet engagement', 'customer education'],
    language: ['education', 'story', 'offer', 'retention'],
  },
  funnel: {
    focus: ['offer', 'customer journey'],
    metrics: ['visits', 'lead capture', 'conversion'],
    language: ['offer', 'benefit', 'proof', 'customer result'],
  },
  landing: {
    focus: ['lead capture', 'offer clarity', 'conversion'],
    metrics: ['landing page readiness', 'form completion', 'cta click-through'],
    language: ['customer result', 'proof', 'clear next step'],
  },
  analytics: {
    focus: ['sales', 'retention', 'repeat purchase', 'referral'],
    metrics: ['revenue', 'retention', 'repeat purchase', 'referral'],
    language: ['sales performance', 'customer health', 'growth loop'],
  },
  ai: {
    focus: ['sales', 'retention', 'customer health'],
    metrics: ['next best action', 'customer risk', 'follow-up priority'],
    language: ['sales coach', 'retention coach', 'customer health advisor'],
  },
  navigation: {
    primaryWorkspaceRoute: '/workspace',
    capabilityRoutes,
  },
};

export const RECRUITMENT_WORKSPACE_CONFIG: WorkspaceConfig = {
  workspaceType: 'recruitment',
  label: 'Recruitment Business OS',
  contentTrack: 'recruitment',
  themeKey: 'recruitment',
  templateNamespace: 'recruitment',
  promptProfile: {
    namespace: 'recruitment',
    tone: ['opportunity-aware', 'duplication-focused', 'leadership-oriented'],
    constraints: ['preserve recruitment journey language', 'avoid retail customer-only framing'],
  },
  enabledCapabilities: sharedCapabilities,
  dashboard: {
    focus: ['leads', 'appointments', 'presentations', 'activation', 'duplication', 'leadership'],
    metrics: ['appointments', 'activation', 'team growth', 'leadership'],
    language: ['prospect journey', 'team growth', 'duplication'],
  },
  crm: {
    focus: ['prospect', 'business journey'],
    metrics: ['lead status', 'appointment progress', 'activation readiness'],
    language: ['prospect', 'appointment', 'presentation', 'activation'],
  },
  content: {
    focus: ['authority', 'recruitment', 'opportunity education'],
    metrics: ['authority content', 'opportunity engagement', 'lead intent'],
    language: ['authority', 'story', 'opportunity', 'education'],
  },
  funnel: {
    focus: ['opportunity', 'business presentation'],
    metrics: ['opt-ins', 'presentation bookings', 'activation interest'],
    language: ['opportunity', 'business presentation', 'duplication'],
  },
  landing: {
    focus: ['opportunity education', 'presentation booking', 'activation intent'],
    metrics: ['landing page readiness', 'presentation booking rate', 'activation interest'],
    language: ['opportunity', 'proof', 'duplication path'],
  },
  analytics: {
    focus: ['appointments', 'activation', 'team growth', 'leadership'],
    metrics: ['appointment rate', 'activation rate', 'team growth', 'leader pipeline'],
    language: ['team performance', 'duplication health', 'leadership growth'],
  },
  ai: {
    focus: ['recruitment', 'duplication', 'leadership'],
    metrics: ['next best action', 'prospect priority', 'leader development'],
    language: ['recruitment coach', 'duplication coach', 'leadership advisor'],
  },
  navigation: {
    primaryWorkspaceRoute: '/workspace',
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
