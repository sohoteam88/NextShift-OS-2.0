'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';

type Props = {
  mode: string;
  provider: string;
  autoEscalate: boolean;
  onModeChange: (v: string) => void;
  onProviderChange: (v: string) => void;
  onAutoEscalateChange: (v: boolean) => void;
};

export function AIRouterConfig({ mode, provider, autoEscalate, onModeChange, onProviderChange, onAutoEscalateChange }: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-[var(--color-primary)]" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">AI 模型路由</h2>
      </div>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">模式</label>
          <select value={mode} onChange={(e) => onModeChange(e.target.value)} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm">
            <option value="cost_optimized">省钱模式</option>
            <option value="balanced">平衡模式（推荐）</option>
            <option value="quality_first">质量优先</option>
            <option value="zh_optimized">中文优化</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">首选供应商</label>
          <select value={provider} onChange={(e) => onProviderChange(e.target.value)} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm">
            <option value="auto">自动选择</option>
            <option value="anthropic">Anthropic</option><option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option><option value="minimax">MiniMax</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input type="checkbox" checked={autoEscalate} onChange={(e) => onAutoEscalateChange(e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)]" />
          失败自动升级到更高模型
        </label>
        <Link href="/api/v1/ai/router/stats" className="block rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-muted)] hover:bg-gray-100">查看本月路由统计</Link>
      </div>
    </div>
  );
}
