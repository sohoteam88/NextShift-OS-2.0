import Link from 'next/link';
import { ArrowRight, Bot, Clock3, Gauge, Target } from 'lucide-react';

type AICommandCardProps = {
  currentStage: string;
  currentBottleneck: string;
  todayMission: string;
  missionReason: string;
  estimatedTime: string;
  expectedOutcome: string;
  confidenceLevel: string;
  executeRoute: string;
};

export function AICommandCard({
  currentStage,
  currentBottleneck,
  todayMission,
  missionReason,
  estimatedTime,
  expectedOutcome,
  confidenceLevel,
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
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Current Stage</p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)] md:text-3xl">{currentStage}</h1>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-blue-700">Today&apos;s Mission</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">{todayMission}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {missionReason}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={executeRoute}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Execute Mission <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {estimatedTime}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase text-red-700">Current Bottleneck</p>
            <p className="mt-2 text-base font-semibold text-red-950">{currentBottleneck}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase text-emerald-700">Expected Outcome</p>
            </div>
            <p className="mt-2 text-base font-semibold text-emerald-950">{expectedOutcome}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase text-blue-700">Confidence</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-950">{confidenceLevel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
