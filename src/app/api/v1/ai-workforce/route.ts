import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { runtimeStateService } from '@/modules/agent-runtime/services/RuntimeStateService';
import { toWorkforceViewModel } from '@/modules/agent-runtime/view-models/WorkforceViewModelAdapter';

function recommendedRouteFor(currentState: string, missingRequirements: string[]) {
  if (currentState === 'SALES' || missingRequirements.includes('Revenue Exists')) return '/sales';
  if (missingRequirements.includes('Process Documented')) return '/journey';
  if (missingRequirements.includes('Delegation Ready')) return '/journey';
  if (missingRequirements.includes('Agent Workforce Active')) return '/content-engine';
  if (missingRequirements.includes('Human Team Added')) return '/ai-workforce';
  return '/dashboard';
}

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const [runtimeState, businessState] = await Promise.all([
    runtimeStateService.getRuntimeState(user.id),
    businessStateService.getBusinessState(user.id),
  ]);
  const stateResult = businessState.stateResult;
  const teamRequirements = stateResult.currentState === 'TEAM_BUILDING'
    ? stateResult.explainability.missing
    : [];
  const completedLabels = new Set(stateResult.completedStates);
  const isTeamStage = stateResult.currentState === 'TEAM_BUILDING' || completedLabels.has('TEAM_BUILDING');
  const data = toWorkforceViewModel(runtimeState);

  return NextResponse.json({
    data: {
      ...data,
      workforceGate: {
        shouldShowWorkforce: isTeamStage,
        currentState: stateResult.currentState,
        completedStates: stateResult.completedStates,
        readinessScore: stateResult.readinessScore,
        missingRequirements: stateResult.missingRequirements,
        recommendedRoute: recommendedRouteFor(stateResult.currentState, stateResult.missingRequirements),
        requirements: [
          {
            id: 'revenueExists',
            label: 'Revenue Exists',
            completed: isTeamStage || completedLabels.has('SALES'),
            description: '已经完成第一位客户或第一笔成交，证明系统有真实结果可以复制。',
            route: '/sales',
          },
          {
            id: 'processDocumented',
            label: 'Process Documented',
            completed: !teamRequirements.some((item) => item.id === 'processDocumented') && isTeamStage,
            description: '内容、引流资源、漏斗、CRM、Sales 的做法已经整理成可重复步骤。',
            route: '/journey',
          },
          {
            id: 'delegationReady',
            label: 'Delegation Ready',
            completed: !teamRequirements.some((item) => item.id === 'delegationReady') && isTeamStage,
            description: '已经知道哪些工作可以交给 AI agent 或团队成员，而不是全部由创办人手动做。',
            route: '/journey',
          },
          {
            id: 'agentWorkforceActive',
            label: 'Agent Workforce Active',
            completed: !teamRequirements.some((item) => item.id === 'agentWorkforceActive') && isTeamStage,
            description: 'Content Agent、Lead Magnet Agent、Funnel Agent 至少进入可执行或已完成状态。',
            route: '/ai-workforce',
          },
          {
            id: 'humanTeamAdded',
            label: 'Human Team Added',
            completed: !teamRequirements.some((item) => item.id === 'humanTeamAdded') && isTeamStage,
            description: '已经邀请或加入第一位团队成员，开始从个人执行进入复制阶段。',
            route: '/ai-workforce',
          },
        ],
      },
    },
  });
});
