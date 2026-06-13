// Analytics Engines — deterministic insight generation
import type { BusinessHealthScore, AIInsight, NextBestAction, Anomaly, Benchmark, KPIOverview } from './businessTypes';

export function calculateHealthScore(
  brandDNAExists: boolean, contentCount: number, videoCount: number,
  funnelExists: boolean, leadCount: number, customerCount: number,
  whatsappConfigured: boolean,
): BusinessHealthScore {
  const brandHealth = brandDNAExists ? 85 : 20;
  const contentHealth = contentCount >= 10 ? 85 : contentCount >= 3 ? 55 : contentCount > 0 ? 30 : 0;
  const trafficHealth = funnelExists ? 60 : 10;
  const funnelHealth = funnelExists ? (leadCount > 0 ? 75 : 50) : 0;
  const salesHealth = customerCount > 0 ? 80 : leadCount > 0 ? 40 : 5;
  const crmHealth = leadCount > 0 ? (whatsappConfigured ? 80 : 60) : 10;

  const overallScore = Math.round(brandHealth*0.15 + contentHealth*0.15 + trafficHealth*0.15 + funnelHealth*0.2 + salesHealth*0.2 + crmHealth*0.15);

  const recs: string[] = [];
  if (brandHealth < 50) recs.push('完成Brand DNA Studio，建立清晰的品牌定位。');
  if (contentHealth < 50) recs.push('发布更多内容，建议每周至少3篇。');
  if (funnelHealth < 50) recs.push('完成Funnel Builder，建立转化路径。');
  if (salesHealth < 30) recs.push('跟进你的Lead，推动第一笔成交。');

  return { overallScore, level: overallScore>=70?'high':overallScore>=40?'medium':'low', brandHealth, contentHealth, trafficHealth, funnelHealth, salesHealth, crmHealth, recommendations: recs.slice(0,3) };
}

export function generateInsights(kpi: KPIOverview, health: BusinessHealthScore): AIInsight[] {
  const insights: AIInsight[] = [];
  if (kpi.conversionRate > 20) insights.push({ id: 'i1', insight: '你的转化率高于平均水平，漏斗运转良好。', impact: 'high', category: 'funnel', action: '考虑增加流量来放大结果。' });
  if (kpi.leadResponseRate < 50 && kpi.totalLeads > 0) insights.push({ id: 'i2', insight: '跟进延迟正在降低转化率。', impact: 'high', category: 'crm', action: '确保24小时内回复每个Lead。' });
  if (kpi.totalPosts < 5 && kpi.totalVideos < 2) insights.push({ id: 'i3', insight: '内容产出偏低，获客需要更多内容支撑。', impact: 'medium', category: 'content', action: '本周发布3篇内容。' });
  if (kpi.totalLeads > 10 && kpi.totalConversions === 0) insights.push({ id: 'i4', insight: '你有Lead但没有成交。跟进流程需要改进。', impact: 'high', category: 'sales', action: '检查WhatsApp跟进和预约流程。' });
  if (kpi.totalRevenue > 0) insights.push({ id: 'i5', insight: `已产生RM${kpi.totalRevenue.toLocaleString()}收入。继续优化漏斗可以放大结果。`, impact: 'high', category: 'revenue', action: '分析最有效的获客渠道，加倍投入。' });
  if (insights.length === 0) insights.push({ id: 'i0', insight: '系统正在建立中。继续完成各个模块，数据会越来越好。', impact: 'medium', category: 'growth', action: '完成下一步任务。' });
  return insights.slice(0, 5);
}

export function generateNextActions(health: BusinessHealthScore, kpi: KPIOverview): NextBestAction[] {
  const actions: NextBestAction[] = [];
  if (health.contentHealth < 50) actions.push({ id: 'a1', priority: 1, action: '发布3篇新内容', reason: '内容产出偏低，获客需要内容', impact: '增加曝光和Lead' });
  if (health.funnelHealth < 50) actions.push({ id: 'a2', priority: 2, action: '完善漏斗转化', reason: '漏斗健康度不足', impact: '提高Lead转化率' });
  if (health.crmHealth < 50 && kpi.totalLeads > 0) actions.push({ id: 'a3', priority: 3, action: '跟进Top 10 Hot Leads', reason: 'CRM效率需要提升', impact: '直接推动成交' });
  if (kpi.totalVideos < 3) actions.push({ id: 'a4', priority: 4, action: '制作2支短视频', reason: '视频是增长最快的格式', impact: '提高内容触达' });
  if (actions.length === 0) actions.push({ id: 'a5', priority: 5, action: '优化广告投放', reason: '系统运转良好，可以扩大', impact: '放大已有成果' });
  return actions.sort((a,b) => a.priority - b.priority).slice(0, 3);
}

export function detectAnomalies(prevLeads: number, curLeads: number, prevConv: number, curConv: number): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (prevLeads > 0 && curLeads < prevLeads * 0.6) anomalies.push({ id: 'an1', metric: 'Lead量', change: `下降${Math.round((1-curLeads/Math.max(prevLeads,1))*100)}%`, direction: 'down', severity: 'warning', alert: 'Lead generation dropped significantly this week.' });
  if (prevConv > 0 && curConv < prevConv * 0.5) anomalies.push({ id: 'an2', metric: '转化率', change: `下降${Math.round((1-curConv/Math.max(prevConv,1))*100)}%`, direction: 'down', severity: 'critical', alert: 'Conversion rate has dropped. Check funnel.' });
  return anomalies;
}

export function getBenchmark(kpi: KPIOverview): Benchmark {
  if (kpi.totalRevenue > 0 && kpi.totalLeads > 20) return { level: 'scale', requirements: ['月收入>RM10k', '自动化跟进系统', '团队扩展'], progress: 75 };
  if (kpi.totalLeads > 5) return { level: 'growth', requirements: ['10+ Leads', '首次成交', '内容日历'], progress: 50 };
  return { level: 'starter', requirements: ['完成Brand DNA', '发布第一篇内容', '建立漏斗'], progress: Math.round((kpi.totalPosts>0?33:0)+(kpi.totalLeads>0?33:0)+(kpi.totalConversions>0?34:0)) };
}
