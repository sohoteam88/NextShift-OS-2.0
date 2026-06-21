import Link from 'next/link';
import { ArrowRight, Bot, Check, Clock3, Route, Target } from 'lucide-react';

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
  missionReason,
  decisionReason,
  priorityLevel,
  estimatedTime,
  expectedOutcome,
  executeRoute,
  primaryActionLabel = '开始任务',
}: AICommandCardProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="flex min-h-[380px] flex-col justify-between gap-7 p-5 md:p-7">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Bot className="h-4 w-4" aria-hidden="true" />
              AI COO
            </div>
            <p className="text-sm font-semibold text-blue-700">
              今天先做这一件事。
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl">
              {todayMission}
            </h1>
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
                  当前缺口是{' '}
                  <span className="font-semibold text-[var(--color-text)]">
                    {currentGap}
                  </span>
                  。先解决这个，后面的内容、引流、漏斗和 Leads 才会顺着生成。
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
                  双漏斗方向
                </p>
              </div>
              <div className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
                <p>
                  <span className="font-semibold text-[var(--color-text)]">
                    Retail：
                  </span>
                  客户、产品、服务和成交。
                </p>
                <p>
                  <span className="font-semibold text-[var(--color-text)]">
                    Recruitment：
                  </span>
                  伙伴、团队和复制系统。
                </p>
                <p>
                  AI COO 会先处理当前最高阻塞点，再继续生成两条漏斗需要的内容。
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
