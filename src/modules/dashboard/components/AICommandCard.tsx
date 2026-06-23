import Link from 'next/link';
import { ArrowRight, Check, Clock3, Route, Sparkles, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FirstUserExperienceProjection } from '@/modules/product-experience/services/FirstUserExperienceService';
import type { UserSuccessProjection } from '@/modules/user-success/contracts/UserSuccessProjection';

export type DashboardPriorityLevel = 'Critical' | 'High' | 'Normal';

type AICommandCardProps = {
  completedItems: string[];
  currentGap: string;
  todayMission: string;
  missionDescription: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    required: boolean;
  }>;
  currentStep: {
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    required: boolean;
  } | null;
  progress: number;
  passedChecks: string[];
  remainingChecks: number;
  nextRequiredCheck: string | null;
  verificationStatus: 'VERIFIED' | 'VERIFYING' | 'BLOCKED';
  missionReason: string;
  whyNow: string;
  decisionReason: string;
  nextMilestone: string;
  priorityLevel: DashboardPriorityLevel;
  estimatedTime: string;
  expectedOutcome: string;
  firstUserExperience?: FirstUserExperienceProjection;
  userSuccess?: UserSuccessProjection;
  executeRoute: string;
  primaryActionLabel?: string;
};

function priorityClass(priorityLevel: DashboardPriorityLevel) {
  if (priorityLevel === 'Critical')
    return 'border-red-100 bg-red-50 text-red-800';
  if (priorityLevel === 'High')
    return 'border-amber-100 bg-amber-50 text-amber-800';
  return 'border-blue-100 bg-blue-50 text-blue-800';
}

function priorityLabel(priorityLevel: DashboardPriorityLevel) {
  if (priorityLevel === 'Critical') return '紧急';
  if (priorityLevel === 'High') return '高';
  return '普通';
}

