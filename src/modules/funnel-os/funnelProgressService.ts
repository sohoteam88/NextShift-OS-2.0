// Funnel Progress Service — calculates progress per funnel type
import prisma from '@/lib/prisma';
import type { FunnelType } from '@/modules/funnel-context/types';
import type { FunnelProgress } from './types';

const FUNNEL_STAGES: Record<FunnelType, string[]> = {
  retail: ['brand_setup', 'content', 'video', 'lead_magnet', 'funnel', 'lead', 'customer'],
  recruitment: ['brand_setup', 'content', 'video', 'lead_magnet', 'webinar', 'lead', 'member'],
  upgrade: ['customer', 'community', 'webinar', 'member', 'builder'],
};

function scoreFromStages(stages: string[], completed: Set<string>) {
  const completedCount = stages.filter((stage) => completed.has(stage)).length;
  const progress = Math.round((completedCount / stages.length) * 100);
  const currentStage = stages[Math.max(0, completedCount - 1)] ?? stages[0];
  const nextStage = stages[completedCount] ?? stages[stages.length - 1];
  return { progress, currentStage, nextStage };
}

export const funnelProgressService = {
  async getProgress(userId: string, tenantId: string, funnelType: FunnelType): Promise<FunnelProgress> {
    const [contentCount, videoCount, leadCount, customerCount] = await Promise.all([
      prisma.content.count({ where: { ownerId: userId } }),
      prisma.videoProject.count({ where: { userId } }),
      prisma.lead.count({ where: { tenantId, deletedAt: null } }),
      prisma.customer.count({ where: { tenantId } }),
    ]);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};

    const completed = new Set<string>();

    if (contentCount > 0) completed.add('content');
    if (videoCount > 0) completed.add('video');
    if (!!meta.lead_magnet) completed.add('lead_magnet');
    if (!!meta.funnel_builder) completed.add('funnel');
    if (!!meta.webinar || !!meta.funnel_builder) completed.add('webinar');
    if (leadCount > 0) completed.add('lead');
    if (customerCount > 0) {
      completed.add('customer');
      completed.add('member');
      completed.add('community');
    }
    if (customerCount > 1) completed.add('builder');
    completed.add('brand_setup');

    const { progress, currentStage, nextStage } = scoreFromStages(FUNNEL_STAGES[funnelType], completed);
    let bottleneck: string | null = null;
    let bottleneckFix: string | null = null;

    // Bottleneck detection
    if (contentCount === 0) { bottleneck = 'Content Missing'; bottleneckFix = '发布3篇内容'; }
    else if (videoCount === 0) { bottleneck = 'No Video Content'; bottleneckFix = '生成第一支视频'; }
    else if (!meta.lead_magnet && !meta.funnel_builder) { bottleneck = 'No Funnel'; bottleneckFix = '创建引流磁铁和漏斗'; }
    else if (funnelType !== 'retail' && !meta.webinar && !meta.funnel_builder) { bottleneck = 'No Webinar'; bottleneckFix = '建立讲座或机会说明页面'; }
    else if (leadCount === 0) { bottleneck = 'No Leads'; bottleneckFix = '激活流量获取'; }
    else if (customerCount === 0 && leadCount > 5) { bottleneck = 'Leads But No Follow-Up'; bottleneckFix = '使用WhatsApp AI跟进'; }
    else if (customerCount > 0 && funnelType === 'upgrade') { bottleneck = 'Customers Not Upgraded'; bottleneckFix = '邀请顾客参加机会讲座'; }

    return { funnelType, progress, currentStage, nextStage, bottleneck, bottleneckFix };
  },
};
