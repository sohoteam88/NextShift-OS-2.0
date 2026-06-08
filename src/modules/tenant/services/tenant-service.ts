import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { seedDefaultTemplates } from '@/modules/ai/seed/default-templates';
import { seedFunnelTemplates } from '@/modules/funnel/seed/default-templates';
import { PLAN_TIERS, type PlanTier } from '@/modules/tenant/constants/plans';

type CreateTenantInput = {
  name: string;
  slug: string;
  plan: PlanTier;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
};

function normalizeSettings(settings: unknown): Prisma.JsonObject {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? ({ ...(settings as Prisma.JsonObject) } as Prisma.JsonObject)
    : {};
}

function defaultTrainingModules() {
  return [
    {
      id: 'mod-1',
      name: '认识你的产品',
      description: '了解产品特点、使用方法和目标客群',
      order: 1,
    },
    {
      id: 'mod-2',
      name: '建立个人品牌',
      description: '定位你的专业形象和社交媒体策略',
      order: 2,
    },
    {
      id: 'mod-3',
      name: '内容创作基础',
      description: '学习如何创建教育性内容吸引目标客户',
      order: 3,
    },
    {
      id: 'mod-4',
      name: 'WhatsApp 销售技巧',
      description: '掌握通过 WhatsApp 跟进和成交的方法',
      order: 4,
    },
    {
      id: 'mod-5',
      name: '客户服务和留存',
      description: '如何提供优质服务让客户持续购买和推荐',
      order: 5,
    },
  ];
}

function defaultDailyActions() {
  return [
    { type: 'learn.ai_coach', description: '查看 AI 教练任务' },
    { type: 'content.education_post', description: '发布 1 条教育内容' },
    { type: 'crm.follow_up', description: '跟进 2 位潜在客户' },
    { type: 'crm.whatsapp_reply', description: '回复所有 WhatsApp 消息' },
    { type: 'learn.reflection', description: '记录今天的学习心得' },
  ];
}

function defaultPipelineStages() {
  return ['新线索', '已联系', '已确认需求', '已预约', '已转化', '已流失'].map((name, index) => ({
    name,
    stageOrder: index,
  }));
}

async function applyTenantDefaults(tx: Prisma.TransactionClient, tenantId: string) {
  await tx.pipelineStage.createMany({
    data: defaultPipelineStages().map((stage) => ({
      tenantId,
      name: stage.name,
      stageOrder: stage.stageOrder,
    })),
    skipDuplicates: true,
  });
  await seedDefaultTemplates(tx, tenantId);
  await seedFunnelTemplates(tx, tenantId);
}

async function estimateStorageMb(client: typeof prisma, tenantId: string) {
  const [contents, funnels, promptTemplates, messages, voiceProfiles, events] = await Promise.all([
    client.content.findMany({
      where: { tenantId },
      select: { title: true, body: true, promptUsed: true, status: true },
    }),
    client.funnel.findMany({
      where: { tenantId },
      select: { title: true, config: true, status: true },
    }),
    client.aIPromptTemplate.findMany({
      where: { tenantId },
      select: { name: true, prompt: true, systemPrompt: true, userPromptTemplate: true },
    }),
    client.scheduledMessage.findMany({
      where: { tenantId },
      select: { message: true, status: true },
    }),
    client.voiceProfile.findMany({
      where: { tenantId },
      select: { transcript: true, extractedData: true, status: true },
    }),
    client.analyticsEvent.findMany({
      where: { tenantId },
      select: { eventName: true, properties: true },
    }),
  ]);

  const byteSize = (value: unknown) => Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');

  const totalBytes =
    contents.reduce((sum, row) => sum + byteSize(row), 0) +
    funnels.reduce((sum, row) => sum + byteSize(row), 0) +
    promptTemplates.reduce((sum, row) => sum + byteSize(row), 0) +
    messages.reduce((sum, row) => sum + byteSize(row), 0) +
    voiceProfiles.reduce((sum, row) => sum + byteSize(row), 0) +
    events.reduce((sum, row) => sum + byteSize(row), 0);

  return Math.round((totalBytes / 1_048_576) * 10) / 10;
}

