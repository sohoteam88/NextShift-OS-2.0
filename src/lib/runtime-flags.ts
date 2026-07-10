export type RuntimeFlagName =
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE'
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS'
  | 'NEXT_PUBLIC_ENABLE_RUNTIME_MISSION';

export type RuntimeFlagDefinition = {
  name: RuntimeFlagName;
  module: 'revenue-drivers' | 'analytics' | 'mission-engine';
  introducedAt: string;
  removalCondition: string;
};

export const RUNTIME_FLAGS = {
  REVENUE: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE',
    module: 'revenue-drivers',
    introducedAt: '2026-07-09',
    removalCondition:
      'Remove after the Revenue Runtime Adapter becomes the default path and legacy fallback is retired.',
  },
  ANALYTICS: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS',
    module: 'analytics',
    introducedAt: '2026-07-09',
    removalCondition:
      'Remove after the Analytics Runtime Adapter becomes the default path and legacy fallback is retired.',
  },
  MISSION: {
    name: 'NEXT_PUBLIC_ENABLE_RUNTIME_MISSION',
    module: 'mission-engine',
    introducedAt: '2026-07-10',
    removalCondition:
      'Remove after the Mission Runtime Adapter becomes the default path and legacy fallback is retired.',
  },
} as const satisfies Record<string, RuntimeFlagDefinition>;

export const RUNTIME_REVENUE_FLAG = RUNTIME_FLAGS.REVENUE.name;
export const RUNTIME_ANALYTICS_FLAG = RUNTIME_FLAGS.ANALYTICS.name;
export const RUNTIME_MISSION_FLAG = RUNTIME_FLAGS.MISSION.name;

export function isRuntimeFlagEnabled(
  flag: RuntimeFlagName,
  env: NodeJS.ProcessEnv = process.env,
) {
  return env[flag] === 'true';
}
