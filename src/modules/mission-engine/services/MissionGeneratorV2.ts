import { CANONICAL_ROUTES } from '@/config/canonical-routes';
import type {
  BottleneckResult,
  ExplainabilityResult,
  MissionCompletionValidation,
  MissionPlan,
  MissionStep,
  MissionType,
  PriorityResult,
} from '../contracts/MissionAuthority';

type MissionTemplate = {
  objective: string;
  description: string;
  steps: MissionStep[];
  estimatedTime: number;
  successCriteria: string[];
  completionChecks: string[];
  route: string;
};

const TEMPLATES: Record<MissionType, MissionTemplate> = {
  BRAND: {
    objective: 'Complete Your AI Business Interview',
    description: 'Capture the business context the AI COO needs before ranking growth actions.',
    steps: [
      { id: 'brand.interview.start', title: 'Open AI Interview', description: 'Start the business interview and confirm the business mode.', estimatedMinutes: 2, required: true },
      { id: 'brand.interview.answer', title: 'Answer Core Questions', description: 'Provide audience, offer, story, and growth context.', estimatedMinutes: 5, required: true },
      { id: 'brand.interview.confirm', title: 'Confirm Business Profile', description: 'Review the extracted profile before it becomes the source of truth.', estimatedMinutes: 3, required: true },
    ],
    estimatedTime: 10,
    successCriteria: ['Business Profile Captured', 'AI Interview Completed'],
    completionChecks: ['businessProfile.exists', 'aiInterview.completed'],
    route: CANONICAL_ROUTES.brandInterview,
  },
  POSITIONING: {
    objective: 'Define Market Position',
    description: 'Clarify the audience, problem, offer promise, and trust angle before content and funnels scale.',
    steps: [
      { id: 'positioning.audience', title: 'Confirm Target Audience', description: 'Select the audience segment and primary pain point.', estimatedMinutes: 5, required: true },
      { id: 'positioning.promise', title: 'Write Offer Promise', description: 'Create the transformation statement and positioning line.', estimatedMinutes: 10, required: true },
      { id: 'positioning.cta', title: 'Confirm CTA', description: 'Choose the primary next action for prospects.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 20,
    successCriteria: ['Audience Defined', 'Positioning Statement Confirmed', 'Primary CTA Confirmed'],
    completionChecks: ['audience.defined', 'positioning.confirmed', 'cta.confirmed'],
    route: CANONICAL_ROUTES.brandProfile,
  },
  CONTENT: {
    objective: 'Build Content Foundation',
    description: 'Publish trust-building content that helps the right audience discover the offer.',
    steps: [
      { id: 'content.pillar', title: 'Choose Content Pillar', description: 'Select the pillar that best supports the current offer.', estimatedMinutes: 5, required: true },
      { id: 'content.generate', title: 'Generate Content Draft', description: 'Create the first useful post or content asset.', estimatedMinutes: 10, required: true },
      { id: 'content.publish', title: 'Publish Content', description: 'Publish or schedule the content in the active channel.', estimatedMinutes: 10, required: true },
    ],
    estimatedTime: 25,
    successCriteria: ['Content Draft Created', 'Content Published'],
    completionChecks: ['content.draftCreated', 'content.published'],
    route: CANONICAL_ROUTES.contentEngine,
  },
  LEAD_MAGNET: {
    objective: 'Create Your First Lead Magnet',
    description: 'Build a lead capture asset that encourages prospects to exchange contact information.',
    steps: [
      { id: 'leadMagnet.type', title: 'Select Lead Magnet Type', description: 'Choose the format that fits the audience and offer.', estimatedMinutes: 5, required: true },
      { id: 'leadMagnet.content', title: 'Generate Lead Magnet Content', description: 'Create the asset copy and structure.', estimatedMinutes: 15, required: true },
      { id: 'leadMagnet.publish', title: 'Publish Lead Magnet', description: 'Publish the asset so it can be requested by prospects.', estimatedMinutes: 10, required: true },
      { id: 'leadMagnet.cta', title: 'Connect CTA', description: 'Connect the lead magnet to the call to action.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 35,
    successCriteria: ['Lead Magnet Exists', 'Lead Magnet Published', 'CTA Active'],
    completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    route: CANONICAL_ROUTES.leadMagnet,
  },
  FUNNEL: {
    objective: 'Build Funnel',
    description: 'Create a working landing page, thank-you path, and lead route for the current lead offer.',
    steps: [
      { id: 'funnel.landing', title: 'Create Landing Page', description: 'Build the page that presents the lead offer and CTA.', estimatedMinutes: 15, required: true },
      { id: 'funnel.thankYou', title: 'Create Thank You Path', description: 'Prepare the next screen or follow-up instruction after opt-in.', estimatedMinutes: 10, required: true },
      { id: 'funnel.route', title: 'Connect Lead Route', description: 'Route submissions into CRM, WhatsApp, or the selected follow-up channel.', estimatedMinutes: 10, required: true },
      { id: 'funnel.test', title: 'Run Funnel Test', description: 'Submit a test lead and verify the route works.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 40,
    successCriteria: ['Landing Page Published', 'Thank You Page Published', 'Lead Route Active'],
    completionChecks: ['landingPage.published', 'thankYouPage.published', 'leadRoute.active'],
    route: CANONICAL_ROUTES.funnel,
  },
  TRAFFIC: {
    objective: 'Activate Traffic Source',
    description: 'Start one measurable traffic source so the funnel can receive real visitors.',
    steps: [
      { id: 'traffic.source', title: 'Choose Traffic Source', description: 'Select the channel most likely to reach qualified prospects now.', estimatedMinutes: 5, required: true },
      { id: 'traffic.asset', title: 'Prepare Traffic Asset', description: 'Create the post, message, or campaign asset that points to the funnel.', estimatedMinutes: 15, required: true },
      { id: 'traffic.launch', title: 'Launch Traffic Test', description: 'Publish or activate the traffic test.', estimatedMinutes: 10, required: true },
      { id: 'traffic.track', title: 'Confirm Tracking', description: 'Verify that visits can be measured.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 35,
    successCriteria: ['Traffic Source Active', 'Tracking Active'],
    completionChecks: ['trafficSource.active', 'tracking.active'],
    route: CANONICAL_ROUTES.trafficEngine,
  },
  CUSTOMERS: {
    objective: 'Convert Existing Leads',
    description: 'Work the closest customer opportunities through offer, follow-up, and sales action.',
    steps: [
      { id: 'customers.review', title: 'Review Lead Pipeline', description: 'Identify the warmest leads or buying signals.', estimatedMinutes: 5, required: true },
      { id: 'customers.offer', title: 'Prepare Offer Message', description: 'Clarify the offer and next step for the selected leads.', estimatedMinutes: 10, required: true },
      { id: 'customers.followUp', title: 'Send Follow-Up', description: 'Contact the selected leads with the next action.', estimatedMinutes: 10, required: true },
      { id: 'customers.record', title: 'Record Outcome', description: 'Update lead status, appointment, proposal, or purchase result.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 30,
    successCriteria: ['Lead Follow-Up Completed', 'Customer Opportunity Updated'],
    completionChecks: ['lead.followUpCompleted', 'customerOpportunity.updated'],
    route: CANONICAL_ROUTES.leads,
  },
  RETENTION: {
    objective: 'Build Retention System',
    description: 'Create follow-up paths that improve repeat purchase, reactivation, or customer success.',
    steps: [
      { id: 'retention.segment', title: 'Select Customer Segment', description: 'Choose the customer group that needs follow-up.', estimatedMinutes: 5, required: true },
      { id: 'retention.path', title: 'Create Follow-Up Path', description: 'Define the message, timing, and offer for the follow-up.', estimatedMinutes: 15, required: true },
      { id: 'retention.activate', title: 'Activate Retention Action', description: 'Send, schedule, or assign the follow-up action.', estimatedMinutes: 10, required: true },
      { id: 'retention.review', title: 'Review Response', description: 'Record customer response or next follow-up date.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 35,
    successCriteria: ['Retention Path Active', 'Customer Follow-Up Recorded'],
    completionChecks: ['retentionPath.active', 'customerFollowUp.recorded'],
    route: CANONICAL_ROUTES.crm,
  },
  TEAM: {
    objective: 'Create SOP',
    description: 'Turn a proven workflow into a repeatable operating procedure for team or AI workforce execution.',
    steps: [
      { id: 'team.workflow', title: 'Choose Workflow', description: 'Select the workflow that should be delegated or repeated.', estimatedMinutes: 5, required: true },
      { id: 'team.sop', title: 'Document SOP', description: 'Write the steps, inputs, outputs, and owner.', estimatedMinutes: 15, required: true },
      { id: 'team.assign', title: 'Assign Execution Owner', description: 'Assign the SOP to a person or AI agent.', estimatedMinutes: 5, required: true },
      { id: 'team.review', title: 'Review First Run', description: 'Check the first execution result and update the SOP.', estimatedMinutes: 10, required: true },
    ],
    estimatedTime: 35,
    successCriteria: ['SOP Created', 'Execution Owner Assigned'],
    completionChecks: ['sop.created', 'executionOwner.assigned'],
    route: CANONICAL_ROUTES.teamGrowth,
  },
  OPTIMIZATION: {
    objective: 'Growth Optimization Mission',
    description: 'Run a focused optimization experiment after the core business system is healthy.',
    steps: [
      { id: 'optimization.analyze', title: 'Analyze Opportunities', description: 'Review the strongest growth, revenue, or scale opportunity.', estimatedMinutes: 10, required: true },
      { id: 'optimization.select', title: 'Select Experiment', description: 'Choose one experiment with a clear expected outcome.', estimatedMinutes: 5, required: true },
      { id: 'optimization.execute', title: 'Execute Experiment', description: 'Run the selected experiment.', estimatedMinutes: 20, required: true },
      { id: 'optimization.review', title: 'Review Outcome', description: 'Record what changed and what to do next.', estimatedMinutes: 10, required: true },
    ],
    estimatedTime: 45,
    successCriteria: ['Optimization Completed'],
    completionChecks: ['optimization.completed'],
    route: CANONICAL_ROUTES.dashboard,
  },
  SYSTEM: {
    objective: 'Restore Business Visibility',
    description: 'Restore the business signals required for reliable AI COO recommendations.',
    steps: [
      { id: 'system.verify', title: 'Verify Signal Sources', description: 'Check the sources required for current business state calculation.', estimatedMinutes: 10, required: true },
      { id: 'system.restore', title: 'Restore Integrations', description: 'Reconnect or repair unavailable data sources.', estimatedMinutes: 15, required: true },
      { id: 'system.recalculate', title: 'Recalculate Business State', description: 'Refresh the business state after signals are restored.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 30,
    successCriteria: ['Signals Available'],
    completionChecks: ['signals.available'],
    route: CANONICAL_ROUTES.dashboard,
  },
};

export function generateMissionPlan(input: {
  priorityResult: PriorityResult;
  explainability: ExplainabilityResult;
  bottleneckResult?: BottleneckResult;
}): MissionPlan {
  return generateMissionPlanForType({
    missionType: input.priorityResult.missionType,
    route: input.priorityResult.route,
    nextMilestone: input.explainability.nextMilestone,
  });
}

export function generateMissionPlanForType(input: {
  missionType: MissionType;
  nextMilestone?: string;
  route?: string;
}): MissionPlan {
  const template = TEMPLATES[input.missionType];

  return {
    id: `mission-plan-${input.missionType.toLowerCase()}`,
    objective: template.objective,
    description: template.description,
    steps: template.steps,
    estimatedTime: template.estimatedTime,
    successCriteria: template.successCriteria,
    completionChecks: template.completionChecks,
    route: input.route || template.route,
    missionType: input.missionType,
    nextMilestone: input.nextMilestone ?? template.successCriteria[0] ?? template.objective,
  };
}

export function validateMissionCompletion(input: {
  missionPlan: MissionPlan;
  completedChecks?: string[];
}): MissionCompletionValidation {
  const completed = new Set(input.completedChecks ?? []);
  const passedChecks = input.missionPlan.completionChecks.filter((check) => completed.has(check));
  const missingChecks = input.missionPlan.completionChecks.filter((check) => !completed.has(check));

  return {
    completed: input.missionPlan.completionChecks.length > 0 && missingChecks.length === 0,
    completionPercentage: input.missionPlan.completionChecks.length > 0
      ? Math.floor((passedChecks.length / input.missionPlan.completionChecks.length) * 100)
      : 0,
    completionChecks: input.missionPlan.completionChecks,
    passedChecks,
    failedChecks: missingChecks,
    missingChecks,
    nextRequiredCheck: missingChecks[0] ?? null,
    verificationStatus: missingChecks.length === 0 ? 'VERIFIED' : 'BLOCKED',
    verificationSource: 'manual',
    verifiedAt: new Date().toISOString(),
    source: 'MissionGeneratorV2',
  };
}

export const missionGeneratorV2 = {
  generate: generateMissionPlan,
  generateForType: generateMissionPlanForType,
  validateCompletion: validateMissionCompletion,
};
