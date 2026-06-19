import { Check, Flag, Sparkles } from 'lucide-react';
import type { DashboardProjection } from '../adapters/DashboardProjectionAdapter';

const STATUS_LABEL = {
  completed: '已完成',
  current: '当前',
  locked: '未解锁',
} as const;

const JOURNEY_LABELS = [
  '品牌基础',
  '品牌定位',
  '内容系统',
  '引流磁铁',
  '漏斗',
  '潜在客户',
  '销售',
  '团队',
];

type JourneyStatus = DashboardProjection['progressPath'][number]['status'];

function statusClass(status: JourneyStatus) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'current') return 'border-blue-300 bg-blue-50 text-blue-800 shadow-sm';
  return 'border-gray-200 bg-gray-50 text-gray-500';
}

export function buildJourneySteps(progressPath: DashboardProjection['progressPath']) {
  return JOURNEY_LABELS.map((label, index) => ({
    label,
    status: progressPath[index]?.status ?? 'locked',
  }));
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
      <div className="mb-4 flex items-center gap-2">
        <Flag className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">成长旅程</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.label} className={`min-h-24 rounded-[var(--radius-md)] border p-3 ${statusClass(step.status)}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">步骤 {index + 1}</span>
              {step.status === 'completed' ? <Check className="h-4 w-4" /> : null}
              {step.status === 'current' ? <Sparkles className="h-4 w-4" /> : null}
            </div>
            <p className="mt-3 text-sm font-semibold">{step.label}</p>
            <p className="mt-1 text-xs">{STATUS_LABEL[step.status]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
