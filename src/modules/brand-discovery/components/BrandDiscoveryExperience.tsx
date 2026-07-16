'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Trophy } from 'lucide-react';
import { ChatPanel } from '@/modules/brand-discovery/chat/ChatPanel';
import { ConfidenceCard } from '@/modules/brand-discovery/components/ConfidenceCard';
import { useBrandDiscovery } from '@/modules/brand-discovery/hooks/useBrandDiscovery';
import { SLOT_DEFINITIONS, type SlotName } from '@/modules/brand-discovery/slotExtractionService';
// Brand discovery owns this existing mission completion side effect; moving it would change capability semantics.
// eslint-disable-next-line no-restricted-imports
import { useCompleteCheck } from '@/modules/mission/hooks/use-mission';
import { cn } from '@/lib/cn';

export function BrandDiscoveryExperience() {
  const router = useRouter();
  const {
    interview,
    slots,
    confidence,
    messages,
    isComplete,
    isLoading,
    isError,
    sendMessage,
    finishInterview,
  } = useBrandDiscovery();
  const completeMission = useCompleteCheck();
  const completingMissionRef = React.useRef(false);

  React.useEffect(() => {
    if (isComplete && confidence.readyForDNA && interview?.id && !completingMissionRef.current) {
      completingMissionRef.current = true;
      completeMission.mutateAsync('brand_discovery_completed').finally(() => {
        completingMissionRef.current = false;
      });
    }
  }, [isComplete, confidence.readyForDNA, interview?.id, completeMission]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">AI Coach 正在准备...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600">无法加载品牌探索</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-3 text-sm text-blue-600 hover:underline">
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  const finish = () => finishInterview.mutateAsync();
  const viewDna = () => router.push('/brand-builder/profile?view=dna');

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={() => router.push('/brand-builder/profile')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          品牌档案
        </button>
        <div className="flex items-center gap-3">
          <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', confidence.readyForDNA ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
            <Sparkles className="h-3 w-3" />
            {confidence.overallScore}% 品牌就绪
          </div>
          {!isComplete && confidence.readyForDNA ? (
            <button type="button" onClick={finish} disabled={finishInterview.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {finishInterview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              完成并生成 DNA
            </button>
          ) : null}
          {isComplete ? (
            <button type="button" onClick={viewDna} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
              <Trophy className="h-3.5 w-3.5" />
              查看 Brand DNA
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="min-w-0 flex-1">
          <ChatPanel
            messages={messages}
            slots={slots}
            isTyping={sendMessage.isPending}
            onSendMessage={(content) => sendMessage.mutate({ content, type: 'text' })}
            onStartVoice={() => router.push('/brand-builder/step/interview?mode=voice')}
            className="h-full"
          />
        </div>
        <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-gray-50 p-4 lg:block">
          <ConfidenceCard result={confidence} />
          <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-bold text-[var(--color-text)]">信息收集进度</h4>
            <div className="space-y-2">
              {(Object.entries(SLOT_DEFINITIONS) as [SlotName, typeof SLOT_DEFINITIONS[SlotName]][]).map(([key, definition]) => {
                const slot = slots[key as keyof typeof slots];
                const status = slot?.status ?? 'empty';
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', status === 'filled' ? 'bg-emerald-500' : status === 'partial' ? 'bg-amber-400' : status === 'skipped' ? 'bg-gray-400' : 'bg-gray-200')} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[var(--color-text)]">{definition.label_zh}</p>
                      {slot?.value && status !== 'empty' ? <p className="truncate text-xs text-[var(--color-text-muted)]">{slot.value.slice(0, 40)}{slot.value.length > 40 ? '...' : ''}</p> : null}
                    </div>
                    <span className={cn('shrink-0 text-xs font-medium', status === 'filled' ? 'text-emerald-600' : status === 'partial' ? 'text-amber-600' : 'text-gray-400')}>
                      {status === 'filled' ? '✓' : status === 'partial' ? '...' : status === 'skipped' ? '跳过' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700">{confidence.readyForDNA ? '🎉 可以完成品牌探索任务了！' : '💬 继续聊天，收集到足够信息后自动完成'}</p>
            <p className="mt-1 text-xs text-blue-600">{confidence.readyForDNA ? '点击右上角“完成并生成 DNA”' : `当前分数: ${confidence.overallScore}% (需要 70%)`}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text)]">品牌就绪度</span>
          <span className={cn('text-xs font-bold', confidence.readyForDNA ? 'text-emerald-600' : 'text-amber-600')}>{confidence.overallScore}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className={cn('h-full rounded-full transition-all', confidence.readyForDNA ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${Math.max(2, confidence.overallScore)}%` }} />
        </div>
        {confidence.readyForDNA && !isComplete ? <button type="button" onClick={finish} disabled={finishInterview.isPending} className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{finishInterview.isPending ? '生成中...' : '完成并生成 Brand DNA'}</button> : null}
        {isComplete ? <button type="button" onClick={viewDna} className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700">查看 Brand DNA →</button> : null}
      </div>
    </div>
  );
}
