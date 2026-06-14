// Funnel Context Provider — inherits from Brand DNA + overrides per funnel type
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import prisma from '@/lib/prisma';
import type { BusinessFunnelType, FunnelContext, FunnelContextMap } from '../types/funnel-context';

const DEFAULT_CONTEXTS: Record<BusinessFunnelType, Omit<FunnelContext, 'brandDNA'>> = {
  retail: {
    funnelType: 'retail', audience: '注重健康的人士',
    painPoints: ['体重管理', '精力不足', '营养知识缺乏'], goals: ['改善健康', '减重', '养成好习惯'],
    positioning: '健康生活顾问 | AI辅助健康管理', offer: '免费健康评估',
    contentPillars: [{ name: '健康知识', emoji: '🥗', percentage: 40, description: '分享科学健康知识' }, { name: '客户见证', emoji: '⭐', percentage: 30, description: '真实案例和转变' }, { name: '产品分享', emoji: '🛍', percentage: 20, description: '推荐健康产品' }, { name: '生活方式', emoji: '🌿', percentage: 10, description: '日常健康习惯' }],
    cta: '获取免费健康评估', webinarTheme: '如何用AI系统改善健康管理', leadMagnetTheme: '3分钟健康准备度评估',
    videoTheme: '健康知识短视频', salesApproach: '先评估→推荐方案→跟进→成交',
  },
  recruitment: {
    funnelType: 'recruitment', audience: '想增加收入的在职人士',
    painPoints: ['收入不足', '时间不够', '职业发展受限'], goals: ['增加收入', '灵活工作时间', '建立副业'],
    positioning: '副业机会推荐 | AI系统赋能', offer: '免费副业准备度评估',
    contentPillars: [{ name: '副业机会', emoji: '💼', percentage: 35, description: '分享副业思路和机会' }, { name: '成功案例', emoji: '🏆', percentage: 30, description: '真实收入分享' }, { name: '技能培训', emoji: '📚', percentage: 20, description: 'AI系统培训' }, { name: '团队文化', emoji: '🤝', percentage: 15, description: '团队氛围和活动' }],
    cta: '获取副业准备度评估', webinarTheme: '如何在30天内建立AI副业系统', leadMagnetTheme: '副业适合度测试',
    videoTheme: '副业机会和成功案例', salesApproach: '了解需求→分享机会→邀请Webinar→加入团队',
  },
  upgrade: {
    funnelType: 'upgrade', audience: '现有客户',
    painPoints: ['需要更大成长', '想要社群支持', '寻找人生意义'], goals: ['升级服务', '加入社群', '成为导师'],
    positioning: '会员升级机会 | 从客户到合作伙伴', offer: '加入NextShift会员社群',
    contentPillars: [{ name: '成长故事', emoji: '📖', percentage: 30, description: '会员的真实成长经历' }, { name: '社群价值', emoji: '💎', percentage: 25, description: '社群带来的改变' }, { name: '进阶机会', emoji: '🚀', percentage: 25, description: '升级后的新机会' }, { name: '专属福利', emoji: '🎁', percentage: 20, description: '会员专属内容' }],
    cta: '加入NextShift会员', webinarTheme: '会员升级：如何从客户变成合作伙伴', leadMagnetTheme: '会员就绪度评估',
    videoTheme: '会员故事和社群价值', salesApproach: '了解满意度→分享升级价值→邀请加入→长期陪伴',
  },
};

/**
 * Get a funnel context merged with the user's Brand DNA.
 * Funnel-specific fields override brand defaults where applicable.
 */
export async function getFunnelContext(userId: string, funnelType: BusinessFunnelType): Promise<FunnelContext | null> {
  const brandDNA = await getBrandContext(userId);
  if (!brandDNA) return null;

  // Check for custom funnel context in user metadata
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const meta = (user?.metadata as Record<string, unknown>) ?? {};
  const customContexts = meta.funnel_contexts as Record<string, FunnelContext> | undefined;
  const custom = customContexts?.[funnelType];

  const defaults = DEFAULT_CONTEXTS[funnelType];
  const ctx: FunnelContext = {
    ...defaults,
    ...(custom ?? {}),
    // Merged: use funnel-specific audience if available, otherwise brand audience
    audience: custom?.audience || defaults.audience,
    // Merged positioning: brand positioning + funnel angle
    positioning: brandDNA.positioning || defaults.positioning,
    brandDNA,
  };

  return ctx;
}

export async function getAllFunnelContexts(userId: string): Promise<FunnelContextMap> {
  const [retail, recruitment, upgrade] = await Promise.all([
    getFunnelContext(userId, 'retail'),
    getFunnelContext(userId, 'recruitment'),
    getFunnelContext(userId, 'upgrade'),
  ]);
  return { retail, recruitment, upgrade };
}
