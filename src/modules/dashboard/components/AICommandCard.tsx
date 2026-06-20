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

function priorityLabel(priorityLevel: DashboardPriorityLevel) {
  if (priorityLevel === 'Critical') return '紧急';
  if (priorityLevel === 'High') return '高';
  return '普通';
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
              AI COO
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">推荐下一步</p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)] md:text-3xl">{todayMission}</h1>
          </div>

          <div>
            <p className="text-xs font-semibold text-blue-700">为什么现在做这个</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {missionReason}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {decisionReason}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              我暂时不会优先安排报表、团队或自动化优化，因为当前最直接的增长卡点还没有被解决。
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={executeRoute}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                开始任务 <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
            <p className="text-xs font-semibold text-emerald-700">已完成</p>
            <div className="mt-3 space-y-2">
              {completedItems.length > 0 ? completedItems.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm font-semibold text-emerald-950">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              )) : (
                <p className="text-sm font-medium text-emerald-950">系统正在确认你的业务基础。</p>
              )}
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-700">当前缺口</p>
            <p className="mt-2 text-base font-semibold text-red-950">{currentGap}</p>
          </div>
          <div className={`rounded-[var(--radius-md)] border p-4 ${priorityClass(priorityLevel)}`}>
            <p className="text-xs font-semibold">优先级</p>
            <p className="mt-2 text-2xl font-bold">{priorityLabel(priorityLevel)}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <p className="text-xs font-semibold text-emerald-700">预期结果</p>
            </div>
            <p className="mt-2 text-base font-semibold text-emerald-950">{expectedOutcome}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
