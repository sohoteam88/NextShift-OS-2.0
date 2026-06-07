import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const demoSlug = 'demo';

function buildSettings() {
  return {
    default_language: 'zh',
    ai_monthly_quota: 1000,
    max_ai_calls: 1000,
    member_limit: 50,
    max_members: 50,
    storage_limit_mb: 1024,
    max_storage_mb: 1024,
    branding: { primary_color: '#2563eb' },
    logo_url: null,
    training_modules: [
      { id: 'm1', name: 'Welcome', description: 'Intro', order: 1 },
      { id: 'm2', name: 'CRM Basics', description: 'Leads', order: 2 },
      { id: 'm3', name: 'AI Content', description: 'Prompts', order: 3 },
    ],
    default_daily_actions: [
      { type: 'learn.ai_coach', description: 'AI coach' },
      { type: 'content.education_post', description: 'Post content' },
      { type: 'crm.follow_up', description: 'Follow up' },
      { type: 'crm.whatsapp_reply', description: 'Reply' },
      { type: 'learn.reflection', description: 'Reflect' },
    ],
  } satisfies Prisma.InputJsonValue;
}

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { slug: demoSlug } });
  if (existing) {
    await prisma.tenant.delete({ where: { id: existing.id } });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Tenant',
      slug: demoSlug,
      plan: 'pro',
      status: 'active',
      maxMembers: 50,
      maxAiCalls: 1000,
      settings: buildSettings(),
    },
  });

  const operator = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: tenant.id,
      email: 'operator@demo.test',
      name: 'Demo Operator',
      role: 'operator',
      status: 'active',
      languagePreference: 'zh',
      onboardingCompleted: true,
      phone: '+60123456789',
      metadata: { seeded: true } as Prisma.InputJsonValue,
    },
  });

  const leader = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000002',
      tenantId: tenant.id,
      email: 'leader@demo.test',
      name: 'Demo Leader',
      role: 'leader',
      status: 'active',
      languagePreference: 'zh',
      onboardingCompleted: true,
      sponsorId: operator.id,
      phone: '+60123456780',
      metadata: { seeded: true } as Prisma.InputJsonValue,
    },
  });

  const members = await Promise.all([
    prisma.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000003',
        tenantId: tenant.id,
        email: 'member1@demo.test',
        name: 'Demo Member 1',
        role: 'member',
        status: 'active',
        languagePreference: 'zh',
        onboardingCompleted: true,
        sponsorId: leader.id,
        metadata: { seeded: true } as Prisma.InputJsonValue,
      },
    }),
    prisma.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000004',
        tenantId: tenant.id,
        email: 'member2@demo.test',
        name: 'Demo Member 2',
        role: 'member',
        status: 'active',
        languagePreference: 'zh',
        onboardingCompleted: true,
        sponsorId: leader.id,
        metadata: { seeded: true } as Prisma.InputJsonValue,
      },
    }),
    prisma.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000005',
        tenantId: tenant.id,
        email: 'member3@demo.test',
        name: 'Demo Member 3',
        role: 'member',
        status: 'active',
        languagePreference: 'zh',
        onboardingCompleted: true,
        sponsorId: leader.id,
        metadata: { seeded: true } as Prisma.InputJsonValue,
      },
    }),
  ]);

  const owners = [operator, leader, ...members];
  const stageCycle = ['new', 'contacted', 'qualified', 'booked', 'won', 'lost'];
  const leads = [];
  for (let i = 0; i < 25; i += 1) {
    const owner = owners[i % owners.length];
    const stage = stageCycle[i % stageCycle.length];
    leads.push(
      await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          ownerId: owner.id,
          name: `Demo Lead ${i + 1}`,
          phone: `+60123${String(10000 + i).padStart(5, '0')}`,
          email: `lead${i + 1}@demo.test`,
          source: i % 2 === 0 ? 'facebook' : 'whatsapp',
          pipelineStage: stage,
          score: 20 + (i % 5) * 10,
          metadata: { seed: true, index: i + 1 } as Prisma.InputJsonValue,
        },
      }),
    );
  }

  await Promise.all(
    leads.slice(0, 5).map((lead, index) =>
      prisma.note.create({
        data: {
          leadId: lead.id,
          userId: owners[index % owners.length].id,
          content: `Demo note ${index + 1}`,
        },
      }),
    ),
  );

  await Promise.all(
    leads.slice(0, 20).map((lead, index) =>
      prisma.activity.create({
        data: {
          tenantId: tenant.id,
          leadId: lead.id,
          userId: owners[index % owners.length].id,
          type: index % 2 === 0 ? 'whatsapp' : 'note_added',
          description: `Demo activity ${index + 1}`,
          metadata: { seed: true } as Prisma.InputJsonValue,
        },
      }),
    ),
  );

  const funnelA = await prisma.funnel.create({
    data: {
      tenantId: tenant.id,
      ownerId: operator.id,
      title: 'Demo Funnel A',
      slug: 'demo-funnel-a',
      status: 'published',
      publishedAt: new Date(),
      views: 150,
      conversions: 24,
      config: {
        sections: [{ type: 'hero', headline: 'Demo' }, { type: 'form', fields: ['name'] }],
      } as Prisma.InputJsonValue,
    },
  });

  const funnelB = await prisma.funnel.create({
    data: {
      tenantId: tenant.id,
      ownerId: leader.id,
      title: 'Demo Funnel B',
      slug: 'demo-funnel-b',
      status: 'published',
      publishedAt: new Date(),
      views: 120,
      conversions: 18,
      config: {
        sections: [{ type: 'hero', headline: 'Demo B' }, { type: 'form', fields: ['phone'] }],
      } as Prisma.InputJsonValue,
    },
  });

  await Promise.all(
    Array.from({ length: 10 }).map((_, index) =>
      prisma.aIUsageLog.create({
        data: {
          tenantId: tenant.id,
          userId: owners[index % owners.length].id,
          provider: index % 2 === 0 ? 'anthropic' : 'openai',
          model: 'demo-model',
          category: 'content',
          feature: 'content_generator',
          tokensIn: 100,
          tokensOut: 250,
          durationMs: 1500,
          costUsd: '0.050000',
        },
      }),
    ),
  );

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    return date;
  });

  await Promise.all(
    days.flatMap((date, index) =>
      members.map((member) =>
        prisma.dailyAction.create({
          data: {
            tenantId: tenant.id,
            userId: member.id,
            date,
            type: index % 2 === 0 ? 'content.education_post' : 'crm.follow_up',
            description: `Daily action ${index + 1}`,
            completed: index % 3 !== 0,
            completedAt: index % 3 !== 0 ? new Date() : null,
          },
        }),
      ),
    ),
  );

  await Promise.all(
    members.flatMap((member) =>
      ['m1', 'm2', 'm3'].map((moduleId, index) =>
        prisma.trainingProgress.create({
          data: {
            tenantId: tenant.id,
            userId: member.id,
            moduleId,
            moduleName: ['Welcome', 'CRM Basics', 'AI Content'][index],
            status: index === 0 ? 'completed' : 'in_progress',
            completedAt: index === 0 ? new Date() : null,
          },
        }),
      ),
    ),
  );

  await prisma.voiceProfile.create({
    data: {
      tenantId: tenant.id,
      userId: operator.id,
      audioUrl: 'https://example.test/demo-voice.webm',
      transcript: 'Demo voice transcript',
      extractedData: {
        summary: 'Demo voice profile',
        language: 'zh',
      } as Prisma.InputJsonValue,
      status: 'approved',
    },
  });

  console.log(`Seeded demo tenant "${tenant.name}" with ${owners.length} users, ${leads.length} leads, ${funnelA.id}, ${funnelB.id}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
