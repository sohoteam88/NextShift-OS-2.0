import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function readDotEnvValue(file: string, name: string) {
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line.startsWith(`${name}=`)) continue;
      const raw = line.slice(name.length + 1).trim();
      return raw.replace(/^"|"$/g, '');
    }
  } catch {
    return '';
  }
  return '';
}

function readEnv(name: string) {
  return process.env[name] || readDotEnvValue('.env.local', name) || readDotEnvValue('.env', name);
}

const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
const email = readEnv('E2E_TEST_USER_EMAIL') || 'test-user@example.test';
const password = readEnv('E2E_TEST_USER_PASSWORD') || 'test-password-123';

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function tenantSettings(): Prisma.InputJsonValue {
  return {
    default_language: 'zh',
    ai_monthly_quota: 1000,
    max_ai_calls: 1000,
    member_limit: 10,
    max_members: 10,
    storage_limit_mb: 1024,
    max_storage_mb: 1024,
    branding: { primary_color: '#2563eb' },
  };
}

async function findAuthUserId(supabase: SupabaseClient) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function ensureAuthUser() {
  const supabase = createClient(requireEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL'), requireEnv(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existingId = await findAuthUserId(supabase);
  if (existingId) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
      user_metadata: { name: 'E2E Test User' },
      app_metadata: { role: 'operator', source: 'e2e' },
    });
    if (error) throw error;
    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'E2E Test User' },
    app_metadata: { role: 'operator', source: 'e2e' },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not return a created user');
  return data.user.id;
}

async function main() {
  const userId = await ensureAuthUser();

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'e2e' },
    update: {
      name: 'E2E Tenant',
      plan: 'pro',
      status: 'active',
      maxMembers: 10,
      maxAiCalls: 1000,
      settings: tenantSettings(),
    },
    create: {
      name: 'E2E Tenant',
      slug: 'e2e',
      plan: 'pro',
      status: 'active',
      maxMembers: 10,
      maxAiCalls: 1000,
      settings: tenantSettings(),
    },
  });

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      tenantId: tenant.id,
      email,
      name: 'E2E Test User',
      role: 'operator',
      status: 'active',
      languagePreference: 'zh',
      onboardingCompleted: true,
      metadata: {
        e2e: true,
        onboarding: {
          completed: true,
          current_step: 5,
          completed_steps: ['profile', 'goals', 'brand', 'first_content', 'first_funnel'],
          completed_at: new Date().toISOString(),
        },
      } as Prisma.InputJsonValue,
    },
    create: {
      id: userId,
      tenantId: tenant.id,
      email,
      name: 'E2E Test User',
      role: 'operator',
      status: 'active',
      languagePreference: 'zh',
      onboardingCompleted: true,
      metadata: {
        e2e: true,
        onboarding: {
          completed: true,
          current_step: 5,
          completed_steps: ['profile', 'goals', 'brand', 'first_content', 'first_funnel'],
          completed_at: new Date().toISOString(),
        },
      } as Prisma.InputJsonValue,
    },
  });

  console.log(JSON.stringify({ ok: true, userId, tenantId: tenant.id, email }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
