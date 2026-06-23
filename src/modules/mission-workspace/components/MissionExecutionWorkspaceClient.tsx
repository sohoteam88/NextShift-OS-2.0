'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Clock3, FileText, Loader2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { MissionExecutionWorkspace, MissionWorkspaceStep } from '../services/MissionExecutionWorkspaceService';

type MissionExecutionWorkspaceClientProps = {
  missionId: string;
};

async function readJson<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) throw new Error(message);
  return res.json() as Promise<T>;
}

function stateLabel(state: MissionWorkspaceStep['state']) {
  if (state === 'COMPLETED') return '已完成';
  if (state === 'IN_PROGRESS') return '进行中';
  if (state === 'BLOCKED') return '受阻';
  return '未开始';
}

function statusClass(status: string) {
  if (status === 'ready' || status === 'generated' || status === 'READY' || status === 'APPROVED' || status === 'COMPLETED' || status === 'VERIFIED')
    return 'border-emerald-100 bg-emerald-50 text-emerald-800';
  if (status === 'BLOCKED' || status === 'FAILED' || status === 'ARCHIVED')
    return 'border-red-100 bg-red-50 text-red-800';
  if (status === 'VERIFYING' || status === 'IN_PROGRESS' || status === 'DRAFT')
    return 'border-blue-100 bg-blue-50 text-blue-800';
  if (status === 'WAITING' || status === 'QUEUED' || status === 'LOCKED' || status === 'PLANNED')
    return 'border-amber-100 bg-amber-50 text-amber-800';
  if (status === 'ACTIVE')
    return 'border-blue-100 bg-blue-50 text-blue-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function MissionExecutionWorkspaceClient({ missionId }: MissionExecutionWorkspaceClientProps) {
  const queryClient = useQueryClient();
  const workspace = useQuery({
    queryKey: ['mission-workspace', missionId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/mission/workspace/${encodeURIComponent(missionId)}`);
      const json = await readJson<{ data: MissionExecutionWorkspace }>(res, 'Failed to load mission workspace');
      return json.data;
    },
    staleTime: 15_000,
  });

  const completeStep = useMutation({
    mutationFn: async (stepCheckKey: string) => {
      const res = await fetch('/api/v1/mission/complete-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_key: stepCheckKey }),
      });
      return readJson(res, 'Failed to complete step');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mission-workspace', missionId] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-projection'] });
    },
  });

  const agentAssist = useMutation({
    mutationFn: async (input: { agentId: string; actionId: string }) => {
      const res = await fetch('/api/v1/mission/agent-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          agentId: input.agentId,
          actionId: input.actionId,
        }),
      });
      return readJson(res, 'Failed to run agent action');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mission-workspace', missionId] });
    },
  });

  const assetStatus = useMutation({
    mutationFn: async (input: { assetId: string; status: 'READY' | 'APPROVED' | 'ARCHIVED' }) => {
      const res = await fetch('/api/v1/mission/asset-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          assetId: input.assetId,
          status: input.status,
        }),
      });
      return readJson(res, 'Failed to update asset');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mission-workspace', missionId] });
    },
  });

  if (workspace.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 pb-8">
        <div className="h-56 animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-96 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
          <div className="h-96 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        </div>
      </div>
    );
  }

  if (workspace.isError || !workspace.data) {
    return (
      <section className="mx-auto max-w-4xl rounded-[var(--radius-lg)] border border-red-200 bg-white p-6">
        <p className="text-sm font-semibold text-red-700">Mission Workspace unavailable</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">无法打开这个任务工作区。</h1>
        <Link href="/dashboard" className="mt-5 inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white">
          回到 Dashboard
        </Link>
      </section>
    );
  }

  const data = workspace.data;
  const currentWorkforceAssignment = data.workforcePlan.agents.find((assignment) => (
    assignment.assignmentId === data.workforcePlan.currentAssignmentId
  ));
  const workforceAgentNamesById = new Map(data.workforcePlan.agents.map((assignment) => [
    assignment.assignmentId,
    assignment.agentName,
  ]));
  const outcomeMissionNamesById = new Map(data.businessOutcome.missions.map((mission) => [
    mission.missionId,
    mission.name,
  ]));
  const currentOutcomeMission = data.businessOutcome.missions.find((mission) => (
    mission.missionId === data.businessOutcome.currentMissionId
  ));
  const nextOutcomeMission = data.businessOutcome.missions.find((mission) => (
    mission.missionId === data.businessOutcome.nextMissionId
  ));

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-blue-700">Mission Workspace</p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal text-[var(--color-text)] md:text-3xl">
              {data.objective}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {data.description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:w-[420px]">
            <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-3 text-blue-800">
              <p className="text-xs font-semibold">类型</p>
              <p className="mt-2 font-bold">{data.missionType}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-amber-100 bg-amber-50 p-3 text-amber-800">
              <p className="text-xs font-semibold">优先级</p>
              <p className="mt-2 font-bold">{data.priority}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3 text-slate-700">
              <p className="text-xs font-semibold">时间</p>
              <p className="mt-2 font-bold">{data.estimatedTime} 分钟</p>
            </div>
            <div className={`rounded-[var(--radius-md)] border p-3 ${statusClass(data.verificationStatus)}`}>
              <p className="text-xs font-semibold">验证</p>
              <p className="mt-2 font-bold">{data.verificationStatus}</p>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm font-semibold text-blue-800">
            <span>{data.progress.completionPercentage}% 完成</span>
            <span>{data.progress.completedSteps} / {data.steps.length} 步骤</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(data.progress.completionPercentage, 100))}%` }} />
          </div>
        </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-blue-700">Business Goal</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--color-text)]">{data.businessOutcome.name}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(data.businessOutcome.status)}`}>
                  {data.businessOutcome.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{data.businessOutcome.description}</p>
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                {data.firstUserExperience.headline}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs lg:w-[380px]">
              <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-3 text-blue-800">
                <p className="font-semibold">Progress</p>
                <p className="mt-1 text-xl font-bold">{data.businessOutcome.completionPercentage}%</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3 text-slate-700">
                <p className="font-semibold">Proof</p>
                <p className="mt-1 break-words text-sm font-bold">
                  {data.businessOutcome.requiredSignal.label}: {String(data.businessOutcome.requiredSignal.currentValue ?? 'pending')}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(data.businessOutcome.completionPercentage, 100))}%` }} />
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Current Mission</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--color-text)]">{currentOutcomeMission?.name ?? 'None'}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Next Mission</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--color-text)]">{nextOutcomeMission?.name ?? 'None'}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Blocked Missions</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--color-text)]">{data.businessOutcome.blockedMissionIds.length}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {data.businessOutcome.missions.map((mission) => (
              <div key={mission.missionId} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{mission.name}</p>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(mission.status)}`}>
                    {mission.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">{mission.completionPercentage}% complete</p>
                <p className="mt-2 break-words text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Depends:</span> {mission.dependsOn.map((id) => outcomeMissionNamesById.get(id) ?? id).join(', ') || 'None'}
                </p>
              </div>
            ))}
          </div>
          {!data.firstUserExperience.firstValueMoment.achieved ? (
            <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="text-sm font-semibold">No asset yet</p>
              <p className="mt-1 text-sm leading-relaxed">Generate the first useful draft so this mission creates visible value within minutes.</p>
            </div>
          ) : null}
        </section>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-700">Mission Steps</p>
              <h2 className="mt-1 text-lg font-bold text-[var(--color-text)]">执行步骤</h2>
            </div>
            <Link href={data.sourceRoute} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-blue-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              打开工具 <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {data.steps.map((step, index) => (
              <div key={step.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[var(--color-text)]">{step.title}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(step.state)}`}>
                          {stateLabel(step.state)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{step.description}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {step.estimatedMinutes} 分钟
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={step.state === 'COMPLETED' || completeStep.isPending}
                    onClick={() => completeStep.mutate(step.stepCheckKey)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    完成步骤
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-lg font-bold text-[var(--color-text)]">Required Assets</h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.requiredAssets.map((asset) => (
                <div key={asset.id} className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{asset.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{asset.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-lg font-bold text-[var(--color-text)]">Generated Assets</h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.generatedAssets.map((asset) => (
                <div key={asset.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{asset.title}</p>
                      {asset.assetType ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">{asset.assetType}</p>
                      ) : null}
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{asset.description}</p>
                  {asset.generatedBy ? (
                    <p className="mt-2 text-xs font-semibold text-blue-700">
                      {asset.generatedBy}{asset.createdAt ? ` · ${new Date(asset.createdAt).toLocaleString()}` : ''}
                    </p>
                  ) : null}
                  {asset.preview || asset.content ? (
                    <details className="mt-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-700">Preview</summary>
                      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                        {asset.content ?? asset.preview}
                      </pre>
                    </details>
                  ) : null}
                  {asset.outputLevel === 'DRAFT_ASSET' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={assetStatus.isPending || asset.status === 'READY' || asset.status === 'APPROVED'}
                        onClick={() => assetStatus.mutate({ assetId: asset.id, status: 'READY' })}
                        className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-blue-200 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        Mark Ready
                      </button>
                      <button
                        type="button"
                        disabled={assetStatus.isPending || asset.status === 'APPROVED'}
                        onClick={() => assetStatus.mutate({ assetId: asset.id, status: 'APPROVED' })}
                        className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={assetStatus.isPending}
                        onClick={() => assetStatus.mutate({ assetId: asset.id, status: 'ARCHIVED' })}
                        className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        Archive
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-lg font-bold text-[var(--color-text)]">Helper Team</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-3 text-blue-800">
                <p className="font-semibold">Plan</p>
                <p className="mt-1 text-sm font-bold">{data.workforcePlan.mode === 'parallel' ? 'Work together' : data.workforcePlan.mode === 'sequential' ? 'Step by step' : 'Mixed'}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3 text-slate-700">
                <p className="font-semibold">Current helper</p>
                <p className="mt-1 text-sm font-bold">{currentWorkforceAssignment?.agentName ?? 'None'}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.workforcePlan.agents.map((assignment) => (
                <div key={assignment.assignmentId} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{assignment.agentName}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{assignment.task}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600">
                    <p className="break-words"><span className="font-semibold text-slate-700">Depends:</span> {assignment.dependsOn.map((id) => workforceAgentNamesById.get(id) ?? id).join(', ') || 'None'}</p>
                    <p className="break-words"><span className="font-semibold text-slate-700">Outputs:</span> {assignment.outputAssetIds.length ? assignment.outputAssetIds.join(', ') : 'None yet'}</p>
                    {assignment.handoffFrom.length ? (
                      <p className="break-words"><span className="font-semibold text-slate-700">Uses:</span> {assignment.handoffFrom.join(', ')}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-lg font-bold text-[var(--color-text)]">Agent Support</h2>
            </div>
            {data.recommendedAgent ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold uppercase text-blue-700">Recommended Agent</p>
                <p className="mt-1 text-sm font-bold text-blue-900">{data.recommendedAgent.name}</p>
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {data.agentSupport.map((agent) => (
                <div key={agent.id} className="rounded-[var(--radius-md)] border border-blue-100 p-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{agent.name}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{agent.description}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.actions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        disabled={agentAssist.isPending}
                        onClick={() => agentAssist.mutate({ agentId: agent.id, actionId: action.id })}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-blue-200 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {agentAssist.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[var(--color-text)]">Completion Verification</h2>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <p className="text-xs font-semibold">Passed Checks</p>
            <p className="mt-2 text-2xl font-bold">{data.completion.passedChecks.length}</p>
            <p className="mt-2 text-xs leading-relaxed">{data.completion.passedChecks.join(', ') || 'None yet'}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4 text-red-800">
            <p className="text-xs font-semibold">Failed Checks</p>
            <p className="mt-2 text-2xl font-bold">{data.completion.failedChecks.length}</p>
            <p className="mt-2 text-xs leading-relaxed">{data.completion.failedChecks.join(', ') || 'None'}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-4 text-blue-800">
            <p className="text-xs font-semibold">Next Milestone</p>
            <p className="mt-2 text-lg font-bold">{data.nextMilestone}</p>
            <p className="mt-2 text-xs leading-relaxed">Next required check: {data.completion.nextRequiredCheck ?? 'Ready for next mission'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
