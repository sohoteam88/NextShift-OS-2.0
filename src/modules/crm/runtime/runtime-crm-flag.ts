import {
  isRuntimeFlagEnabledByDefault,
  RUNTIME_CRM_FLAG,
} from '@/lib/runtime-flags';

export { RUNTIME_CRM_FLAG };

export function isRuntimeCrmEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isRuntimeFlagEnabledByDefault(RUNTIME_CRM_FLAG, env);
}
