import {
  isRuntimeFlagEnabledByDefault,
  RUNTIME_MISSION_FLAG,
} from '@/lib/runtime-flags';

export { RUNTIME_MISSION_FLAG };

export function isRuntimeMissionEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return isRuntimeFlagEnabledByDefault(RUNTIME_MISSION_FLAG, env);
}
