'use client';

import { Mic, MessageSquare } from 'lucide-react';

type Props = {
  onSelect: (mode: 'voice' | 'text') => void;
  loading?: boolean;
};

export function InterviewModeSelector({ onSelect, loading = false }: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">让 AI 了解你</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">选择你喜欢的方式：</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => onSelect('voice')}
          className="group flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] bg-white p-6 text-left shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[var(--color-primary)] transition-colors group-hover:bg-blue-100">
            <Mic className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">语音</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">2-5 分钟</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">像聊天一样</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">自由发挥</p>
          </div>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => onSelect('text')}
          className="group flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] bg-white p-6 text-left shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">文字</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">3-5 分钟</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">一问一答</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">有引导</p>
          </div>
        </button>
      </div>

      <p className="rounded-[var(--radius-md)] bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
        推荐语音模式 — 更自然，AI 能更好地了解你的个性和风格
      </p>
    </div>
  );
}