export const tenantService = {
  async create(input: CreateTenantInput) {
    const planConfig = PLAN_TIERS[input.plan];
    const tenantSettings = {
      default_language: 'zh',
      ai_monthly_quota: planConfig.max_ai_calls,
      max_ai_calls: planConfig.max_ai_calls,
      member_limit: planConfig.max_members,
      max_members: planConfig.max_members,
      storage_limit_mb: planConfig.max_storage_mb,
      max_storage_mb: planConfig.max_storage_mb,
      branding: {
        primary_color: '#2563eb',
      },
      logo_url: null,
      training_modules: defaultTrainingModules(),
      default_daily_actions: defaultDailyActions(),
      plan: input.plan,
      custom_branding: planConfig.custom_branding,
    };

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          plan: input.plan,
          maxMembers: planConfig.max_members,
          maxAiCalls: planConfig.max_ai_calls,
          settings: tenantSettings as Prisma.InputJsonValue,
        },
      });

      const user = await tx.user.create({
        data: {
          id: input.ownerId,
          tenantId: tenant.id,
          email: input.ownerEmail,
          name: input.ownerName,
          role: 'operator',
          status: 'active',
        },
      });

      await applyTenantDefaults(tx, tenant.id);

      return { tenant, user };
    });
  },

  async update(
    tenantId: string,
    data: {
      name?: string;
      slug?: string;
      settings?: Prisma.InputJsonValue;
      maxMembers?: number;
      maxAiCalls?: number;
      status?: string;
    },
  ) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  },

  async upgradePlan(tenantId: string, newPlan: PlanTier) {
    const planConfig = PLAN_TIERS[newPlan];
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const settings = normalizeSettings(tenant?.settings);

    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: newPlan,
        maxMembers: planConfig.max_members,
        maxAiCalls: planConfig.max_ai_calls,
        settings: {
          ...settings,
          member_limit: planConfig.max_members,
          max_members: planConfig.max_members,
          ai_monthly_quota: planConfig.max_ai_calls,
          max_ai_calls: planConfig.max_ai_calls,
          storage_limit_mb: planConfig.max_storage_mb,
          max_storage_mb: planConfig.max_storage_mb,
          custom_branding: planConfig.custom_branding,
          plan: newPlan,
        } as Prisma.InputJsonValue,
      },
    });
  },

  async suspend(tenantId: string) {
    await prisma.user.updateMany({
      where: { tenantId, deletedAt: null },
      data: { status: 'suspended' },
    });

    return prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'suspended' },
    });
  },

  async getUsage(tenantId: string) {
    const [tenant, activeMembers, aiCallsThisMonth, storageUsedMb, funnelCount, sequenceCount] =
      await Promise.all([
        prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { plan: true, maxMembers: true, maxAiCalls: true, settings: true },
        }),
        prisma.user.count({
          where: { tenantId, deletedAt: null, status: 'active' },
        }),
        prisma.aIUsageLog.count({
          where: {
            tenantId,
            createdAt: { gte: getStartOfMonth() },
          },
        }),
        estimateStorageMb(prisma, tenantId),
        prisma.funnel.count({ where: { tenantId } }),
        prisma.whatsAppSequence.count({ where: { tenantId } }),
      ]);

    const plan = PLAN_TIERS[(tenant?.plan as PlanTier) ?? 'starter'] ?? PLAN_TIERS.starter;
    const settings = normalizeSettings(tenant?.settings);
    const storageLimitMb =
      typeof settings.max_storage_mb === 'number'
        ? settings.max_storage_mb
        : typeof settings.storage_limit_mb === 'number'
          ? settings.storage_limit_mb
          : plan.max_storage_mb;

    return {
      members: { used: activeMembers, limit: tenant?.maxMembers ?? plan.max_members },
      ai_calls: { used: aiCallsThisMonth, limit: tenant?.maxAiCalls ?? plan.max_ai_calls },
      storage_mb: { used: storageUsedMb, limit: storageLimitMb },
      funnels: { used: funnelCount, limit: plan.max_funnels },
      sequences: { used: sequenceCount, limit: plan.max_whatsapp_sequences },
    };
  },
};

function getStartOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}
