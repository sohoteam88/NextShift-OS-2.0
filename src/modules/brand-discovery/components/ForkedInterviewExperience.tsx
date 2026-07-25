'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  FORKED_INTERVIEW_TOPICS,
  getFunnelTopicSequence,
  getTopic,
  type ForkedInterviewState,
  type FunnelTopicState,
} from '@/modules/brand-discovery/forkedInterview/funnelDefinition';

type InterviewRecord = { id: string; mode?: string; answers?: Record<string, unknown> };
type FunnelPayload = {
  state: ForkedInterviewState;
  generated?: { status: 'success' | 'degraded' | 'rejected'; userVisibleLabel?: string; reason?: string };
};

function readFunnel(record?: InterviewRecord | null): ForkedInterviewState | null {
  const value = record?.answers?.__forked_funnel;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as ForkedInterviewState;
}

function factsFromInput(value: string) {
  return value.split(/[\n。！？!?]+/).map((item) => item.trim()).filter(Boolean).slice(0, 2);
}

export function ForkedInterviewExperience({ existingInterviewId }: { existingInterviewId?: string }) {
  const [interviewId, setInterviewId] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ForkedInterviewState | null>(null);
  const [facts, setFacts] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function boot() {
      try {
        const latest = await fetch('/api/v1/brand-builder/interview');
        const latestJson = (await latest.json()) as { data?: InterviewRecord | null };
        const existing = latestJson.data;
        if (latest.ok && existing?.mode === 'funnel' && readFunnel(existing)) {
          if (!active) return;
          setInterviewId(existing.id);
          setState(readFunnel(existing));
          return;
        }
        const created = await fetch('/api/v1/brand-builder/interview', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'funnel' }),
        });
        if (!created.ok) throw new Error('无法开始访谈，请刷新后重试。');
        const json = (await created.json()) as { data: InterviewRecord };
        if (!active) return;
        setInterviewId(json.data.id);
        setState(readFunnel(json.data));
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : '无法开始访谈，请刷新后重试。');
      } finally {
        if (active) setLoading(false);
      }
    }
    void boot();
    return () => { active = false; };
  }, [existingInterviewId]);

  async function action(body: Record<string, unknown>) {
    if (!interviewId || working) return null;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/brand-builder/interview/${interviewId}/funnel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = (await response.json()) as { data?: FunnelPayload; error?: { message?: string } };
      if (!response.ok || !json.data) throw new Error(json.error?.message ?? '暂时无法保存，请重试。');
      setState(json.data.state);
      return json.data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '暂时无法继续，请重试。');
      return null;
    } finally {
      setWorking(false);
    }
  }

  async function submitFacts(skip: boolean) {
    const saved = await action({ action: 'facts', facts: skip ? [] : factsFromInput(facts), skip });
    if (!saved) return;
    setFacts('');
    const generated = await action({ action: 'generate' });
    if (generated?.generated?.status === 'degraded') {
      setError(`${generated.generated.userVisibleLabel ?? 'AI 暂时不可用'}。请点击重试。`);
    } else if (generated?.generated?.status === 'rejected') {
      setError('这句需要按合规要求重新生成，请点击重试。');
    }
  }

  if (loading || !state) {
    return <div className="mx-auto flex min-h-[460px] max-w-3xl items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[var(--color-primary)]" /></div>;
  }

  const topic = getTopic(state);
  const topicState: FunnelTopicState | undefined = state.topics[topic.id];
  const sequence = getFunnelTopicSequence(state.entryPath);
  const position = sequence.indexOf(topic.id) + 1;
  const confirmation = topicState?.confirmation;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <header className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm"><Sparkles className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">Brand DNA Interview</p>
            <h1 className="mt-1 text-xl font-bold text-[var(--color-text)] sm:text-2xl">用 5 个小主题，整理你的真实品牌故事</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">每题只要选择、补充最多两句事实，然后确认 AI 整理的一句话。确认过的内容会直接进入你的 Brand DNA。</p>
          </div>
        </div>
      </header>

      {error ? <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}

      {state.phase === 'completed' ? (
        <section className="rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
          <h2 className="mt-3 text-lg font-bold text-emerald-950">Brand DNA 已保存</h2>
          <p className="mt-2 text-sm text-emerald-800">你的确认故事已落入版本化 Brand DNA，可继续完成资料页。</p>
          <Button className="mt-4" onClick={() => { window.location.href = '/brand-builder/step/profile'; }}>继续</Button>
        </section>
      ) : (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">主题 {position} / 5 · {topic.label}</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">{state.entryPath ? `路径 ${state.entryPath}` : '开始'}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${Math.max(8, (position / 5) * 100)}%` }} /></div>

          {state.phase === 'choice' ? (
            <div className="mt-7">
              <h2 className="text-xl font-bold text-[var(--color-text)]">{topic.question}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {topic.options.map((option) => <button key={option.id} type="button" disabled={working} onClick={() => void action({ action: 'select', option_id: option.id })} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-blue-50 disabled:opacity-50">{option.label}</button>)}
              </div>
            </div>
          ) : null}

          {state.phase === 'facts' ? (
            <div className="mt-7">
              <h2 className="text-xl font-bold text-[var(--color-text)]">补充一点事实就好</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{topic.followUp.prompt}</p>
              <textarea value={facts} onChange={(event) => setFacts(event.target.value)} rows={3} maxLength={280} disabled={working} placeholder="例如：用了三个月；之前试过很多方法都难坚持。" className="mt-4 w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 disabled:opacity-60" />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => void submitFacts(false)} disabled={working || (!facts.trim() && topic.id !== 'entry_path')} loading={working}>整理一句确认故事 <ChevronRight className="h-4 w-4" /></Button>
                <Button variant="secondary" onClick={() => void submitFacts(true)} disabled={working}>答不上，先跳过</Button>
              </div>
            </div>
          ) : null}

          {state.phase === 'confirmation' ? (
            <div className="mt-7">
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">我帮你整理一下——</p>
              {confirmation ? <blockquote className="mt-3 rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-4 text-lg font-medium leading-8 text-blue-950">“{confirmation}”</blockquote> : <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4 text-sm text-[var(--color-text-muted)]"><Loader2 className={cn('h-4 w-4', working && 'animate-spin')} /> {working ? 'AI 正在整理真实碎片…' : '这句尚未生成。'}</div>}
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">是这样吗？确认后会直接成为 Brand DNA 的一部分。</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => void action({ action: 'confirm' })} disabled={working || !confirmation} loading={working}>确认，下一题 <CheckCircle2 className="h-4 w-4" /></Button>
                <Button variant="secondary" onClick={() => void action({ action: 'generate' })} disabled={working} icon={<RotateCcw className="h-4 w-4" />}>重新生成</Button>
              </div>
            </div>
          ) : null}
        </section>
      )}

      <p className="text-center text-xs text-[var(--color-text-muted)]">只收集真实事实；不会要求你写一大段故事。</p>
    </div>
  );
}
