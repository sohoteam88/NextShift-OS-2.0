'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';

export function CalendarStepClient() {
  const router = useRouter();
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/brand-builder/calendar/generate', { method: 'POST' });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? '生成失败');
      }
      setGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败，请稍后再试');
    } finally {
      setGenerating(false);
    }
  }

  async function handleContinue() {
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'content_calendar' }),
    });
    router.push('/brand-builder/step/complete');
  }

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'content_calendar' }),
    });
    router.push('/brand-builder/step/complete');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">📅 生成内容日历</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          AI 将根据你的内容策略，生成专属的 30 天内容日历，每天告诉你发什么。
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 text-center shadow-sm">
        {!generated ? (
          <div className="space-y-4">
            <div className="text-5xl">🗓️</div>
            <p className="text-base font-semibold text-[var(--color-text)]">
              准备好生成你的 30 天内容计划了吗？
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              包含内容主题、发布平台、格式建议，以及每日创作钩子。
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中（约需 30 秒）...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  一键生成 30 天日历
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-base font-semibold text-[var(--color-text)]">
              内容日历生成完成！
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              你的 30 天内容计划已准备就绪。完成设置后，你可以在内容日历页面查看详情。
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!generated}
          className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
        >
          继续完成设置 →
        </button>
        <button
          type="button"
          onClick={() => void handleSkip()}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          跳过此步骤
        </button>
      </div>
    </div>
  );
}
