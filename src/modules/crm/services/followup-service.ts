import { type Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { type AuthUser } from '@/modules/auth/services/auth-service';
import { logActivity } from './activity-service';

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function upcomingBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function buildOwnerFilter(user: AuthUser): Promise<Prisma.LeadWhereInput> {
  if (user.role === 'member') return { ownerId: user.id };
  if (user.role === 'leader') {
    const downline = await prisma.user.findMany({
      where: { tenantId: user.tenantId, sponsorId: user.id },
      select: { id: true },
    });
    return { ownerId: { in: [user.id, ...downline.map((u) => u.id)] } };
  }
  return {};
}

const leadInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.LeadInclude;

export const followupService = {
  async setFollowup(user: AuthUser, leadId: string, date: Date | null) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId },
    });
    if (!lead) return null;

    await prisma.lead.update({
      where: { id: leadId },
      data: { nextFollowup: date },
    });

    const description = date
      ? `跟进日期设为 ${date.toLocaleDateString('zh-CN')}`
      : '跟进日期已清除';

    await logActivity({
      tenantId: user.tenantId,
      leadId,
      userId: user.id,
      type: date ? 'followup_set' : 'followup_cleared',
      description,
    });

    return date;
  },

  async getTodayFollowups(user: AuthUser) {
    const base: Prisma.LeadWhereInput = {
      tenantId: user.tenantId,
      deletedAt: null,
      nextFollowup: { not: null },
    };
    const ownerFilter = await buildOwnerFilter(user);
    const where: Prisma.LeadWhereInput = { ...base, ...ownerFilter };

    const { start: todayStart, end: todayEnd } = todayBounds();
    const { start: tomorrowStart, end: tomorrowEnd } = upcomingBounds();

    const [overdue, today, upcoming] = await Promise.all([
      prisma.lead.findMany({
        where: { ...where, nextFollowup: { lt: todayStart } },
        orderBy: { nextFollowup: 'asc' },
        include: leadInclude,
      }),
      prisma.lead.findMany({
        where: { ...where, nextFollowup: { gte: todayStart, lte: todayEnd } },
        orderBy: { nextFollowup: 'asc' },
        include: leadInclude,
      }),
      prisma.lead.findMany({
        where: { ...where, nextFollowup: { gte: tomorrowStart, lte: tomorrowEnd } },
        orderBy: { nextFollowup: 'asc' },
        include: leadInclude,
      }),
    ]);

    return { overdue, today, upcoming };
  },

  async getFollowupCounts(user: AuthUser) {
    const base: Prisma.LeadWhereInput = {
      tenantId: user.tenantId,
      deletedAt: null,
      nextFollowup: { not: null },
    };
    const ownerFilter = await buildOwnerFilter(user);
    const where: Prisma.LeadWhereInput = { ...base, ...ownerFilter };

    const { start: todayStart, end: todayEnd } = todayBounds();
    const { start: tomorrowStart, end: tomorrowEnd } = upcomingBounds();

    const [overdue, today, upcoming] = await Promise.all([
      prisma.lead.count({ where: { ...where, nextFollowup: { lt: todayStart } } }),
      prisma.lead.count({ where: { ...where, nextFollowup: { gte: todayStart, lte: todayEnd } } }),
      prisma.lead.count({ where: { ...where, nextFollowup: { gte: tomorrowStart, lte: tomorrowEnd } } }),
    ]);

    return { overdue, today, upcoming };
  },
};
