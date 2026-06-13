// Automation Engine — trigger → condition → action pipeline
import type { WorkflowDefinition, WorkflowExecution, WorkflowCondition, WorkflowAction, TriggerType, ExecutionStatus } from './types';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

// ---- Trigger evaluation ----
export function evaluateTrigger(workflow: WorkflowDefinition, event: { type: TriggerType; data?: Record<string, unknown> }): boolean {
  return workflow.trigger.type === event.type;
}

// ---- Condition evaluation ----
export function evaluateConditions(conditions: WorkflowCondition[], event: { type: TriggerType; data?: Record<string, unknown> }): boolean {
  if (conditions.length === 0) return true;
  for (const c of conditions) {
    if (c.type === 'leadScoreEquals') { if (event.data?.score !== c.value) return false; }
    if (c.type === 'leadScoreAbove') { if ((event.data?.score as number ?? 0) <= (c.value as number ?? 0)) return false; }
    if (c.type === 'planTypeEquals') { if (event.data?.plan !== c.value) return false; }
    if (c.type === 'creditsAvailable') { if ((event.data?.credits as number ?? 0) <= 0) return false; }
  }
  return true;
}

// ---- Action execution ----
export async function executeActions(actions: WorkflowAction[], userId: string, tenantId: string, event: { type: TriggerType; data?: Record<string, unknown> }): Promise<{ success: number; errors: string[] }> {
  let success = 0; const errors: string[] = [];
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'createLead': await prisma.lead.create({ data: { tenantId, ownerId: userId, name: (action.config.name as string) ?? 'New Lead', source: (action.config.source as string) ?? 'automation', pipelineStage: 'new_lead' } }); break;
        case 'createOpportunity': /* Log to audit */ break;
        case 'createFollowup': await prisma.activity.create({ data: { tenantId, userId, type: 'follow_up', description: (action.config.template as string) ?? 'Automated follow-up' } }); break;
        case 'generateReply': /* Trigger WhatsApp AI */ break;
        case 'unlockMission': /* Triggered via mission engine */ break;
        case 'awardXP': /* Mission engine handles */ break;
        case 'sendNotification': await prisma.activity.create({ data: { tenantId, userId, type: 'notification', description: (action.config.message as string) ?? 'Automation triggered' } }); break;
        case 'createTask': await prisma.activity.create({ data: { tenantId, userId, type: 'task', description: (action.config.title as string) ?? 'New task' } }); break;
        default: break;
      }
      success++;
    } catch (e: unknown) {
      errors.push(`${action.type}: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  }
  return { success, errors };
}

// ---- Workflow execution ----
let executionCount = 0;

export async function executeWorkflow(
  workflow: WorkflowDefinition,
  event: { type: TriggerType; data?: Record<string, unknown> },
  userId: string,
  tenantId: string,
): Promise<WorkflowExecution> {
  const startTime = Date.now();
  const id = `exec-${++executionCount}-${Date.now()}`;

  if (!workflow.enabled) return { id, workflowId: workflow.id, workflowName: workflow.name, trigger: event.type, conditionsMet: false, actionsExecuted: 0, status: 'cancelled', errors: ['Workflow disabled'], executedAt: new Date().toISOString(), durationMs: Date.now() - startTime };

  const triggered = evaluateTrigger(workflow, event);
  if (!triggered) return { id, workflowId: workflow.id, workflowName: workflow.name, trigger: event.type, conditionsMet: false, actionsExecuted: 0, status: 'cancelled', errors: ['Trigger not matched'], executedAt: new Date().toISOString(), durationMs: Date.now() - startTime };

  const conditionsMet = evaluateConditions(workflow.conditions, event);
  if (!conditionsMet) return { id, workflowId: workflow.id, workflowName: workflow.name, trigger: event.type, conditionsMet: false, actionsExecuted: 0, status: 'cancelled', errors: ['Conditions not met'], executedAt: new Date().toISOString(), durationMs: Date.now() - startTime };

  const result = await executeActions(workflow.actions, userId, tenantId, event);
  const status: ExecutionStatus = result.errors.length === 0 ? 'completed' : result.errors.length < result.success ? 'completed' : 'failed';

  return { id, workflowId: workflow.id, workflowName: workflow.name, trigger: event.type, conditionsMet: true, actionsExecuted: result.success, status, errors: result.errors, executedAt: new Date().toISOString(), durationMs: Date.now() - startTime };
}

// ---- Batch — run all enabled workflows for an event ----
export async function runAutomationForEvent(
  event: { type: TriggerType; data?: Record<string, unknown> },
  userId: string,
  tenantId: string,
): Promise<WorkflowExecution[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const meta = (user?.metadata as Record<string, unknown>) ?? {};
  const workflows: WorkflowDefinition[] = Array.isArray(meta.automation_workflows) ? (meta.automation_workflows as WorkflowDefinition[]) : [];

  // Always include built-in templates
  const { WORKFLOW_TEMPLATES } = await import('./workflowTemplates');
  const allWorkflows = [...WORKFLOW_TEMPLATES.filter(t => t.enabled), ...workflows.filter(w => w.enabled)];

  const executions: WorkflowExecution[] = [];
  for (const wf of allWorkflows) {
    executions.push(await executeWorkflow(wf, event, userId, tenantId));
  }
  return executions;
}