export function AICommandCard({
  completedItems,
  currentGap,
  todayMission,
  missionDescription,
  steps,
  currentStep,
  progress,
  passedChecks,
  remainingChecks,
  nextRequiredCheck,
  verificationStatus,
  missionReason,
  whyNow,
  decisionReason,
  nextMilestone,
  priorityLevel,
  estimatedTime,
  expectedOutcome,
  firstUserExperience,
  userSuccess,
  executeRoute,
  primaryActionLabel = '开始任务',
}: AICommandCardProps) {
  const activationT = useTranslations('activation.dashboard');
  const successT = useTranslations('success.dashboard');

  return (
    <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="flex min-h-[380px] flex-col justify-between gap-7 p-5 md:p-7">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Your next step
            </div>
            {firstUserExperience ? (
              <p className="mb-3 text-sm font-semibold text-emerald-700">
                {firstUserExperience.headline}
              </p>
            ) : null}
            <p className="text-sm font-semibold text-blue-700">
              今天先做这一件事。
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl">
              {todayMission}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {missionDescription}
            </p>
          </div>

          <div>
            <div className="space-y-4 border-l-2 border-blue-100 pl-4">
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  为什么是这个
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {missionReason}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  为什么现在
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {whyNow}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  为什么不是其他任务
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {decisionReason}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    当前步骤
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                    {currentStep ? currentStep.title : '任务完成验证中'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-blue-700">
                  {progress}% 完成
                </p>
              </div>
              <div className="mt-3 grid gap-2 text-xs font-semibold text-blue-800 sm:grid-cols-3">
                <div className="rounded-[var(--radius-sm)] border border-blue-100 bg-white px-3 py-2">
                  已验证 {passedChecks.length}
                </div>
                <div className="rounded-[var(--radius-sm)] border border-blue-100 bg-white px-3 py-2">
                  剩余 {remainingChecks}
                </div>
                <div className="rounded-[var(--radius-sm)] border border-blue-100 bg-white px-3 py-2">
                  {verificationStatus === 'VERIFYING' ? '验证中' : verificationStatus === 'VERIFIED' ? '已验证' : '待补齐'}
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                />
              </div>
              {nextRequiredCheck ? (
                <p className="mt-3 text-xs font-semibold text-blue-800">
                  下一个验证项：{nextRequiredCheck}
                </p>
              ) : null}
              {currentStep ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {currentStep.description}
                </p>
              ) : null}
            </div>
            {firstUserExperience ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-emerald-700">{activationT('firstValue')}</p>
                    <p className="mt-1 text-sm font-semibold">{firstUserExperience.firstValueMoment.label}</p>
                  </div>
                  <p className="text-sm font-bold">{firstUserExperience.progressPercent}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${Math.max(0, Math.min(firstUserExperience.progressPercent, 100))}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-2 text-xs font-semibold sm:grid-cols-2">
                  <div className="rounded-[var(--radius-sm)] border border-emerald-100 bg-white px-3 py-2">
                    {activationT('state')}: {firstUserExperience.activationStatus.stateLabel}
                  </div>
                  <div className="rounded-[var(--radius-sm)] border border-emerald-100 bg-white px-3 py-2">
                    {firstUserExperience.activationStatus.hoursRemaining === null
                      ? activationT('noTimer')
                      : activationT('hoursLeft', { hours: firstUserExperience.activationStatus.hoursRemaining })}
                  </div>
                </div>
              </div>
            ) : null}
            {userSuccess ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-sky-100 bg-sky-50 p-4 text-sky-950">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-sky-700">{successT('currentOutcome')}</p>
                    <p className="mt-1 text-sm font-semibold">{userSuccess.currentOutcome.label}</p>
                  </div>
                  <p className="text-sm font-bold">{userSuccess.successState.progressPercentage}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
                  <div
                    className="h-full rounded-full bg-sky-600"
                    style={{ width: `${Math.max(0, Math.min(userSuccess.successState.progressPercentage, 100))}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-2 text-xs font-semibold sm:grid-cols-3">
                  <div className="rounded-[var(--radius-sm)] border border-sky-100 bg-white px-3 py-2">
                    {successT('progress')}: {userSuccess.outcomeProgress.successProgressPercentage}%
                  </div>
                  <div className="rounded-[var(--radius-sm)] border border-sky-100 bg-white px-3 py-2">
                    {successT('currentResult')}: {userSuccess.currentOutcome.currentResult}
                  </div>
                  <div className="rounded-[var(--radius-sm)] border border-sky-100 bg-white px-3 py-2">
                    {successT('nextMilestone')}: {userSuccess.currentOutcome.nextMilestone}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={executeRoute}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {primaryActionLabel}{' '}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {estimatedTime}
              </div>
            </div>
          </div>
        </div>

        <aside className="border-t border-blue-100 bg-blue-50/40 p-5 lg:border-l lg:border-t-0 md:p-6">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-emerald-700">已完成</p>
              <div className="mt-3 space-y-2">
                {completedItems.length > 0 ? (
                  completedItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-sm font-semibold text-emerald-950"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-emerald-950">
                    系统正在确认你的业务基础。
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-blue-100" />

            <div>
              <p className="text-xs font-semibold text-blue-700">执行步骤</p>
              <div className="mt-3 space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">
                        {step.title}
                      </p>
                      <p className="mt-1 leading-relaxed text-[var(--color-text-muted)]">
                        {step.estimatedMinutes} 分钟
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-blue-100" />

            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-[var(--radius-md)] border p-3 ${priorityClass(priorityLevel)}`}
              >
                <p className="text-xs font-semibold">优先级</p>
                <p className="mt-2 text-xl font-bold">
                  {priorityLabel(priorityLevel)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-3 text-red-800">
                <p className="text-xs font-semibold">当前缺口</p>
                <p className="mt-2 text-sm font-bold leading-snug">
                  {currentGap}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Target
                  className="h-4 w-4 text-emerald-700"
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold text-emerald-700">
                  预期结果
                </p>
              </div>
              <p className="mt-2 text-base font-semibold text-emerald-950">
                {expectedOutcome}
              </p>
            </div>

            <div className="h-px bg-blue-100" />

            <div>
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <p className="text-xs font-semibold text-blue-700">
                  下一里程碑
                </p>
              </div>
              <div className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
                <p>
                  <span className="font-semibold text-[var(--color-text)]">
                    {nextMilestone}
                  </span>
                </p>
                <p>
                  先完成当前这一步，再推进下一阶段的业务结果。
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
