export type TriggerType = 'mission_completed'|'achievement_unlocked'|'lead_created'|'lead_scored'|'lead_stage_changed'|'content_published'|'video_ready'|'assessment_completed'|'quiz_completed'|'webinar_registered'|'webinar_attended'|'appointment_booked'|'opportunity_created'|'campaign_created'|'agent_report_generated';
export type ConditionType = 'leadScoreEquals'|'leadScoreAbove'|'planTypeEquals'|'missionCompleted'|'funnelHealthAbove'|'webinarAttended'|'appointmentExists'|'campaignReady'|'creditsAvailable';
export type ActionType = 'createLead'|'updateLead'|'createOpportunity'|'addNote'|'createFollowup'|'generateReply'|'scheduleReminder'|'unlockMission'|'awardXP'|'awardAchievement'|'executeAgent'|'generateInsight'|'sendNotification'|'createTask';
export type ExecutionStatus = 'pending'|'running'|'completed'|'failed'|'cancelled';

export interface WorkflowTrigger { type: TriggerType; config?: Record<string, unknown>; }
export interface WorkflowCondition { type: ConditionType; field?: string; operator?: string; value?: unknown; }
export interface WorkflowAction { type: ActionType; config: Record<string, unknown>; }

export interface WorkflowDefinition {
  id: string; name: string; description: string; trigger: WorkflowTrigger; conditions: WorkflowCondition[]; actions: WorkflowAction[]; enabled: boolean; isTemplate: boolean; requiredPlan: string; createdAt: string;
}

export interface WorkflowExecution {
  id: string; workflowId: string; workflowName: string; trigger: TriggerType; conditionsMet: boolean; actionsExecuted: number; status: ExecutionStatus; errors: string[]; executedAt: string; durationMs: number;
}

export interface AutomationHealth { score: number; activeWorkflows: number; successfulExecutions: number; failedExecutions: number; retries: number; recommendations: string[]; }
