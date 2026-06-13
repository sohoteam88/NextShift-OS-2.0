import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';

export interface FunnelHealthScore {
  overall: number;
  breakdown: {
    completeness: number;
    real_material_used: number;
    diversity: number;
    cta_consistency: number;
    performance: number | null;
  };
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  next_best_action: {
    action: string;
    reason: string;
    route: string;
  };
}

export const funnelHealthService = {
  async calculate(funnelId: string, user: AuthUser): Promise<FunnelHealthScore> {
    const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, tenantId: user.tenantId } });
    const config = funnel?.config as Record<string, unknown> | undefined;

    const completeness = this.scoreCompleteness(config);
    const realMaterialUsed = this.hasRealMaterial(config) ? 100 : 30;
    const diversity = Number((config?.quality_gate_results as { pass_rate?: number } | undefined)?.pass_rate ?? 50);
    const ctaConsistency = this.scoreCTAConsistency(config);
    const performance = funnel?.status === 'published' && funnel.views > 20
      ? Math.min(100, Math.round((funnel.conversions / funnel.views) * 100 * 10))
      : null;

    const scores = [completeness, realMaterialUsed, diversity, ctaConsistency, performance].filter((s) => s !== null) as number[];
    const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const status = overall >= 80 ? 'excellent' : overall >= 60 ? 'good' : overall >= 40 ? 'needs_attention' : 'critical';

    return {
      overall,
      breakdown: { completeness, real_material_used: realMaterialUsed, diversity, cta_consistency: ctaConsistency, performance },
      status,
      next_best_action: this.getNextBestAction({ completeness, realMaterialUsed, diversity, ctaConsistency, performance }),
    };
  },

  hasRealMaterial(config: Record<string, unknown> | undefined): boolean {
    const context = config?.strategy_context as { real_material?: { case_studies?: unknown[] } } | undefined;
    return (context?.real_material?.case_studies?.length ?? 0) > 0;
  },

  scoreCompleteness(config: Record<string, unknown> | undefined): number {
    const sections = (config?.sections as Array<{ type?: string }> | undefined) ?? [];
    const required = ['hero', 'pain', 'benefits', 'cta'];
    const present = required.filter((type) => sections.some((section) => section.type === type)).length;
    return Math.round((present / required.length) * 100);
  },

  scoreCTAConsistency(config: Record<string, unknown> | undefined): number {
    const sections = (config?.sections as Array<{ cta_target?: string; button_target?: string }> | undefined) ?? [];
    const ctaTargets = sections.map((s) => s.cta_target ?? s.button_target).filter(Boolean);
    if (ctaTargets.length === 0) return 100;
    const uniqueTargets = new Set(ctaTargets);
    return uniqueTargets.size === 1 ? 100 : Math.round(100 / uniqueTargets.size);
  },

  getNextBestAction(scores: {
    completeness: number;
    realMaterialUsed: number;
    diversity: number;
    ctaConsistency: number;
    performance: number | null;
  }): FunnelHealthScore['next_best_action'] {
    if (scores.realMaterialUsed < 50) return { action: '添加真实学员案例', reason: '没有真实案例，内容会显得空泛', route: '/ai/funnel-builder' };
    if (scores.diversity < 80) return { action: '重新生成重复文案', reason: '部分 hooks、异议或跟进信息太相似', route: '/ai/funnel-builder' };
    if (scores.completeness < 100) return { action: '补充缺失的页面区块', reason: '落地页缺少关键转化区块', route: '/funnel' };
    if (scores.ctaConsistency < 100) return { action: '统一所有 CTA 的目标', reason: '不同区块的按钮指向不同地方，会让用户困惑', route: '/funnel' };
    if (scores.performance === null) return { action: '发布漏斗并开始获取流量', reason: '还没有数据，发布后才能优化', route: '/funnel' };
    if (scores.performance < 50) return { action: '优化 Hero 标题和 CTA 文案', reason: '转化率偏低，建议先测试不同的标题角度', route: '/funnel' };
    return { action: '准备启动流量 campaign', reason: '漏斗表现良好，可以开始投放', route: '/traffic' };
  },
};
