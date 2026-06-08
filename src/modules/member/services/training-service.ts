import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type {
  TrainingModule,
  TrainingModuleOverview,
  TrainingOverview,
  TrainingProgressItem,
  TrainingProgressStatus,
} from '../types';

type DatabaseClient = typeof prisma;

const DEFAULT_MODULES: TrainingModule[] = [
  { id: 'mod-1', name: '认识你的产品', description: '了解产品特点、使用方法和目标客群', order: 1 },
  { id: 'mod-2', name: '建立个人品牌', description: '定位你的专业形象和社交媒体策略', order: 2 },
  { id: 'mod-3', name: '内容创作基础', description: '学习如何创建教育性内容吸引目标客户', order: 3 },
  { id: 'mod-4', name: 'WhatsApp 销售技巧', description: '掌握通过 WhatsApp 跟进和成交的方法', order: 4 },
  { id: 'mod-5', name: '客户服务和留存', description: '如何提供优质服务让客户持续购买和推荐', order: 5 },
];

function normalizeSettings(settings: unknown): Prisma.JsonObject {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? ({ ...(settings as Prisma.JsonObject) } as Prisma.JsonObject)
    : {};
}

function normalizeModule(module: unknown): TrainingModule | null {
  if (!module || typeof module !== 'object') return null;
  const value = module as Record<string, unknown>;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  if (!id || !name || !description) return null;
  return {
    id,
    name,
    description,
    content_url: typeof value.content_url === 'string' ? value.content_url : null,
    order: typeof value.order === 'number' && Number.isFinite(value.order) ? value.order : 0,
  };
}

function mapProgress(status: string): TrainingProgressStatus {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  return 'not_started';
}

async function resolveModuleList(client: DatabaseClient, tenantId: string) {
  const tenant = await client.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const settings = normalizeSettings(tenant?.settings);
  const custom = Array.isArray(settings.training_modules)
    ? settings.training_modules.map(normalizeModule).filter(
        (item): item is TrainingModule => Boolean(item),
      )
    : [];

  return (custom.length > 0 ? custom : DEFAULT_MODULES)
    .slice()
    .sort((a, b) => a.order - b.order) as TrainingModule[];
}

async function resolveProgressRows(client: DatabaseClient, user: AuthUser) {
  return client.trainingProgress.findMany({
    where: { tenantId: user.tenantId, userId: user.id },
    orderBy: { createdAt: 'asc' },
  });
}

function buildOverview(modules: TrainingModule[], progressRows: Awaited<ReturnType<typeof resolveProgressRows>>): TrainingOverview {
  const progressMap = new Map(progressRows.map((row) => [row.moduleId, row]));
  const moduleOverview: TrainingModuleOverview[] = modules.map((module) => {
    const progress = progressMap.get(module.id);
    return {
      ...module,
      progress: progress
        ? {
            id: progress.id,
            moduleId: progress.moduleId,
            moduleName: progress.moduleName,
            status: mapProgress(progress.status),
            completedAt: progress.completedAt ? progress.completedAt.toISOString() : null,
          }
        : null,
    };
  });

  const completedCount = moduleOverview.filter((item) => item.progress?.status === 'completed').length;
  const inProgressCount = moduleOverview.filter((item) => item.progress?.status === 'in_progress').length;
  const totalCount = moduleOverview.length;

  return {
    modules: moduleOverview,
    totalCount,
    completedCount,
    inProgressCount,
    completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    nextModule:
      moduleOverview.find((item) => item.progress?.status !== 'completed') ?? null,
  };
}

async function upsertProgress(
  client: DatabaseClient,
  user: AuthUser,
  moduleId: string,
  status: TrainingProgressStatus,
) {
  const modules = await resolveModuleList(client, user.tenantId);
  const selectedModule = modules.find((item) => item.id === moduleId);
  if (!selectedModule) {
    throw new AppError('NOT_FOUND', 404, 'Training module not found');
  }

  return client.trainingProgress.upsert({
    where: {
      userId_moduleId: {
        userId: user.id,
        moduleId,
      },
    },
    update: {
      tenantId: user.tenantId,
      moduleName: selectedModule.name,
      status,
      completedAt: status === 'completed' ? new Date() : null,
    },
    create: {
      tenantId: user.tenantId,
      userId: user.id,
      moduleId,
      moduleName: selectedModule.name,
      status,
      completedAt: status === 'completed' ? new Date() : null,
    },
  });
}

export const trainingService = {
  async getModules(tenantId: string) {
    return resolveModuleList(prisma, tenantId);
  },

  async getOverview(user: AuthUser): Promise<TrainingOverview> {
    const [modules, progressRows] = await Promise.all([
      resolveModuleList(prisma, user.tenantId),
      resolveProgressRows(prisma, user),
    ]);
    return buildOverview(modules, progressRows);
  },

  async getProgress(user: AuthUser) {
    const progressRows = await resolveProgressRows(prisma, user);
    return progressRows.map<TrainingProgressItem>((row) => ({
      id: row.id,
      moduleId: row.moduleId,
      moduleName: row.moduleName,
      status: mapProgress(row.status),
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    }));
  },

  async startModule(user: AuthUser, moduleId: string) {
    return upsertProgress(prisma, user, moduleId, 'in_progress');
  },

  async completeModule(user: AuthUser, moduleId: string) {
    return upsertProgress(prisma, user, moduleId, 'completed');
  },

  async updateDefaultModules(tenantId: string, modules: Array<TrainingModule>) {
    const normalized = modules.map(normalizeModule).filter(Boolean) as TrainingModule[];
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = normalizeSettings(tenant?.settings);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          training_modules: normalized,
        } as Prisma.InputJsonValue,
      },
    });

    return normalized;
  },

  getDefaultModules() {
    return DEFAULT_MODULES;
  },
};
