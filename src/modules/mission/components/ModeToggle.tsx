'use client';

import { useSetMode, type MissionMode } from '../hooks/use-mission';
import { cn } from '@/lib/cn';

interface ModeToggleProps {
  mode: MissionMode;
  compact?: boolean;
}

export function ModeToggle({ mode, compact = false }: ModeToggleProps) {
  const setMode = useSetMode();

  function handleChange(nextMode: MissionMode) {
    if (nextMode === mode || setMode.isPending) return;
    if (nextMode === 'advanced') {
      const confirmed = window.confirm(
        '切换到高级模式后，AI 教练仍会在仪表盘提示下一步，但你可以自由跳转到任何功能。',
      );
      if (!confirmed) return;
    }
    setMode.mutate(nextMode);
  }

  if (compact) {
    return (
      <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1 shadow-sm">
        {(['guided', 'advanced'] as MissionMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleChange(item)}
            className={cn(
              'h-8 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition-colors',
              mode === item ? 'bg-blue-600 text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
            )}
          >
            {item === 'guided' ? '新手模式' : '高级模式'}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--color-text)]">模式</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleChange('guided')}
          className={cn(
            'rounded-[var(--radius-md)] border p-4 text-left transition-colors',
            mode === 'guided' ? 'border-blue-300 bg-blue-50' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]',
          )}
        >
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {mode === 'guided' ? '●' : '○'} 新手模式 <span className="text-blue-600">(推荐)</span>
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">AI 一步步引导你。</p>
        </button>
        <button
          type="button"
          onClick={() => handleChange('advanced')}
          className={cn(
            'rounded-[var(--radius-md)] border p-4 text-left transition-colors',
            mode === 'advanced' ? 'border-blue-300 bg-blue-50' : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]',
          )}
        >
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {mode === 'advanced' ? '●' : '○'} 高级模式
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">自由使用所有功能。</p>
        </button>
      </div>
    </section>
  );
}
