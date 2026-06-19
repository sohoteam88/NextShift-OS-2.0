import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';

async function checkEnv() {
  const checks: Record<string, boolean> = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
    SENTRY_DSN: !!process.env.SENTRY_DSN,
    POSTHOG_KEY: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
    BILLPLZ_API_KEY: !!process.env.BILLPLZ_API_KEY,
    BILLPLZ_X_SIGNATURE_KEY: !!process.env.BILLPLZ_X_SIGNATURE_KEY,
  };
  const ok = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { checks, healthy: ok === total, score: Math.round((ok / total) * 100), missing: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k) };
}

export const GET = apiHandler(async () => {
  const user = await requireAuthApi({} as any);
  requireRoleApi(user, ['platform_admin']);
  const env = await checkEnv();
  return NextResponse.json({ data: env });
});
