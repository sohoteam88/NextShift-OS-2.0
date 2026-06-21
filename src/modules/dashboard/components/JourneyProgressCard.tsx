import Link from 'next/link';
import { ArrowRight, Check, Circle, Flag, Sparkles } from 'lucide-react';
import type { DashboardProjection } from '../adapters/DashboardProjectionAdapter';

const STATUS_LABEL = {
  completed: 'Completed',
  current: 'Current',
  next: 'Next',
} as const;

type JourneyStatus = 'completed' | 'current' | 'next';

function journeyLabel(value: string) {
  return value.replace(/引流磁铁/g, '引流资源');
}

function statusClass(status: JourneyStatus) {
  if (status === 'completed')
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'current')
    return 'border-blue-300 bg-blue-50 text-blue-800 shadow-sm';
  return 'border-gray-300 bg-white text-gray-700';
}

export function buildJourneySteps(
  progressPath: DashboardProjection['progressPath'],
) {
  const completed = progressPath
    .filter((step) => step.status === 'completed')
    .slice(-2)
    .map((step) => ({
      label: journeyLabel(step.label),
      status: 'completed' as const,
    }));
  const currentIndex = progressPath.findIndex(
    (step) => step.status === 'current',
  );
  const currentStep =
    currentIndex >= 0
      ? progressPath[currentIndex]
      : progressPath.find((step) => step.status !== 'completed');
  const nextStep =
    currentIndex >= 0
      ? progressPath
          .slice(currentIndex + 1)
          .find((step) => step.status !== 'completed')
      : progressPath.find((step) => step.status === 'locked');
  const steps: Array<{ label: string; status: JourneyStatus }> = [];

  if (completed.length > 0) {
    steps.push({
      label: completed.map((step) => step.label).join(' + '),
      status: 'completed',
    });
  }

  if (currentStep) {
    steps.push({
      label: journeyLabel(currentStep.label),
      status: 'current',
    });
  }

  if (nextStep && steps.length < 3) {
    steps.push({
      label: journeyLabel(nextStep.label),
      status: 'next',
    });
  }

  return steps.slice(0, 3);
}

type JourneyProgressCardProps = {
  steps: Array<{
    label: string;
    status: JourneyStatus;
  }>;
};

export function JourneyProgressCard({ steps }: JourneyProgressCardProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Journey Snapshot
          </h2>
        </div>
        <Link
          href="/journey"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          查看 Journey <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        首页只显示最近完成、当前执行和下一步。完整路线、解锁条件和历史任务在
        Journey 页面处理。
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.slice(0, 3).map((step) => (
          <div
            key={`${step.status}-${step.label}`}
            className={`rounded-[var(--radius-md)] border p-4 ${statusClass(step.status)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">
                {STATUS_LABEL[step.status]}
              </span>
              {step.status === 'completed' ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : null}
              {step.status === 'current' ? (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              ) : null}
              {step.status === 'next' ? (
                <Circle className="h-4 w-4" aria-hidden="true" />
              ) : null}
            </div>
            <p className="mt-3 text-sm font-semibold">{step.label}</p>
            <p className="mt-2 text-xs leading-relaxed">
              {step.status === 'completed'
                ? '已经成为 AI COO 的判断基础。'
                : step.status === 'current'
                  ? '现在只专注推进这一项。'
                  : '完成当前任务后才展开。'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
