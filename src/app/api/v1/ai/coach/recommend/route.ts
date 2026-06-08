import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Recommendation = {
  type: 'followup' | 'add_lead' | 'create_content' | 'daily_actions' | 'publish_funnel';
  goal: string;
  reason: string;
  estimatedMinutes: number;
  actionLabel: string;
  actionHref: string;
  urgency: 'high' | 'medium' | 'low';
};

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [overdueFollowups, leadsThisWeek, contentThisWeek, todayActions, publishedFunnels] =
    await Promise.all([
      prisma.lead.count({
        where: {
          tenantId: user.tenantId,
          ownerId: user.id,
          deletedAt: null,
          nextFollowup: { lt: today },
        },
      }),
      prisma.lead.count({
        where: {
          tenantId: user.tenantId,
          ownerId: user.id,
          deletedAt: null,
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.content.count({
        where: {
          tenantId: user.tenantId,
          ownerId: user.id,
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.dailyAction.findMany({
        where: { tenantId: user.tenantId, userId: user.id, date: today },
        select: { completed: true },
      }),
      prisma.funnel.count({
        where: { tenantId: user.tenantId, ownerId: user.id, status: 'published' },
      }),
    ]);

  const completedActions = todayActions.filter((a) => a.completed).length;
  const totalActions = todayActions.length;

  let recommendation: Recommendation;

  if (overdueFollowups > 0) {
    recommendation = {
      type: 'followup',
      goal: `联系 ${overdueFollowups} 位逾期客户`,
      reason: `${overdueFollowups} 位客户已超过跟进日期，越快联系转化率越高。`,
      estimatedMinutes: Math.min(overdueFollowups * 5, 30),
      actionLabel: '开始跟进',
      actionHref: '/crm?filter=overdue',
      urgency: 'high',
    };
  } else if (totalActions > 0 && completedActions < totalActions) {
    const remaining = totalActions - completedActions;
    recommendation = {
      type: 'daily_actions',
      goal: `完成今日 ${remaining} 项行动计划`,
      reason: `今天还有 ${remaining} 项任务未完成，坚持每日行动是成长的关键。`,
      estimatedMinutes: remaining * 3,
      actionLabel: '查看任务',
      actionHref: '/member/daily-actions',
      urgency: 'medium',
    };
  } else if (leadsThisWeek === 0) {
    recommendation = {
      type: 'add_lead',
      goal: '今天添加 2 位新客户',
      reason: '本周还没有新增客户，现在是最好的时机。',
      estimatedMinutes: 10,
      actionLabel: '添加客户',
      actionHref: '/crm',
      urgency: 'medium',
    };
  } else if (contentThisWeek === 0) {
    recommendation = {
      type: 'create_content',
      goal: '创建本周第一条内容',
      reason: '内容是建立信任的最快方式，AI 可以帮你 5 分钟完成。',
      estimatedMinutes: 15,
      actionLabel: '生成内容',
      actionHref: '/ai',
      urgency: 'medium',
    };
  } else if (publishedFunnels === 0) {
    recommendation = {
      type: 'publish_funnel',
      goal: '发布你的第一个漏斗页',
      reason: '漏斗页可以 24 小时自动收集潜在客户，不需要你主动出击。',
      estimatedMinutes: 20,
      actionLabel: '创建漏斗',
      actionHref: '/funnel',
      urgency: 'low',
    };
  } else {
    recommendation = {
      type: 'add_lead',
      goal: `继续添加新客户`,
      reason: `保持每天添加新联系人的习惯，本周已添加 ${leadsThisWeek} 位。`,
      estimatedMinutes: 10,
      actionLabel: '添加客户',
      actionHref: '/crm',
      urgency: 'low',
    };
  }

  return NextResponse.json({
    data: {
      ...recommendation,
      context: {
        overdueFollowups,
        leadsThisWeek,
        contentThisWeek,
        actionsCompleted: completedActions,
        actionsTotal: totalActions,
        publishedFunnels,
      },
    },
  });
});
