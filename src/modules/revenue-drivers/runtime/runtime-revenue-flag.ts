import {
  isRuntimeFlagEnabledByDefault,
  RUNTIME_REVENUE_FLAG,
} from '@/lib/runtime-flags';

export { RUNTIME_REVENUE_FLAG };

export function isRuntimeRevenueEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isRuntimeFlagEnabledByDefault(RUNTIME_REVENUE_FLAG, env);
}
