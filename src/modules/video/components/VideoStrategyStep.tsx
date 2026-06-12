'use client';

import * as React from 'react';
import { BarChart3, Target, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { VideoHook, VideoStrategy } from '../types';

type Props = {
  strategy: VideoStrategy;
  hook: VideoHook;
  selectedHook: VideoHook;
  onSelectHook: (hook: VideoHook) => void;
  onGenerateScript: () => void;
  generating?: boolean;
};

export function VideoStrategyStep({ strategy, hook, selectedHook, onSelectHook, onGenerateScript, generating }: Props) {
  const options: VideoHook[] = [
    hook,
    ...hook.alternates.map((item) => ({
      text: item.text,
      hook_type: item.hook_type as VideoHook['hook_type'],
      visual_concept: hook.visual_concept,
      alternates: [],
    })),
  ];

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-[var(--color-primary)]" />
        <h2 className="text-lg font-semibold text-[var(--color-text)]">AI 视频策略</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">推荐角度</p>
          <p className="mt-1 font-semibold text-[var(--color-text)]">{strategy.recommended_angle}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{strategy.angle_reason}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">情绪曲线</p>
          <p className="mt-1 font-semibold text-[var(--color-text)]">{strategy.emotional_arc}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--color-primary)]" />
            <p className="text-xs font-medium text-[var(--color-text-muted)]">漏斗定位</p>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text)]">{strategy.funnel_stage_alignment}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" />
            <p className="text-xs font-medium text-[var(--color-text-muted)]">预期完播率</p>
          </div>
          <p className="mt-1 font-semibold text-[var(--color-text)]">{strategy.estimated_completion_rate}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{strategy.estimated_completion_reason}</p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">选择你的 Hook</h3>
        <div className="space-y-3">
          {options.map((option, index) => {
            const selected = selectedHook.text === option.text;
            return (
              <button
                key={`${option.hook_type}-${option.text}`}
                type="button"
                onClick={() => onSelectHook(option)}
                className={cn(
                  'block w-full rounded-[var(--radius-md)] border p-4 text-left transition-colors',
                  selected ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]',
                )}
              >
                <p className="text-xs font-medium text-[var(--color-primary)]">{index === 0 ? '推荐' : '备选'} · {option.hook_type}</p>
                <p className="mt-2 text-base font-semibold text-[var(--color-text)]">“{option.text}”</p>
                {index === 0 ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">画面：{option.visual_concept}</p> : null}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerateScript}
        disabled={generating}
        className="mt-5 inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {generating ? '生成完整脚本中...' : '生成完整脚本 →'}
      </button>
    </section>
  );
}
