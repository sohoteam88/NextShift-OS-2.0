'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Route,
  Search,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import type {
  WorkspaceCommandData,
  WorkspaceMemberHealth,
} from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { MemberInvitePanel } from '@/modules/member/components/MemberInvitePanel';
import { useFormatters } from './helpers';

function priorityTone(priority: WorkspaceMemberHealth['priority']) {
  if (priority === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (priority === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function priorityLabel(priority: WorkspaceMemberHealth['priority']) {
  if (priority === 'critical') return 'Critical';
  if (priority === 'high') return 'High';
  return 'Normal';
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
    neutral: 'border-blue-100 bg-blue-50 text-blue-700',
    good: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-100 bg-amber-50 text-amber-700',
    danger: 'border-rose-100 bg-rose-50 text-rose-700',
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

function MemberActionCard({ member }: { member: WorkspaceMemberHealth }) {
  const { formatDate } = useFormatters();
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_140px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityTone(member.priority)}`}
            >
              {priorityLabel(member.priority)}
            </span>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              {member.name}
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {member.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {member.email}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text)]">
            当前卡在 <strong>{member.currentStage}</strong>，需要完成：
            {member.missingRequirement}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${member.journeyProgress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            旧进度参考：{member.journeyProgress}% · 最后活跃 {formatDate(member.lastActiveAt)}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Admin 建议动作
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {member.recommendedAction}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
            {member.inactiveDays} 天没有推进。先确认用户是否理解当前步骤，再引导回系统任务。
          </p>
        </div>

        <Link
          href={member.recommendedRoute}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          打开步骤
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function RouteDistribution({ data }: { data: WorkspaceCommandData }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            用户卡点分布
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            根据 11 步执行路线整理，不再使用旧阶段模板。
          </p>
        </div>
        <Route className="h-5 w-5 text-blue-600" aria-hidden="true" />
      </div>

      <div className="mt-4 space-y-3">
        {data.execution.steps
          .filter((step) => step.users > 0 || step.blocked > 0)
          .map((step) => (
            <div key={step.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--color-text)]">
                  {step.order}. {step.label}
                </span>
                <span className="text-[var(--color-text-muted)]">
                  {step.users} 当前 · {step.blocked} 卡住
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.min(100, step.users * 20)}%` }}
                />
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

export function AdminMembersCenter({
  data,
  role,
}: {
  data: WorkspaceCommandData;
  role: string;
}) {
  const priorityMembers = data.members
    .filter((member) => member.priority !== 'normal' || member.needsHelp)
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, normal: 2 };
      return rank[a.priority] - rank[b.priority] || b.inactiveDays - a.inactiveDays;
    });
  const activeMembers = data.members.filter((member) => member.inactiveDays <= 7);
  const aiInterviewUsers = data.members.filter((member) => member.currentStepId === 'brand_interview');
  const contentPlanUsers = data.members.filter((member) => member.currentStepId === 'content_engine');
  const readyMembers = data.members.filter((member) => !member.needsHelp);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Member Operations"
        title="成员执行队列"
        description="按系统路线判断每个用户卡在哪里、缺什么、管理员今天应该先处理谁。"
        action={(
          <Link
            href="#priority-members"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
          >
            处理高优先用户
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      />

      <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              <Search className="h-4 w-4" aria-hidden="true" />
              今日成员判断
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">
              先处理 {priorityMembers.length} 个卡住用户
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              这页不是通讯录。它的目的，是让 admin 看到谁没有继续推进系统步骤，并快速把用户带回正确的执行动作。
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            返回控制台
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Members"
          value={activeMembers.length}
          helper="7 天内有推进或活动的成员。"
          icon={UserRoundCheck}
          tone="good"
        />
        <StatCard
          label="Need Intervention"
          value={priorityMembers.length}
          helper="需要 admin 主动检查当前步骤。"
          icon={AlertTriangle}
          tone={priorityMembers.length > 0 ? 'warning' : 'good'}
        />
        <StatCard
          label="Still At Interview"
          value={aiInterviewUsers.length}
          helper="还没有完成 AI 访谈或 Brand DNA 起点。"
          icon={Clock3}
          tone={aiInterviewUsers.length > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          label="Waiting Content Plan"
          value={contentPlanUsers.length}
          helper="Brand DNA 后还没有生成内容系统。"
          icon={ShieldCheck}
          tone={contentPlanUsers.length > 0 ? 'warning' : 'neutral'}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-2 text-blue-700">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                成员管理入口
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                新成员从邀请链接进入工作区，完成加入后再进入用户执行路线。这里保留邀请链接、分享和重新生成动作，避免 admin 需要回到用户端 Team 页面。
              </p>
            </div>
          </div>
        </section>
        <MemberInvitePanel
          role={role as 'member' | 'leader' | 'operator' | 'platform_admin'}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section
          id="priority-members"
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                高优先成员
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Critical 和 High 会排在最前面。
              </p>
            </div>
            <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {priorityMembers.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                目前没有高优先成员。可以查看下方所有成员，确认路线分布是否健康。
              </div>
            ) : (
              priorityMembers.map((member) => (
                <MemberActionCard key={member.id} member={member} />
              ))
            )}
          </div>
        </section>

        <RouteDistribution data={data} />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              所有成员状态
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              已稳定推进的成员放在这里，避免干扰今日处理队列。
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {readyMembers.length} 正常
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.members.map((member) => (
            <div
              key={member.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {member.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {member.email}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityTone(member.priority)}`}
                >
                  {priorityLabel(member.priority)}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-text)]">
                {member.currentStage}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                {member.missingRequirement}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
