export type RuntimeFlagName =
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE'
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS'
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_MISSION'
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE'
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_CRM'
  | 'NEXT_PUBLIC_ENABLE_COMMAND_CENTER'
  | 'NEXT_PUBLIC_ENABLE_AI_DISCUSSION';

export type RuntimeFlagDefinition = {
  name: RuntimeFlagName;
  module: 'revenue-drivers' | 'analytics' | 'mission-engine' | 'business-state' | 'crm' | 'dashboard';
  introducedAt: string;
  removalCondition: string;
};

export const RUNTIME_FLAGS = {
  REVENUE: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE',
    module: 'revenue-drivers',
    introducedAt: '2026-07-09',
    removalCondition:
      'Graduated to default-on in OS 3.4 A3; remove after the legacy fallback path is retired.',
  },
  ANALYTICS: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS',
    module: 'analytics',
    introducedAt: '2026-07-09',
    removalCondition:
      'Graduated to default-on in OS 3.4 A3; remove after the legacy fallback path is retired.',
  },
  MISSION: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_MISSION',
    module: 'mission-engine',
    introducedAt: '2026-07-10',
    removalCondition:
      'Remove after the Mission Runtime Adapter becomes the default path and legacy fallback is retired.',
  },
  BUSINESS_STATE: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE',
    module: 'business-state',
    introducedAt: '2026-07-10',
    removalCondition:
      'Remove after the Business State Runtime Adapter becomes the default path and legacy fallback is retired.',
  },
  CRM: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_CRM',
    module: 'crm',
    introducedAt: '2026-07-11',
    removalCondition:
      'Remove after the CRM Runtime Adapter becomes the default path and legacy fallback is retired.',
  },
  COMMAND_CENTER: {
    name: 'NEXT_PUBLIC_ENABLE_COMMAND_CENTER',
    module: 'dashboard',
    introducedAt: '2026-07-10',
    removalCondition:
      'Remove after the Command Center recommendation datapath becomes the default dashboard recommendation source.',
  },
  AI_DISCUSSION: {
    name: 'NEXT_PUBLIC_ENABLE_AI_DISCUSSION',
    module: 'dashboard',
    introducedAt: '2026-07-11',
    removalCondition:
      'Remove after Business Discussion becomes the default Command Center discussion path and legacy non-discussion behavior is retired.',
  },
} as const satisfies Record<string, RuntimeFlagDefinition>;

export const RUNTIME_REVENUE_FLAG = RUNTIME_FLAGS.REVENUE.name;
export const RUNTIME_ANALYTICS_FLAG = RUNTIME_FLAGS.ANALYTICS.name;
export const RUNTIME_MISSION_FLAG = RUNTIME_FLAGS.MISSION.name;
export const RUNTIME_BUSINESS_STATE_FLAG = RUNTIME_FLAGS.BUSINESS_STATE.name;
export const RUNTIME_CRM_FLAG = RUNTIME_FLAGS.CRM.name;
export const COMMAND_CENTER_FLAG = RUNTIME_FLAGS.COMMAND_CENTER.name;
export const AI_DISCUSSION_FLAG = RUNTIME_FLAGS.AI_DISCUSSION.name;

export function isRuntimeFlagEnabled(
  flag: RuntimeFlagName,
  env: NodeJS.ProcessEnv = process.env,
) {
  return env[flag] === 'true';
}

export function isRuntimeFlagEnabledByDefault(
  flag: RuntimeFlagName,
  env: NodeJS.ProcessEnv = process.env,
) {
  return env[flag] === undefined ? true : env[flag] === 'true';
}
