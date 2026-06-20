// CEO Advisor Engine — the brain of NextShift OS. Consumes all modules, generates decisions.
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { BusinessHealth, Bottleneck, GrowthOpportunity, NextBestAction, BusinessForecast, BusinessRisk, CEOReport } from './types';

export const ceoAdvisorEngine = {
  async generateCEOReport(userId: string, tenantId: string): Promise<CEOReport> {
    const [
      ctx, contentCount, videoCount, leadCount, customerCount,
      funnelData, lmData, webinarData, waData, trafficData,
    ] = await Promise.all([
      getBrandContext(userId),
      prisma.content.count({ where: { ownerId: userId } }),
      prisma.videoProject.count({ where: { userId } }),
      prisma.lead.count({ where: { tenantId, deletedAt: null } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.funnel.count({ where: { tenantId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }),
    ]);

    const meta = (lmData?.metadata as Record<string, unknown>) ?? {};
    const hasLM = !!meta.lead_magnet;
    const hasWebinar = !!meta.webinar;
    const hasWA = !!meta.whatsapp_ai;
    const hasTraffic = !!meta.traffic_engine;
    const hasAutomation = Array.isArray(meta.automation_workflows) && (meta.automation_workflows as any[]).some((w: any) => w.enabled);

    // ---- Business Health ----
    const brandHealth = ctx ? 85 : 20;
    const contentHealth = contentCount >= 10 ? 85 : contentCount >= 3 ? 55 : contentCount > 0 ? 30 : 0;
    const videoHealth = videoCount >= 5 ? 80 : videoCount >= 1 ? 50 : 0;
    const leadGenHealth = leadCount > 0 ? (hasLM ? 80 : 60) : 10;
    const trafficHealth = hasTraffic ? 70 : 20;
    const funnelHealth = funnelData > 0 ? 75 : 10;
    const salesHealth = customerCount > 0 ? 85 : leadCount > 0 ? 40 : 5;
    const crmHealth = leadCount > 0 ? 75 : 20;
    const automationHealth = hasAutomation ? 80 : 10;

    const overallScore = Math.round(
      brandHealth*0.1 + contentHealth*0.15 + videoHealth*0.1 + leadGenHealth*0.15 +
      trafficHealth*0.1 + funnelHealth*0.15 + salesHealth*0.15 + crmHealth*0.05 + automationHealth*0.05
    );

    const health: BusinessHealth = {
      overallScore, level: overallScore>=80?'excellent':overallScore>=60?'good':overallScore>=30?'attention':'critical',
      brandHealth, contentHealth, videoHealth, leadGenHealth, trafficHealth, funnelHealth, salesHealth, crmHealth, automationHealth,
      recommendations: [
        brandHealth<50 ? '完善品牌资料' : '', contentHealth<50 ? '发布更多内容' : '',
        funnelHealth<50 ? '建立转化漏斗' : '', salesHealth<30 ? '推动第一笔成交' : '',
      ].filter(Boolean),
    };

    // ---- Bottlenecks ----
    const bottlenecks: Bottleneck[] = [];
    if (contentHealth < 40 && ctx) bottlenecks.push({ id: 'b1', category: 'content', description: '内容产出偏低，获客渠道受限', severity: leadCount===0?'critical':'high', impact: '缺少吸引潜在客户的内容', recommendation: '每周至少发布3篇内容' });
    if (funnelHealth < 30 && leadCount > 0) bottlenecks.push({ id: 'b2', category: 'funnel', description: '有潜在客户但没有漏斗转化', severity: 'critical', impact: '潜在客户进来后没有系统承接', recommendation: '尽快完成漏斗页面中心' });
    if (salesHealth < 30 && leadCount > 5) bottlenecks.push({ id: 'b3', category: 'sales', description: '跟进效率偏低', severity: 'high', impact: '大量潜在客户未转化成客户', recommendation: '启动客户跟进中心' });
    if (!hasAutomation && leadCount > 0) bottlenecks.push({ id: 'b4', category: 'automation', description: '没有自动化工作流', severity: 'medium', impact: '手动操作效率低', recommendation: '启用Assessment Follow-Up工作流' });

    // ---- Growth Opportunities ----
    const opportunities: GrowthOpportunity[] = [];
    if (contentCount < 10 && ctx) opportunities.push({ id: 'g1', opportunity: '增加内容产出', impactScore: 85, effortScore: 30, priorityScore: 85, explanation: '内容是一切获客的基础。AI可以帮你快速生成。', agentRecommended: 'content_director' });
    if (!hasLM && ctx) opportunities.push({ id: 'g2', opportunity: '创建引流资源', impactScore: 80, effortScore: 40, priorityScore: 80, explanation: '引流资源把观众变成联系人。', agentRecommended: 'funnel_architect' });
    if (leadCount > 10 && salesHealth < 50) opportunities.push({ id: 'g3', opportunity: '优化跟进转化', impactScore: 90, effortScore: 50, priorityScore: 90, explanation: '跟进转化率提升空间很大。', agentRecommended: 'sales_coach' });
    if (videoCount < 5 && contentCount >= 5) opportunities.push({ id: 'g4', opportunity: '开始视频内容', impactScore: 75, effortScore: 45, priorityScore: 75, explanation: '视频是增长最快的格式。', agentRecommended: 'video_producer' });

    // ---- Next Best Actions ----
    const actions: NextBestAction[] = [];
    if (opportunities.length > 0) {
      const top = [...opportunities].sort((a,b) => b.priorityScore - a.priorityScore);
      actions.push({ priority: 1, action: top[0].opportunity, expectedImpact: `预计带来显著增长`, agentRecommended: top[0].agentRecommended ?? 'brand_strategist', route: top[0].agentRecommended ? '/ai-workforce' : '/content-engine' });
      if (top.length > 1) actions.push({ priority: 2, action: top[1].opportunity, expectedImpact: '中期增长机会', agentRecommended: top[1].agentRecommended ?? 'content_director', route: '/ai-workforce' });
      if (top.length > 2) actions.push({ priority: 3, action: top[2].opportunity, expectedImpact: '长期增长基础', agentRecommended: top[2].agentRecommended ?? 'funnel_architect', route: '/ai-workforce' });
    } else {
      actions.push({ priority: 1, action: '继续完善品牌基础', expectedImpact: '为后续增长打基础', agentRecommended: 'brand_strategist', route: '/brand-builder/profile' });
    }

    // ---- Forecast ----
    const leadRate = contentCount > 0 ? leadCount / Math.max(contentCount, 1) : 0.5;
    const forecast: BusinessForecast = {
      period: '30 days',
      conservative: { leads: Math.round(leadCount * 0.8), appointments: Math.round(customerCount * 0.8), revenue: customerCount * 500 },
      expected: { leads: Math.round(leadCount * 1.2), appointments: Math.round(customerCount * 1.3), revenue: Math.round(customerCount * 1.2 * 500) },
      optimistic: { leads: Math.round(leadCount * 2), appointments: Math.round(customerCount * 2), revenue: Math.round(customerCount * 2 * 500) },
      confidence: contentCount > 5 ? 70 : 30,
    };

    // ---- Risks ----
    const risks: BusinessRisk[] = [];
    if (contentCount === 0 && leadCount === 0) risks.push({ id: 'r1', risk: '还没有内容和潜在客户', category: 'growth', severity: 'critical', impact: '没有增长入口', recommendation: '立即开始发布内容和建立漏斗页面' });
    if (customerCount === 0 && leadCount > 5) risks.push({ id: 'r2', risk: '有潜在客户但还没有成交', category: 'sales', severity: 'high', impact: '投入成本无回报', recommendation: '重点跟进高意向潜在客户' });

    // ---- Agent + Automation Recommendations ----
    const agentRecs: string[] = [];
    if (!ctx || brandHealth < 50) agentRecs.push('brand_strategist');
    if (contentHealth < 50) agentRecs.push('content_director');
    if (funnelHealth < 50 && leadCount > 0) agentRecs.push('funnel_architect');
    if (salesHealth < 40 && leadCount > 5) agentRecs.push('sales_coach');

    const autoRecs: string[] = [];
    if (!hasAutomation) autoRecs.push('tpl_assessment_followup');
    if (leadCount > 5 && !hasAutomation) autoRecs.push('tpl_hot_lead_escalation');

    return {
      summary: `业务健康度: ${overallScore}/100。${bottlenecks.length}个瓶颈，${opportunities.length}个增长机会，${risks.length}个风险。`,
      health, bottlenecks, opportunities, actions, risks, forecast,
      agentRecommendations: agentRecs, automationRecommendations: autoRecs,
    };
  },
};
