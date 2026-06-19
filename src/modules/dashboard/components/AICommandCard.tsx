import Link from 'next/link';
import { ArrowRight, Bot, Clock3 } from 'lucide-react';

type AICommandCardProps = {
  currentStage: string;
  bottleneck: string;
  missionTitle: string;
  missionReason: string;
  estimatedTime: string;
  expectedOutcome: string;
  executeRoute: string;
  decisionTitle: string;
  decisionReason: string;
  successMetric: string;
};

export function AICommandCard({
  currentStage,
  bottleneck,
  missionTitle,
  missionReason,
  estimatedTime,
  expectedOutcome,
  executeRoute,
  decisionTitle,
  decisionReason,
  successMetric,
}: AICommandCardProps) {
  return (
    <section className="min-h-[420px] rounded-[var(--radius-lg)] border border-blue-200 bg-white p-6 shadow-sm md:p-8">
      <div className="grid h-full gap-6 md:grid-cols-[1.35fr_0.65fr] md:items-stretch">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Bot className="h-4 w-4" />
              AI COO Command Center
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">当前阶段</p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--color-text)] md:text-4xl">{currentStage}</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase text-red-700">当前瓶颈</p>
                <p className="mt-2 text-base font-semibold text-red-950">{bottleneck}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-700">预期结果</p>
                <p className="mt-2 text-base font-semibold text-emerald-950">{expectedOutcome}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">今天要做</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">{missionTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">{missionReason}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={executeRoute}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                执行下一步 <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                <Clock3 className="h-4 w-4" />
                {estimatedTime}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">AI 判断</p>
          <h3 className="mt-3 text-lg font-bold text-[var(--color-text)]">{decisionTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{decisionReason}</p>
          <div className="mt-5 rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">成功标准</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{successMetric}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
