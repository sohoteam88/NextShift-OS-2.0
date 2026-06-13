// ============================================================
// Environment Variable Validation — Zod
// Fails fast on missing required vars. Optional AI keys
// mark providers unavailable without crashing.
// ============================================================

import { z } from 'zod';

// ---- Schema ----
const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Database (required)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI Providers (optional — missing key = provider unavailable)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  MINIMAX_API_KEY: z.string().optional(),

  // Optional integrations
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  N8N_WEBHOOK_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

// ---- Types ----
export type Env = z.infer<typeof envSchema>;

// ---- Client-safe subset (never expose secrets to client) ----
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

// ---- Parse ----
function parseEnv(): Env {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
    WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    REDIS_URL: process.env.REDIS_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === 'too_small' || i.code === 'invalid_type')
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n  ');
    throw new Error(`Environment validation failed:\n  ${missing}`);
  }

  return result.data;
}

// ---- Singleton ----
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) _env = parseEnv();
  return _env;
}

/**
 * Get client-safe env vars for Next.js public exposure.
 * Never includes server-only secrets.
 */
export function getClientEnv(): ClientEnv {
  const env = getEnv();
  return {
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Check which AI providers are available based on API keys.
 */
export function getAvailableAIProviders(): string[] {
  const env = getEnv();
  const providers: string[] = [];
  if (env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (env.OPENAI_API_KEY) providers.push('openai');
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) providers.push('gemini');
  if (env.DEEPSEEK_API_KEY) providers.push('deepseek');
  if (env.MINIMAX_API_KEY) providers.push('minimax');
  return providers;
}

export default getEnv;
