import Link from 'next/link';
import { ArrowRight, Bot, Check, Clock3, Target } from 'lucide-react';

export type DashboardPriorityLevel = 'Critical' | 'High' | 'Normal';

type AICommandCardProps = {
  completedItems: string[];
  currentGap: string;
  todayMission: string;
  missionReason: string;
  decisionReason: string;
  priorityLevel: DashboardPriorityLevel;
  estimatedTime: string;
  expectedOutcome: string;
  executeRoute: string;
};

function priorityClass(priorityLevel: DashboardPriorityLevel) {
  if (priorityLevel === 'Critical') return 'border-red-100 bg-red-50 text-red-800';
  if (priorityLevel === 'High') return 'border-amber-100 bg-amber-50 text-amber-800';
  return 'border-blue-100 bg-blue-50 text-blue-800';
}

export function AICommandCard({
  completedItems,
  currentGap,
  todayMission,
  missionReason,
  decisionReason,
  priorityLevel,
  estimatedTime,
  expectedOutcome,
  executeRoute,
}: AICommandCardProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white p-5 shadow-sm md:p-6">
      <div className="grid gap-5 md:grid-cols-[1.25fr_0.75fr] md:items-stretch">
        <div className="flex min-h-[300px] flex-col justify-between gap-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Bot className="h-4 w-4" aria-hidden="true" />
              AI COO Command Center
            </div>
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Recommended Next Action</p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)] md:text-3xl">{todayMission}</h1>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-blue-700">Why this, why now</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {missionReason}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {decisionReason}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              I am not prioritizing lower leverage work until this gap is closed, because it would not move the business toward the expected outcome as directly.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={executeRoute}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Start Mission <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {estimatedTime}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">Completed</p>
            <div className="mt-3 space-y-2">
              {completedItems.length > 0 ? completedItems.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm font-semibold text-emerald-950">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              )) : (
                <p className="text-sm font-medium text-emerald-950">Business foundation is still being assessed.</p>
              )}
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase text-red-700">Current Gap</p>
            <p className="mt-2 text-base font-semibold text-red-950">{currentGap}</p>
          </div>
          <div className={`rounded-[var(--radius-md)] border p-4 ${priorityClass(priorityLevel)}`}>
            <p className="text-xs font-semibold uppercase">Priority</p>
            <p className="mt-2 text-2xl font-bold">{priorityLevel}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase text-emerald-700">Expected Outcome</p>
            </div>
            <p className="mt-2 text-base font-semibold text-emerald-950">{expectedOutcome}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
