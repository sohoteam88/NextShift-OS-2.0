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

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

type E2EAccount = {
  email: string;
  password: string;
  name: string;
  role: 'member' | 'platform_admin';
  provisionToTenant: boolean;
  userMetadata: Record<string, string>;
};

function readAccounts(): E2EAccount[] {
  const member: E2EAccount = {
    email: requireEnv(readEnv('E2E_TEST_USER_EMAIL'), 'E2E_TEST_USER_EMAIL'),
    password: requireEnv(readEnv('E2E_TEST_USER_PASSWORD'), 'E2E_TEST_USER_PASSWORD'),
    name: 'E2E Test Member',
    role: 'member',
    provisionToTenant: true,
    userMetadata: { name: 'E2E Test Member' },
  };
  const admin: E2EAccount = {
    email: requireEnv(readEnv('E2E_ADMIN_EMAIL'), 'E2E_ADMIN_EMAIL'),
    password: requireEnv(readEnv('E2E_ADMIN_PASSWORD'), 'E2E_ADMIN_PASSWORD'),
    name: 'E2E Test Admin',
    role: 'platform_admin',
    provisionToTenant: true,
    userMetadata: { name: 'E2E Test Admin' },
  };
  const dangling: E2EAccount = {
    email: process.env.E2E_DANGLING_USER_EMAIL || 'e2e-dangling@example.test',
    password: process.env.E2E_DANGLING_USER_PASSWORD || 'e2e-dangling-password-123',
    name: 'E2E Dangling User',
    role: 'member',
    provisionToTenant: false,
    userMetadata: {},
  };

  if (member.email.toLowerCase() === admin.email.toLowerCase()) {
    throw new Error('E2E member and admin accounts must use different email addresses');
  }

  return [member, admin, dangling];
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

async function findAuthUserId(supabase: SupabaseClient, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function ensureAuthUser(supabase: SupabaseClient, account: E2EAccount) {
  const existingId = await findAuthUserId(supabase, account.email);
  if (existingId) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingId, {
      password: account.password,
      email_confirm: true,
      user_metadata: account.userMetadata,
      app_metadata: { role: account.role, source: 'e2e' },
    });
    if (error) throw error;
    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: account.userMetadata,
    app_metadata: { role: account.role, source: 'e2e' },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not return a created user');
  return data.user.id;
}

async function main() {
  const accounts = readAccounts();
  const supabase = createClient(
    requireEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

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

  for (const account of accounts) {
    const userId = await ensureAuthUser(supabase, account);

    if (!account.provisionToTenant) {
      await prisma.user.deleteMany({ where: { id: userId } });
      continue;
    }

    const userData = {
      tenantId: tenant.id,
      email: account.email,
      name: account.name,
      role: account.role,
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
    };

    await prisma.user.upsert({
      where: { id: userId },
      update: userData,
      create: { id: userId, ...userData },
    });
  }

  console.log(JSON.stringify({
    ok: true,
    provisionedRoles: accounts.filter(({ provisionToTenant }) => provisionToTenant).map(({ role }) => role),
    danglingFixture: true,
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
