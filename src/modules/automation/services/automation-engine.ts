// Automation Engine — connects business engines automatically
// V5.1: Removes manual movement between Lead→CRM→Sales→Revenue→Team

export type BusinessEvent =
  | 'lead_created' | 'lead_qualified' | 'appointment_booked'
  | 'opportunity_won' | 'revenue_milestone' | 'leader_promoted';

interface WorkflowStep {
  event: BusinessEvent;
  action: string;
  targetModule: string;
  description: string;
}

const WORKFLOWS: Record<BusinessEvent, WorkflowStep> = {
  lead_created: {
    event: 'lead_created',
    action: 'create_crm_record',
    targetModule: '客户中心',
    description: '新潜在客户 → 自动创建 CRM 记录',
  },
  lead_qualified: {
    event: 'lead_qualified',
    action: 'create_sales_opportunity',
    targetModule: '销售中心',
    description: '已筛选潜在客户 → 自动创建销售机会',
  },
  appointment_booked: {
    event: 'appointment_booked',
    action: 'update_opportunity_stage',
    targetModule: '销售中心',
    description: '预约成功 → 自动更新销售机会阶段',
  },
  opportunity_won: {
    event: 'opportunity_won',
    action: 'update_revenue_dashboard',
    targetModule: '收入看板',
    description: '客户成交 → 更新收入 → 刷新看板',
  },
  revenue_milestone: {
    event: 'revenue_milestone',
    action: 'check_leader_criteria',
    targetModule: '团队成长中心',
    description: '达到收入里程碑 → 评估 Leader 条件',
  },
  leader_promoted: {
    event: 'leader_promoted',
    action: 'unlock_team_features',
    targetModule: '团队成长中心',
    description: 'Leader 晋升 → 解锁团队功能',
  },
};

export function getWorkflow(event: BusinessEvent): WorkflowStep | null {
  return WORKFLOWS[event] ?? null;
}

export function getConnectedEngines(): { from: string; to: string; event: BusinessEvent; description: string }[] {
  return Object.values(WORKFLOWS).map(w => ({
    from: w.event.split('_')[0],
    to: w.targetModule,
    event: w.event,
    description: w.description,
  }));
}
