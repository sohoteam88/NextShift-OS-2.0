'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crown,
  Route,
  ShieldAlert,
  UserRoundCheck,
  Users,
  Zap,
} from 'lucide-react';
import type {
  WorkspaceCommandData,
  WorkspaceExecutionStep,
  WorkspacePriorityUser,
} from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';

function priorityTone(priority: WorkspacePriorityUser['priority']) {
  if (priority === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (priority === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function stepTone(step: WorkspaceExecutionStep) {
  if (step.blocked > 0) return 'border-amber-200 bg-amber-50';
  if (step.users > 0) return 'border-blue-200 bg-blue-50';
  return 'border-[var(--color-border)] bg-white';
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  helper: string;
  icon: typeof Users;
  tone?: 'neutral' | 'good' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'text-blue-700 bg-blue-50 border-blue-100',
    good: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    warning: 'text-amber-700 bg-amber-50 border-amber-100',
    danger: 'text-rose-700 bg-rose-50 border-rose-100',
  }[tone];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          {label}
        </p>
        <span className={`rounded-[var(--radius-md)] border p-2 ${toneClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
        {helper}
      </p>
    </div>
  );
}

function PriorityQueue({ users }: { users: WorkspacePriorityUser[] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            成员介入队列
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            按成员卡点和未活动时间排序，帮助 operator 先处理最需要协助的人。
          </p>
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
      </div>

      <div className="mt-4 divide-y divide-[var(--color-border)]">
        {users.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            暂时没有需要人工介入的成员。继续观察工作区健康。
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="grid gap-3 py-3 md:grid-cols-[1fr_160px_120px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityTone(user.priority)}`}
                  >
                    {user.priority === 'critical' ? 'Critical' : 'High'}
                  </span>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {user.name}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {user.email}
                </p>
                <p className="mt-2 text-sm text-[var(--color-text)]">
                  卡在 {user.currentStep}：{user.missingRequirement}
                </p>
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">
                <p className="font-semibold text-[var(--color-text)]">
                  {user.inactiveDays} 天未动
                </p>
                <p className="mt-1">{user.recommendedAction}</p>
              </div>
              <Link
                href="/admin/members"
                className="inline-flex h-10 items-center justify-center gap-2 self-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                查看成员
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function MemberProgressDistribution({ steps }: { steps: WorkspaceExecutionStep[] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            成员推进分布
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            这是 operator 的团队视角：看成员集中卡在哪个业务环节，而不是给 admin 安排个人执行路线。
          </p>
        </div>
        <Route className="h-5 w-5 text-blue-600" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3">
        {steps.map((step) => {
          const total = Math.max(1, step.users + step.completed);
          const completedPercent = Math.round((step.completed / total) * 100);
          return (
            <div
              key={step.id}
              className={`rounded-[var(--radius-md)] border p-4 ${stepTone(step)}`}
            >
              <div className="grid gap-3 md:grid-cols-[44px_1fr_180px] md:items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--color-text)] shadow-sm">
                  {step.users}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">
                      {step.label}
                    </h3>
                    {step.blocked > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {step.blocked} 卡住
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                    {step.outcome}
                  </p>
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  <div className="flex justify-between">
                    <span>当前成员</span>
                    <strong className="text-[var(--color-text)]">
                      {step.users}
                    </strong>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${completedPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs">{step.completed} 已完成</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AdminOverview({
  data,
  isPlatformAdmin = false,
}: {
  data: WorkspaceCommandData;
  isPlatformAdmin?: boolean;
}) {
  const hasPriorityUsers = data.execution.priorityUsers.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace Operations"
        title="Workspace Operator Console"
        description="管理一个工作区或团队：查看成员卡点、系统异常、内容/漏斗/Leads 状态，并决定今天需要人工介入哪里。"
        action={(
          <div className="flex flex-wrap items-center gap-2">
            {isPlatformAdmin ? (
              <Link
                href="/platform-admin"
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" />
                Founder Platform
              </Link>
            ) : null}
            <Link
              href={data.execution.primaryActionHref}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              {data.execution.primaryAction}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      />

      <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              <Zap className="h-4 w-4" aria-hidden="true" />
              今日工作区判断
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-normal text-[var(--color-text)]">
              目前最多成员卡在 {data.execution.currentStep}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              先处理最影响成员推进的卡点，再看 leads、CRM 和 sales
              数据。这个后台不是用户首页，而是 operator 管理团队和工作区健康的控制台。
            </p>
          </div>
          <Link
            href={data.execution.primaryActionHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {data.execution.primaryAction}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {isPlatformAdmin ? (
            <Link
              href="/platform-admin"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Crown className="h-4 w-4" aria-hidden="true" />
              打开 Founder Platform Console
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Members"
          value={data.execution.activeUsers}
          helper="最近 7 天有推进动作的成员。"
          icon={UserRoundCheck}
          tone="good"
        />
        <StatCard
          label="Members Stuck"
          value={data.execution.usersStuck}
          helper="超过 3 天没有推进当前业务环节。"
          icon={Clock3}
          tone={hasPriorityUsers ? 'warning' : 'good'}
        />
        <StatCard
          label="Mission Engine Failures"
          value={data.execution.missionEngineFailures}
          helper="AI COO 无法判断成员下一步时必须优先处理。"
          icon={ShieldAlert}
          tone={data.execution.missionEngineFailures > 0 ? 'danger' : 'neutral'}
        />
        <StatCard
          label="Leads Unfollowed"
          value={data.execution.leadsUnfollowed}
          helper="团队已有 leads 但尚未跟进，容易流失。"
          icon={Users}
          tone={data.execution.leadsUnfollowed > 0 ? 'warning' : 'neutral'}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PriorityQueue users={data.execution.priorityUsers} />

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                工作区结果信号
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                这些是结果，不是首页的主要决策入口。
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['成员', data.overview.totalMembers],
              ['漏斗', data.overview.funnels],
              ['Leads', data.overview.leads],
              ['客户', data.overview.customers],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/content"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            >
              内容中心
            </Link>
            <Link
              href="/admin/funnels"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            >
              漏斗中心
            </Link>
            <Link
              href="/admin/operations"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
            >
              今日任务
            </Link>
          </div>
        </section>
      </section>

      <MemberProgressDistribution steps={data.execution.steps} />
    </div>
  );
}
