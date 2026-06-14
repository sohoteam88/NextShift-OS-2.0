import type { AgentExecutionInput, AgentExecutionReport } from '../types/agents';

export async function executeCRMManager(input: AgentExecutionInput): Promise<AgentExecutionReport> {
  const f: string[] = []; const r: string[] = []; const a: AgentExecutionReport['actions'] = [];
  const cc = await import('@/modules/crm/crmCenterService').then(m => m.crmCenterService.getCommandCenter(input.userId, input.tenantId));
  f.push(`${cc.leads.total}个Lead，${cc.hotLeads.length}个Hot Lead。`);
  if (cc.hotLeads.length > 0) { f.push(`🔥 ${cc.hotLeads[0]?.name}需要立即跟进。`); r.push(cc.hotLeads[0]?.suggestedAction ?? '跟进Hot Lead'); a.push({ description: '跟进Hot Lead', route: '/crm-center', module: 'CRM' }); }
  if (cc.followups.overdue > 0) { f.push(`${cc.followups.overdue}个跟进已逾期。`); r.push('今天完成逾期跟进。'); a.push({ description: '完成逾期跟进', route: '/crm-center', module: 'CRM' }); }
  if (cc.hotLeads.length === 0 && cc.leads.total > 0) { r.push('所有Lead都需要培养。继续发送有价值的内容。'); }
  return { agent: 'crm_manager', objective: input.objective, findings: f, recommendations: r, actions: a, confidenceScore: cc.hotLeads.length > 0 ? 85 : 60, executedAt: new Date().toISOString() };
}
