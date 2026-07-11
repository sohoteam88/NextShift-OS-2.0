import {
  isRuntimeFlagEnabledByDefault,
  RUNTIME_BUSINESS_STATE_FLAG,
} from '@/lib/runtime-flags';

export { RUNTIME_BUSINESS_STATE_FLAG };

export function isRuntimeBusinessStateEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isRuntimeFlagEnabledByDefault(RUNTIME_BUSINESS_STATE_FLAG, env);
}
