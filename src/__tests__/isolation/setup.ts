import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { PLAN_TIERS, type PlanTier } from '@/modules/tenant/constants/plans';

type SeedUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  languagePreference: string;
};

type SeedTenant = {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  status: string;
  maxMembers: number;
  maxAiCalls: number;
};

type SeedLead = {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
};

export type IsolationFixture = {
  suffix: string;
  tenantA: SeedTenant;
  tenantB: SeedTenant;
  users: {
    operatorA: AuthUser;
    leaderA: AuthUser;
    memberA: AuthUser;
    operatorB: AuthUser;
    memberB: AuthUser;
  };
  dbUsers: {
    operatorA: SeedUser;
    leaderA: SeedUser;
    memberA: SeedUser;
    operatorB: SeedUser;
    memberB: SeedUser;
  };
  leads: {
    tenantA: SeedLead[];
    tenantB: SeedLead[];
  };
  funnels: {
    tenantA: Array<{ id: string; slug: string; title: string }>;
    tenantB: Array<{ id: string; slug: string; title: string }>;
  };
  templates: {
    tenantA: Array<{ id: string; category: string; name: string }>;
    tenantB: Array<{ id: string; category: string; name: string }>;
  };
  inviteCodeA: string;
};

function buildSettings(plan: PlanTier) {
  const tier = PLAN_TIERS[plan];

  return {
    default_language: 'zh',
    ai_monthly_quota: tier.max_ai_calls,
    max_ai_calls: tier.max_ai_calls,
    member_limit: tier.max_members,
    max_members: tier.max_members,
    storage_limit_mb: tier.max_storage_mb,
    max_storage_mb: tier.max_storage_mb,
    branding: { primary_color: '#2563eb' },
    logo_url: null,
    training_modules: [
      { id: 'mod-1', name: 'Module 1', description: 'One', order: 1 },
      { id: 'mod-2', name: 'Module 2', description: 'Two', order: 2 },
      { id: 'mod-3', name: 'Module 3', description: 'Three', order: 3 },
      { id: 'mod-4', name: 'Module 4', description: 'Four', order: 4 },
      { id: 'mod-5', name: 'Module 5', description: 'Five', order: 5 },
    ],
    default_daily_actions: [
      { type: 'learn.ai_coach', description: 'AI coach' },
      { type: 'content.education_post', description: 'Post content' },
      { type: 'crm.follow_up', description: 'Follow up' },
      { type: 'crm.whatsapp_reply', description: 'Reply' },
      { type: 'learn.reflection', description: 'Reflect' },
    ],
    plan,
    custom_branding: tier.custom_branding,
  };
}

function createAuthUser(user: SeedUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
    name: user.name,
    preferredLanguage: user.languagePreference,
    status: user.status,
  };
}

function makeUser(tenantId: string, role: string, name: string, email: string): SeedUser {
  return {
    id: randomUUID(),
    tenantId,
    email,
    name,
    phone: null,
    role,
    status: 'active',
    languagePreference: 'zh',
  };
}

async function createTenantRecord(
  name: string,
  slug: string,
  plan: PlanTier,
): Promise<SeedTenant> {
  const tier = PLAN_TIERS[plan];
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      plan,
      maxMembers: tier.max_members,
      maxAiCalls: tier.max_ai_calls,
      status: 'active',
      settings: buildSettings(plan) as Prisma.InputJsonValue,
    },
  });

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan as PlanTier,
    status: tenant.status,
    maxMembers: tenant.maxMembers,
    maxAiCalls: tenant.maxAiCalls,
  };
}

async function createTemplate(
  tenantId: string,
  name: string,
  category: string,
  isDefault = false,
) {
  return prisma.aIPromptTemplate.create({
    data: {
      tenantId,
      name,
      category,
      prompt: `${name} prompt`,
      systemPrompt: `${name} system`,
      userPromptTemplate: `${name} user`,
      variables: ['topic'],
      language: 'zh',
      modelPreference: 'anthropic',
      isDefault,
    },
  });
}

async function createFunnel(tenantId: string, ownerId: string, title: string, slug: string, status: string) {
  return prisma.funnel.create({
    data: {
      tenantId,
      ownerId,
      title,
      slug,
      config: {
        sections: [
          { type: 'hero', title },
          { type: 'form', title: `${title} form` },
          { type: 'cta', label: 'Submit' },
        ],
      } as Prisma.InputJsonValue,
      status,
      publishedAt: status === 'published' ? new Date() : null,
    },
  });
}

async function createLead(
  tenantId: string,
  ownerId: string,
  name: string,
  pipelineStage: string,
) {
  return prisma.lead.create({
    data: {
      tenantId,
      ownerId,
      name,
      phone: `+60${Math.floor(Math.random() * 1_000_000_000)
        .toString()
        .padStart(9, '0')}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.test`,
      source: 'seed',
      pipelineStage,
      score: pipelineStage === 'won' ? 90 : 10,
      metadata: { seed: true } as Prisma.InputJsonValue,
    },
  });
}

