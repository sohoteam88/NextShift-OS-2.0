export const RUNTIME_ANALYTICS_FLAG = 'NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS';

export function isRuntimeAnalyticsEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return env[RUNTIME_ANALYTICS_FLAG] === 'true';
}
