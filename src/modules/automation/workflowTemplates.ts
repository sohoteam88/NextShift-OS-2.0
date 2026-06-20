import type { WorkflowDefinition } from './types';

export const WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  {
    id: 'tpl_assessment_followup', name: '评估后跟进', description: '评估完成后自动创建潜在客户、评分并生成跟进', enabled: false, isTemplate: true, requiredPlan: 'starter',
    trigger: { type: 'assessment_completed' },
    conditions: [],
    actions: [{ type: 'createLead', config: { source: 'assessment' } }, { type: 'createFollowup', config: { template: 'assessment_result' } }, { type: 'sendNotification', config: { message: '新潜在客户已创建' } }],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_hot_lead_escalation', name: '高意向客户提醒', description: '潜在客户评分为 A 时自动通知并创建 CRM 任务', enabled: false, isTemplate: true, requiredPlan: 'starter',
    trigger: { type: 'lead_scored' },
    conditions: [{ type: 'leadScoreEquals', field: 'score', operator: 'eq', value: 'A' }],
    actions: [{ type: 'createTask', config: { title: '跟进高意向潜在客户', priority: 'high' } }, { type: 'sendNotification', config: { message: '🔥 高意向潜在客户需要立即跟进' } }, { type: 'createOpportunity', config: { stage: 'qualified' } }],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_webinar_followup', name: '线上讲座后跟进', description: '参加线上讲座后自动生成销售跟进并创建机会', enabled: false, isTemplate: true, requiredPlan: 'pro',
    trigger: { type: 'webinar_attended' },
    conditions: [],
    actions: [{ type: 'generateReply', config: { context: 'webinar_followup' } }, { type: 'createOpportunity', config: { stage: 'identified' } }, { type: 'sendNotification', config: { message: '线上讲座参与者需要跟进' } }],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_mission_progression', name: 'Mission Progression', description: '任务完成后自动解锁下一步、奖励XP、通知用户', enabled: true, isTemplate: true, requiredPlan: 'free',
    trigger: { type: 'mission_completed' },
    conditions: [],
    actions: [{ type: 'unlockMission', config: { auto: true } }, { type: 'awardXP', config: { amount: 50 } }, { type: 'sendNotification', config: { message: '🎉 任务完成！下一步已解锁' } }],
    createdAt: new Date().toISOString(),
  },
];
