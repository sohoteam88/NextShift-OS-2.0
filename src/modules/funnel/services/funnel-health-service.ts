// ─── Canonical Funnel Health Engine ──────────────────────────────────────────
// Phase 2b+2c: Consolidated health + next-action engines from 3 sources each.
//
// Methods:
//   Health:
//     calculate(funnelId, user)       → FunnelHealthScore   (canonical — DB-backed)
//     evaluatePackage(pkg)            → FunnelHealth         (adapter — ex funnel-builder)
//     evaluateActivity(counts...)     → FunnelHealth         (adapter — ex funnel-os)
//   Next-action:
//     getNextBestAction(scores)       → {action, reason, route}   (canonical)
//     getPackageAdvisor(health)       → string[] + string          (adapter — ex funnelAdvisor)
//     getActivityNextAction(type,...) → {action, expectedImpact, route}  (adapter — ex funnelNextActionEngine)
//
// Deprecated:
//   @/modules/funnel-builder/funnelHealthValidator → funnelHealthService.evaluatePackage
//   @/modules/funnel-builder/funnelAdvisor         → funnelHealthService.getPackageAdvisor
//   @/modules/funnel/services/funnel-os-health        → funnelHealthService.evaluateActivity
//   @/modules/funnel/services/funnel-next-action     → funnelHealthService.getActivityNextAction
// ──────────────────────────────────────────────────────────────────────────────

import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { FunnelPackage, FunnelHealth as BuilderFunnelHealth } from '@/modules/funnel/types/funnel-builder';
import type { FunnelHealth as OsFunnelHealth, FunnelNextAction } from '@/modules/funnel/types/funnel-os';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';

// ─── Canonical types ─────────────────────────────────────────────────────────

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

// ─── Service ─────────────────────────────────────────────────────────────────

export const funnelHealthService = {
  // ── Canonical: DB-backed health score for a published funnel ─────────────

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

  // ── Adapter: Package structure health (ex funnel-builder/funnelHealthValidator) ──

  evaluatePackage(pkg: FunnelPackage): BuilderFunnelHealth {
    const m: string[] = []; const r: string[] = [];
    let audienceFit = pkg.landingPage.headline ? 80 : 20;
    let offerClarity = pkg.landingPage.benefits.length >= 3 ? 80 : 30;
    let pageClarity = pkg.thankYouPage.confirmation ? 75 : 10;
    let ctaStrength = pkg.landingPage.heroCta && pkg.thankYouPage.whatsappCta ? 80 : 20;
    let trustElements = pkg.landingPage.credibility ? 75 : 30;
    let followUpReadiness = pkg.emailSequence.length >= 5 ? 80 : 30;
    let trafficReadiness = pkg.adAngles.length >= 3 ? 75 : 20;
    if (!pkg.landingPage.heroCta) { m.push('heroCta'); r.push('先补上一个明确 CTA。'); }
    if (!pkg.whatsappFlow.prefilledMessage) { m.push('whatsapp'); r.push('你现在有流量入口，但没有跟进机制。'); }
    if (!pkg.thankYouPage.confirmation) { m.push('thankYou'); r.push('感谢页必须告诉用户下一步做什么。'); }
    if (pkg.adAngles.length < 3) { r.push('漏斗完成后，下一步是准备流量角度。'); }
    const score = Math.round(audienceFit*0.15+offerClarity*0.15+pageClarity*0.1+ctaStrength*0.2+trustElements*0.15+followUpReadiness*0.15+trafficReadiness*0.1);
    return { score, audienceFit, offerClarity, pageClarity, ctaStrength, trustElements, followUpReadiness, trafficReadiness, missingItems: m, recommendations: r.slice(0,3) };
  },

  // ── Adapter: Activity-based health (ex funnel-os/funnelHealthService) ─────

  async evaluateActivity(
    contentCount: number, videoCount: number,
    funnelExists: boolean, leadCount: number, customerCount: number,
  ): Promise<OsFunnelHealth> {
    const traffic = funnelExists ? (leadCount > 0 ? 75 : 40) : 10;
    const content = contentCount >= 10 ? 85 : contentCount >= 3 ? 55 : contentCount > 0 ? 30 : 0;
    const conversion = customerCount > 0 ? 80 : leadCount > 5 ? 50 : leadCount > 0 ? 25 : 0;
    const followUp = leadCount > 0 ? 60 : 10;
    const pipeline = leadCount > 0 ? 70 : 10;

    const overallScore = Math.round(traffic * 0.2 + content * 0.25 + conversion * 0.25 + followUp * 0.15 + pipeline * 0.15);

    return { traffic, content, conversion, followUp, pipeline, overallScore };
  },

  // ── Internal helpers ─────────────────────────────────────────────────────

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
    return { action: '准备启动流量 campaign', reason: '漏斗表现良好，可以开始投放', route: '/traffic-engine' };
  },

  // ── Adapter: Package advisor actions (ex funnel-builder/funnelAdvisor) ─────

  getPackageAdvisor(health: BuilderFunnelHealth): { recommendations: string[]; nextAction: string } {
    const recommendations = health.recommendations.length > 0
      ? health.recommendations
      : ['漏斗健康度良好，可以准备启动流量了。'];

    let nextAction: string;
    if (health.ctaStrength < 50) nextAction = '检查着陆页和感谢页的 CTA 按钮是否清晰。';
    else if (health.followUpReadiness < 50) nextAction = '完善 WhatsApp 跟进流程和邮件序列。';
    else if (health.trafficReadiness < 50) nextAction = '准备至少 3 个广告角度，覆盖不同平台。';
    else if (health.trustElements < 50) nextAction = '加入更多可信度元素：案例、数据、客户评价。';
    else nextAction = '漏斗已就绪，可以开始软启动。';

    return { recommendations, nextAction };
  },

  // ── Adapter: Activity-based next action (ex funnel-os/funnelNextActionEngine)

  getActivityNextAction(
    funnelType: BusinessFunnelType,
    contentCount: number, videoCount: number,
    funnelExists: boolean, leadCount: number, customerCount: number,
  ): FunnelNextAction {
    if (contentCount === 0) return { action: 'Publish First Content', expectedImpact: 'Start building audience', route: '/content-engine' };
    if (videoCount === 0) return { action: 'Generate First Video', expectedImpact: '+5 Leads', route: '/video-production' };
    if (!funnelExists) return { action: 'Build Lead Magnet + Funnel', expectedImpact: 'Enable conversion', route: '/lead-magnet' };
    if (leadCount === 0) return { action: 'Launch Traffic / Start Posting', expectedImpact: 'Generate first leads', route: '/traffic-engine' };
    if (customerCount === 0) return { action: 'Follow Up Hot Leads', expectedImpact: '+1 Customer', route: '/whatsapp-ai' };

    if (funnelType === 'recruitment') return { action: 'Invite Leads To Webinar', expectedImpact: '+2 Calls', route: '/webinar-center' };
    if (funnelType === 'upgrade') return { action: 'Invite Customer To Opportunity Webinar', expectedImpact: '+1 Member', route: '/webinar-center' };
    return { action: 'Generate Video Content', expectedImpact: '+5 Leads', route: '/video-production' };
  },
};
