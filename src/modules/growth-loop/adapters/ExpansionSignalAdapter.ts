import type { ExpansionPath, ExpansionSignal } from '../contracts/ExpansionSignal';

export interface ExpansionSignalInput {
  userId: string;
  tenantId: string;
  teamSize: number;
  customerCount: number;
  automationWorkflowCount: number;
  aiUsageCount: number;
  generatedAt: string;
}

function expansionPaths(input: ExpansionSignalInput): ExpansionPath[] {
  const paths: ExpansionPath[] = [];
  if (input.teamSize > 0) paths.push('team_growth');
  if (input.automationWorkflowCount > 0) paths.push('automation');
  if (input.customerCount > 0) paths.push('upgrade');
  if (input.aiUsageCount > 0) paths.push('platform_growth');
  return paths.length > 0 ? paths : ['replication'];
}

function expansionScore(input: ExpansionSignalInput): number {
  const team = Math.min(input.teamSize * 10, 30);
  const customer = Math.min(input.customerCount * 10, 30);
  const automation = input.automationWorkflowCount > 0 ? 20 : 0;
  const ai = Math.min(input.aiUsageCount * 2, 20);
  return Math.min(team + customer + automation + ai, 100);
}

export function adaptExpansionSignals(input: ExpansionSignalInput): ExpansionSignal[] {
  const score = expansionScore(input);

  return [{
    source: 'GrowthLoop.ExpansionSignalAdapter',
    scope: 'user',
    confidence: score > 0 ? 'derived' : 'fallback',
    fallback: score > 0 ? 'none' : 'no_expansion_signals_found',

    id: `growth-expansion-${input.userId}`,
    domain: 'expansion',
    status: score === 0 ? 'missing' : score >= 70 ? 'active' : 'ready',
    score,
    summary: `${input.teamSize} team members, ${input.customerCount} customers, ${input.automationWorkflowCount} automation workflows.`,
    metrics: [
      { key: 'team_size', label: 'Team size', value: input.teamSize, unit: 'count' },
      { key: 'customer_count', label: 'Customer count', value: input.customerCount, unit: 'count' },
      { key: 'automation_workflow_count', label: 'Automation workflows', value: input.automationWorkflowCount, unit: 'count' },
      { key: 'ai_usage_count', label: 'AI usage count', value: input.aiUsageCount, unit: 'count' },
    ],
    evidence: [
      {
        source: 'User/Customer/AIUsageLog read models',
        description: 'Read-only expansion facts aggregated from team, customers, automation metadata, and AI usage.',
        observedAt: input.generatedAt,
      },
    ],
    recommendations: score >= 70 ? [] : [{
      id: 'growth-expansion-build-repeatable-system',
      title: 'Build repeatable expansion capacity',
      summary: 'Strengthen team, customer, and automation signals before treating expansion as scaling.',
      priority: 'medium',
      route: '/team/growth',
      owner: 'growth-loop',
    }],
    generatedAt: input.generatedAt,
    paths: expansionPaths(input),
    opportunities: score >= 70 ? [] : [{
      id: 'growth-expansion-team-system',
      path: input.teamSize > 0 ? 'team_growth' : 'replication',
      title: 'Document the repeatable growth system',
      expectedImpact: 'Improves duplication and expansion readiness.',
      route: '/team/growth',
    }],
    teamSize: input.teamSize,
    customerCount: input.customerCount,
    revenuePotentialScore: score,
  }];
}
