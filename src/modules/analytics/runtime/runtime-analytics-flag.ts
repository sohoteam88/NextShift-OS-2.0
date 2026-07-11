import {
  isRuntimeFlagEnabledByDefault,
  RUNTIME_ANALYTICS_FLAG,
} from '@/lib/runtime-flags';

export { RUNTIME_ANALYTICS_FLAG };

export function isRuntimeAnalyticsEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isRuntimeFlagEnabledByDefault(RUNTIME_ANALYTICS_FLAG, env);
}
