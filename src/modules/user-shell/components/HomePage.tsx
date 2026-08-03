'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { TodayTask } from '@/modules/user-shell/services/todayTaskResolver';

export interface HomeTaskPresentation {
  title: string;
  reason: string;
  primaryAction: string;
  estimatedMinutes: number;
}

export function getHomeTaskPresentation(todayTask: TodayTask): HomeTaskPresentation {
  if (todayTask.type === 'followup') {
    return {
      title: '有一位正在等待你的回复',
      reason: '对方已经等了一段时间，先回应她，关系就不会断掉。',
      primaryAction: '现在去回复',
      estimatedMinutes: 3,
    };
  }

  if (todayTask.status === 'content_pending') {
    return {
      title: '今天的安排正在准备中',
      reason: '内容准备好后，这里会告诉你下一步该做什么。',
      primaryAction: '我知道了',
      estimatedMinutes: 1,
    };
  }

  return {
    title: todayTask.content,
    reason: '今天先专心完成这一件事，按自己的节奏来就好。',
    primaryAction: '完成这件事',
    estimatedMinutes: 5,
  };
}

export function HomePage({
  todayTask,
  progressLine,
}: {
  todayTask: TodayTask;
  progressLine: string | null;
}) {
  const [isComplete, setIsComplete] = useState(false);
  const task = getHomeTaskPresentation(todayTask);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-8 sm:px-6">
      <div className="w-full">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">今天先做这一件事</p>

          <div className="mt-5">
            <h1 className="text-2xl font-semibold leading-snug text-[var(--color-text)] sm:text-3xl">
              {task.title}
            </h1>
            <details className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              <summary className="cursor-pointer font-medium text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                为什么先做这件事？
              </summary>
              <p className="mt-2">{task.reason}</p>
            </details>
          </div>

          <div className="mt-8">
            <Button
              type="button"
              size="lg"
              className="w-full min-h-12"
              onClick={() => setIsComplete(true)}
            >
              {task.primaryAction}
            </Button>
            <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">
              预计 {task.estimatedMinutes} 分钟
            </p>
          </div>
        </section>

        {isComplete ? (
          <div className="mt-4 grid grid-cols-2 gap-3" aria-label="完成后的下一步">
            <Button type="button" variant="secondary" className="min-h-12" onClick={() => undefined}>
              还想发一条
            </Button>
            <Button type="button" variant="secondary" className="min-h-12" onClick={() => undefined}>
              看看要跟进谁
            </Button>
          </div>
        ) : null}

        {progressLine ? (
          <p className="mt-8 border-t border-[var(--color-border)] pt-5 text-center text-sm text-[var(--color-text-muted)]">
            {progressLine}
          </p>
        ) : null}
      </div>
    </main>
  );
}
