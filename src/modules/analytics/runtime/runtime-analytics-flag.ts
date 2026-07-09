import {
  isRuntimeFlagEnabled,
  RUNTIME_ANALYTICS_FLAG,
} from '@/lib/runtime-flags';

export { RUNTIME_ANALYTICS_FLAG };

export function isRuntimeAnalyticsEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isRuntimeFlagEnabled(RUNTIME_ANALYTICS_FLAG, env);
}
