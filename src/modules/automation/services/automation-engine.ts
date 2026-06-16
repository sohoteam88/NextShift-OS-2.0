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
    targetModule: 'CRM Engine',
    description: 'New lead → CRM record created automatically',
  },
  lead_qualified: {
    event: 'lead_qualified',
    action: 'create_sales_opportunity',
    targetModule: 'Sales Engine',
    description: 'Qualified lead → Sales opportunity created automatically',
  },
  appointment_booked: {
    event: 'appointment_booked',
    action: 'update_opportunity_stage',
    targetModule: 'Sales Engine',
    description: 'Appointment booked → Opportunity stage updated',
  },
  opportunity_won: {
    event: 'opportunity_won',
    action: 'update_revenue_dashboard',
    targetModule: 'Revenue Dashboard',
    description: 'Customer closed → Revenue updated → Dashboard refreshed',
  },
  revenue_milestone: {
    event: 'revenue_milestone',
    action: 'check_leader_criteria',
    targetModule: 'Team Engine',
    description: 'Revenue milestone reached → Leader criteria evaluated',
  },
  leader_promoted: {
    event: 'leader_promoted',
    action: 'unlock_team_features',
    targetModule: 'Team Engine',
    description: 'Leader promoted → Team features unlocked',
  },
};

export function getWorkflow(event: BusinessEvent): WorkflowStep | null {
  return WORKFLOWS[event] ?? null;
}

export function getConnectedEngines(): { from: string; to: string; event: BusinessEvent; description: string }[] {
  return Object.values(WORKFLOWS).map(w => ({
    from: w.event.split('_')[0] + ' Engine',
    to: w.targetModule,
    event: w.event,
    description: w.description,
  }));
}
