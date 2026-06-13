import type { AgentDefinition, AgentId } from './types';

export const AGENT_REGISTRY: Record<AgentId, AgentDefinition> = {
  brand_strategist: { id: 'brand_strategist', name: '品牌策略师', description: '完善品牌定位、受众清晰度和服务方向', capabilities: ['品牌发现', '品牌DNA', '定位优化', '受众分析'], allowedActions: ['analyze_brand', 'recommend_positioning', 'improve_dna'], requiredFeatures: ['brand_discovery', 'brand_dna'], requiredPlan: 'starter', dependencies: [], emoji: '🧬' },
  content_director: { id: 'content_director', name: '内容总监', description: '规划内容支柱、日历和发布策略', capabilities: ['内容支柱', '内容日历', '发布策略', '内容缺口分析'], allowedActions: ['create_pillars', 'generate_calendar', 'analyze_gaps'], requiredFeatures: ['content_engine'], requiredPlan: 'starter', dependencies: ['brand_strategist'], emoji: '📝' },
  video_producer: { id: 'video_producer', name: '视频制作人', description: '制定视频策略、脚本、分镜和AI提示词', capabilities: ['视频策略', '脚本生成', '分镜列表', 'AI视频提示词'], allowedActions: ['create_strategy', 'generate_script', 'create_shotlist'], requiredFeatures: ['video_production'], requiredPlan: 'pro', dependencies: ['content_director'], emoji: '🎬' },
  funnel_architect: { id: 'funnel_architect', name: '漏斗架构师', description: '设计引流磁铁、Webinar和完整转化漏斗', capabilities: ['引流磁铁', 'Webinar', '着陆页', '漏斗优化'], allowedActions: ['build_lead_magnet', 'design_webinar', 'optimize_funnel'], requiredFeatures: ['lead_magnet', 'funnel_builder'], requiredPlan: 'pro', dependencies: ['content_director'], emoji: '🚀' },
  traffic_strategist: { id: 'traffic_strategist', name: '流量策略师', description: '规划广告策略、预算和投放方案', capabilities: ['广告策略', '预算规划', '投放方案', '流量分析'], allowedActions: ['plan_campaign', 'allocate_budget', 'analyze_traffic'], requiredFeatures: ['traffic_engine'], requiredPlan: 'pro', dependencies: ['funnel_architect'], emoji: '📣' },
  sales_coach: { id: 'sales_coach', name: '销售教练', description: '优化WhatsApp回复、异议处理和跟进策略', capabilities: ['智能回复', '异议处理', '跟进策略', '成交支持'], allowedActions: ['generate_reply', 'handle_objection', 'plan_followup'], requiredFeatures: ['whatsapp_ai'], requiredPlan: 'pro', dependencies: ['traffic_strategist'], emoji: '💬' },
  crm_manager: { id: 'crm_manager', name: 'CRM经理', description: '管理Lead优先级、管道和收入预测', capabilities: ['Lead优先级', '管道管理', '收入预测', '跟进提醒'], allowedActions: ['prioritize_leads', 'review_pipeline', 'forecast_revenue'], requiredFeatures: ['crm', 'analytics'], requiredPlan: 'agency', dependencies: ['sales_coach'], emoji: '📊' },
  ceo_advisor: { id: 'ceo_advisor', name: 'CEO顾问', description: '分析整体业务健康度、KPI和增长机会', capabilities: ['业务分析', 'KPI追踪', '风险评估', '增长建议'], allowedActions: ['analyze_business', 'review_kpis', 'identify_risks', 'suggest_growth'], requiredFeatures: ['analytics', 'admin'], requiredPlan: 'agency', dependencies: ['crm_manager'], emoji: '🏢' },
};

export function getAgent(id: AgentId): AgentDefinition { return AGENT_REGISTRY[id]; }
export function getAgentsForPlan(plan: string): AgentDefinition[] { return Object.values(AGENT_REGISTRY).filter(a => {
  const tierOrder = { free: 0, starter: 1, pro: 2, agency: 3 };
  return (tierOrder[plan as keyof typeof tierOrder] ?? 0) >= (tierOrder[a.requiredPlan] ?? 0);
}); }
export function getAgentsForMissionStage(stage: string): AgentId[] {
  const map: Record<string, AgentId[]> = {
    account_approved: ['brand_strategist'], brand_discovery: ['brand_strategist'], brand_dna: ['brand_strategist'],
    social_setup: ['content_director'], first_bio: ['content_director'], first_content: ['content_director'],
    first_video: ['video_producer'], lead_magnet: ['funnel_architect'], webinar: ['funnel_architect'],
    funnel: ['funnel_architect', 'traffic_strategist'], traffic_campaign: ['traffic_strategist'],
    whatsapp_followup: ['sales_coach'], crm_setup: ['crm_manager'], first_sale: ['crm_manager', 'ceo_advisor'],
    growth_mode: ['ceo_advisor'],
  };
  return map[stage] ?? [];
}
