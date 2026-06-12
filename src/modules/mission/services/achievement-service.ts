import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';

interface AchievementContext {
  contentCount: number;
  daysSinceStart: number;
}

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  check: (completedChecks: string[], context: AchievementContext) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'brand_built',
    title: '品牌建立者',
    description: '完成了你的 Brand DNA',
    icon: 'target',
    xp: 50,
    check: (checks) => checks.includes('brand_dna_confirmed'),
  },
  {
    key: 'social_ready',
    title: '社交媒体上线',
    description: '完成 FB 和 IG 账号设置',
    icon: 'smartphone',
    xp: 40,
    check: (checks) => checks.includes('fb_page_completed') && checks.includes('ig_account_completed'),
  },
  {
    key: 'first_publish',
    title: '初次亮相',
    description: '发布了你的第一篇内容',
    icon: 'clapperboard',
    xp: 40,
    check: (checks) => checks.includes('content_published'),
  },
  {
    key: 'funnel_live',
    title: '漏斗上线',
    description: '发布了你的第一个完整漏斗',
    icon: 'rocket',
    xp: 50,
    check: (checks) => checks.includes('funnel_published'),
  },
  {
    key: 'first_sale',
    title: '首次成交',
    description: '完成了第一笔成交！',
    icon: 'badge-dollar-sign',
    xp: 100,
    check: (checks) => checks.includes('first_sale_completed'),
  },
  {
    key: 'fast_starter',
    title: '快速起步者',
    description: '在 3 天内完成品牌建立阶段',
    icon: 'zap',
    xp: 30,
    check: (checks, context) => checks.includes('positioning_completed') && context.daysSinceStart <= 3,
  },
  {
    key: 'content_creator_10',
    title: '内容创作者',
    description: '生成了 10 篇内容',
    icon: 'pen-line',
    xp: 30,
    check: (_checks, context) => context.contentCount >= 10,
  },
  {
    key: 'graduate',
    title: '系统毕业',
    description: '完成了完整的 19 步系统！',
    icon: 'graduation-cap',
    xp: 100,
    check: (checks) => checks.includes('growth_mode_active'),
  },
];

export async function checkAndUnlockAchievements(
  user: AuthUser,
  completedChecks: string[],
): Promise<string[]> {
  const existing = await prisma.achievement.findMany({
    where: { tenantId: user.tenantId, userId: user.id },
    select: { key: true },
  });
  const existingKeys = new Set(existing.map((achievement) => achievement.key));

  const progress = await prisma.userProgress.findUnique({
    where: { userId: user.id },
    select: { createdAt: true },
  });
  const daysSinceStart = progress
    ? Math.floor((Date.now() - progress.createdAt.getTime()) / 86_400_000)
    : 0;

  const contentCount = await prisma.content.count({
    where: { tenantId: user.tenantId, ownerId: user.id },
  });

  const context = { contentCount, daysSinceStart };
  const newlyUnlocked: string[] = [];

  for (const def of ACHIEVEMENTS) {
    if (existingKeys.has(def.key)) continue;
    if (!def.check(completedChecks, context)) continue;

    await prisma.achievement.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        type: 'milestone',
        key: def.key,
        title: def.title,
        description: def.description,
        icon: def.icon,
        xpAwarded: def.xp,
      },
    });
    newlyUnlocked.push(def.key);
  }

  return newlyUnlocked;
}

export async function getUserAchievements(user: AuthUser) {
  return prisma.achievement.findMany({
    where: { tenantId: user.tenantId, userId: user.id },
    orderBy: { unlockedAt: 'desc' },
  });
}

export function getAllAchievementDefs() {
  return ACHIEVEMENTS.map(({ key, title, description, icon, xp }) => ({
    key,
    title,
    description,
    icon,
    xp,
  }));
}