async function createActivity(tenantId: string, leadId: string, userId: string, type: string, description: string) {
  return prisma.activity.create({
    data: {
      tenantId,
      leadId,
      userId,
      type,
      description,
      metadata: {} as Prisma.InputJsonValue,
    },
  });
}

async function createNote(leadId: string, userId: string, content: string) {
  return prisma.note.create({
    data: {
      leadId,
      userId,
      content,
    },
  });
}

async function createAiUsageLog(tenantId: string, userId: string, feature: string, cost: string) {
  return prisma.aIUsageLog.create({
    data: {
      tenantId,
      userId,
      provider: 'openai',
      model: 'gpt-4o',
      category: feature,
      feature,
      tokensIn: 120,
      tokensOut: 40,
      durationMs: 800,
      costUsd: new Prisma.Decimal(cost),
    },
  });
}

export async function createTestTenants(): Promise<IsolationFixture> {
  const suffix = randomUUID().slice(0, 8);

  const tenantA = await createTenantRecord(`Tenant A ${suffix}`, `tenant-a-${suffix}`, 'starter');
  const tenantB = await createTenantRecord(`Tenant B ${suffix}`, `tenant-b-${suffix}`, 'pro');

  const dbUsers = {
    operatorA: makeUser(tenantA.id, 'operator', `Operator A ${suffix}`, `operator-a-${suffix}@example.test`),
    leaderA: makeUser(tenantA.id, 'leader', `Leader A ${suffix}`, `leader-a-${suffix}@example.test`),
    memberA: makeUser(tenantA.id, 'member', `Member A ${suffix}`, `member-a-${suffix}@example.test`),
    operatorB: makeUser(tenantB.id, 'operator', `Operator B ${suffix}`, `operator-b-${suffix}@example.test`),
    memberB: makeUser(tenantB.id, 'member', `Member B ${suffix}`, `member-b-${suffix}@example.test`),
  };

  await prisma.user.create({ data: dbUsers.operatorA });
  await prisma.user.create({ data: { ...dbUsers.leaderA, sponsorId: dbUsers.operatorA.id } });
  await prisma.user.create({ data: { ...dbUsers.memberA, sponsorId: dbUsers.leaderA.id } });
  await prisma.user.create({ data: dbUsers.operatorB });
  await prisma.user.create({ data: { ...dbUsers.memberB, sponsorId: dbUsers.operatorB.id } });

  const leadsA = await Promise.all([
    createLead(tenantA.id, dbUsers.memberA.id, `Alpha A ${suffix}`, 'new'),
    createLead(tenantA.id, dbUsers.memberA.id, `Beta A ${suffix}`, 'contacted'),
    createLead(tenantA.id, dbUsers.leaderA.id, `Gamma A ${suffix}`, 'qualified'),
    createLead(tenantA.id, dbUsers.operatorA.id, `Delta A ${suffix}`, 'won'),
    createLead(tenantA.id, dbUsers.leaderA.id, `Epsilon A ${suffix}`, 'lost'),
  ]);

  const leadsB = await Promise.all([
    createLead(tenantB.id, dbUsers.memberB.id, `Alpha B ${suffix}`, 'new'),
    createLead(tenantB.id, dbUsers.memberB.id, `Beta B ${suffix}`, 'contacted'),
    createLead(tenantB.id, dbUsers.operatorB.id, `Gamma B ${suffix}`, 'won'),
  ]);

  const funnelsA = await Promise.all([
    createFunnel(tenantA.id, dbUsers.operatorA.id, `Tenant A Funnel 1 ${suffix}`, `tenant-a-funnel-1-${suffix}`, 'published'),
    createFunnel(tenantA.id, dbUsers.leaderA.id, `Tenant A Funnel 2 ${suffix}`, `tenant-a-funnel-2-${suffix}`, 'draft'),
  ]);

  const funnelsB = await Promise.all([
    createFunnel(tenantB.id, dbUsers.operatorB.id, `Tenant B Funnel ${suffix}`, `tenant-b-funnel-${suffix}`, 'published'),
  ]);

  const templatesA = await Promise.all([
    createTemplate(tenantA.id, `Tenant A Content ${suffix}`, 'content', true),
    createTemplate(tenantA.id, `Tenant A WhatsApp ${suffix}`, 'whatsapp_reply'),
    createTemplate(tenantA.id, `Tenant A Analysis ${suffix}`, 'lead_analysis'),
  ]);

  const templatesB = await Promise.all([
    createTemplate(tenantB.id, `Tenant B Content ${suffix}`, 'content', true),
    createTemplate(tenantB.id, `Tenant B WhatsApp ${suffix}`, 'whatsapp_reply'),
  ]);

  await Promise.all([
    createNote(leadsA[0].id, dbUsers.memberA.id, `Tenant A note 1 ${suffix}`),
    createNote(leadsA[1].id, dbUsers.leaderA.id, `Tenant A note 2 ${suffix}`),
    createNote(leadsA[2].id, dbUsers.operatorA.id, `Tenant A note 3 ${suffix}`),
  ]);

  await Promise.all([
    createActivity(tenantA.id, leadsA[0].id, dbUsers.memberA.id, 'lead_created', `Tenant A activity 1 ${suffix}`),
    createActivity(tenantA.id, leadsA[1].id, dbUsers.memberA.id, 'note_added', `Tenant A activity 2 ${suffix}`),
    createActivity(tenantA.id, leadsA[2].id, dbUsers.leaderA.id, 'stage_change', `Tenant A activity 3 ${suffix}`),
    createActivity(tenantA.id, leadsA[3].id, dbUsers.operatorA.id, 'lead_created', `Tenant A activity 4 ${suffix}`),
    createActivity(tenantA.id, leadsA[4].id, dbUsers.leaderA.id, 'follow_up', `Tenant A activity 5 ${suffix}`),
    createActivity(tenantA.id, leadsA[0].id, dbUsers.memberA.id, 'lead_viewed', `Tenant A activity 6 ${suffix}`),
    createActivity(tenantA.id, leadsA[1].id, dbUsers.memberA.id, 'content_created', `Tenant A activity 7 ${suffix}`),
    createActivity(tenantA.id, leadsA[2].id, dbUsers.operatorA.id, 'ai_used', `Tenant A activity 8 ${suffix}`),
    createActivity(tenantA.id, leadsA[3].id, dbUsers.leaderA.id, 'daily_action', `Tenant A activity 9 ${suffix}`),
    createActivity(tenantA.id, leadsA[4].id, dbUsers.memberA.id, 'training_completed', `Tenant A activity 10 ${suffix}`),
  ]);

  await Promise.all([
    createAiUsageLog(tenantA.id, dbUsers.memberA.id, 'content_generator', '0.012000'),
    createAiUsageLog(tenantA.id, dbUsers.leaderA.id, 'whatsapp_reply', '0.014000'),
    createAiUsageLog(tenantA.id, dbUsers.operatorA.id, 'lead_analysis', '0.011000'),
    createAiUsageLog(tenantB.id, dbUsers.memberB.id, 'content_generator', '0.012000'),
    createAiUsageLog(tenantB.id, dbUsers.memberB.id, 'content_generator', '0.012000'),
    createAiUsageLog(tenantB.id, dbUsers.operatorB.id, 'whatsapp_reply', '0.014000'),
    createAiUsageLog(tenantB.id, dbUsers.operatorB.id, 'lead_analysis', '0.011000'),
  ]);

  const inviteCodeA = `invite-a-${suffix}`;
  await prisma.inviteCode.create({
    data: {
      tenantId: tenantA.id,
      sponsorId: dbUsers.operatorA.id,
      code: inviteCodeA,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    suffix,
    tenantA,
    tenantB,
    users: {
      operatorA: createAuthUser(dbUsers.operatorA),
      leaderA: createAuthUser(dbUsers.leaderA),
      memberA: createAuthUser(dbUsers.memberA),
      operatorB: createAuthUser(dbUsers.operatorB),
      memberB: createAuthUser(dbUsers.memberB),
    },
    dbUsers,
    leads: {
      tenantA: leadsA.map((lead) => ({ id: lead.id, tenantId: lead.tenantId, ownerId: lead.ownerId, name: lead.name })),
      tenantB: leadsB.map((lead) => ({ id: lead.id, tenantId: lead.tenantId, ownerId: lead.ownerId, name: lead.name })),
    },
    funnels: {
      tenantA: funnelsA.map((funnel) => ({ id: funnel.id, slug: funnel.slug, title: funnel.title })),
      tenantB: funnelsB.map((funnel) => ({ id: funnel.id, slug: funnel.slug, title: funnel.title })),
    },
    templates: {
      tenantA: templatesA.map((template) => ({ id: template.id, category: template.category, name: template.name })),
      tenantB: templatesB.map((template) => ({ id: template.id, category: template.category, name: template.name })),
    },
    inviteCodeA,
  };
}

export async function cleanupTestTenants(fixture: IsolationFixture) {
  const tenantIds = [fixture.tenantA.id, fixture.tenantB.id];
  const leadIds = [...fixture.leads.tenantA, ...fixture.leads.tenantB].map((lead) => lead.id);

  await prisma.note.deleteMany({
    where: {
      leadId: {
        in: leadIds,
      },
    },
  });
  await prisma.activity.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.aIUsageLog.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.dailyAction.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.trainingProgress.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.content.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.voiceProfile.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.analyticsEvent.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.scheduledMessage.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.lead.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.inviteCode.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.funnel.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.funnelTemplate.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.aIPromptTemplate.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.whatsAppSequence.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.tag.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.pipelineStage.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } });

  await prisma.user.deleteMany({ where: { tenantId: { in: tenantIds } } });

  await prisma.tenant.deleteMany({
    where: {
      id: {
        in: tenantIds,
      },
    },
  });
}

export function makeNextRequest(url: string, body?: unknown, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const request = new Request(url, {
    ...init,
    method: init.method ?? (body !== undefined ? 'POST' : 'GET'),
    headers,
    body: body === undefined ? init.body : JSON.stringify(body),
  });

  Object.defineProperty(request, 'nextUrl', {
    value: new URL(url),
  });

  return request as NextRequest;
}
