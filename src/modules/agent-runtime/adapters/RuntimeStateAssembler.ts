import prisma from '@/lib/prisma';
import { agentManager } from '@/modules/ai/services/agent-manager';
import { agentMemoryService } from '@/modules/ai/services/agent-memory';
import { cooPlanService } from '@/modules/ai-coo/services/COOPlanService';
import type { RuntimeState } from '../contracts/RuntimeState';
import {
  adaptCOOAssignmentRuntimeAssignment,
  adaptDefaultStageRuntimeAssignment,
} from './RuntimeAssignmentAdapter';
import { adaptAgentExecutionReport } from './RuntimeResultAdapter';

function mapRuntimeHealth(health: 'optimal' | 'good' | 'attention'): RuntimeState['health'] {
  return health;
}

export async function assembleRuntimeState(userId: string): Promise<RuntimeState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      tenant: {
        select: {
          plan: true,
        },
      },
      userProgress: {
        select: {
          currentStageId: true,
        },
      },
    },
  });

  if (!user) throw new Error('User not found');

  const plan = user.tenant?.plan ?? 'free';
  const currentStage = user.userProgress?.currentStageId ?? 'account_approved';
  const [workforceState, reports, cooPlan, fallbackAssignment] = await Promise.all([
    agentManager.getWorkforceState(user.id, user.tenantId, plan, currentStage),
    agentMemoryService.recall(user.id),
    cooPlanService.getCOOPlan(user.id),
    adaptDefaultStageRuntimeAssignment({ currentStage, plan }),
  ]);
  const pendingAssignments = cooPlan.assignments.length > 0
    ? cooPlan.assignments.map(adaptCOOAssignmentRuntimeAssignment)
    : [fallbackAssignment];

  return {
    source: 'RuntimeStateAssembler',
    scope: 'user',
    confidence: 'derived',
    fallback: 'metadata-backed-memory-and-derived-lifecycle',

    userId: user.id,
    tenantId: user.tenantId,
    availableAgents: workforceState.available,
    recommendedAgents: workforceState.recommended,
    activeExecutions: [],
    recentResults: reports.slice(-5).map((report, index) => (
      adaptAgentExecutionReport(report, `runtime-memory-${index}-${report.agent}-${report.executedAt}`)
    )),
    pendingAssignments,
    health: mapRuntimeHealth(workforceState.health),
    generatedAt: new Date().toISOString(),
  };
}
