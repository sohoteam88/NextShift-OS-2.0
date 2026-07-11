import {
  isRuntimeFlagEnabled,
  RUNTIME_CRM_FLAG,
} from '@/lib/runtime-flags';

export { RUNTIME_CRM_FLAG };

export function isRuntimeCrmEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isRuntimeFlagEnabled(RUNTIME_CRM_FLAG, env);
}
