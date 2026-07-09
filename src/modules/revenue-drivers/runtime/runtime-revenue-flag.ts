export const RUNTIME_REVENUE_FLAG = 'NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE';

export function isRuntimeRevenueEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return env[RUNTIME_REVENUE_FLAG] === 'true';
}
