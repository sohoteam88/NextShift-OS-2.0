'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Presentation,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { ClipboardButton } from '@/components/ui/ClipboardButton';
import { RevenueDriverIntentResolver } from '@/modules/revenue-drivers/components/RevenueDriverIntentResolver';
import type { RevenueDriverResolvedIntent } from '@/modules/revenue-drivers/constants/revenue-driver-intents';
import type { WebinarPackage } from '../types';

type Draft = {
  title: string;
  promise: string;
  subtitle: string;
  loomScript: string;
  registrationHeadline: string;
  registrationCta: string;
};

const draftOf = (pkg: WebinarPackage): Draft => ({
  title: pkg.topic.title,
  promise: pkg.topic.promise,
  subtitle: pkg.topic.subtitle,
  loomScript: pkg.loomScript,
  registrationHeadline: pkg.registrationPage.headline,
  registrationCta: pkg.registrationPage.cta,
});
const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

function useWebinar() {
  return useQuery({
    queryKey: ['webinar'],
    queryFn: async () => {
      const response = await fetch('/api/v1/webinar-center');
      if (!response.ok) throw new Error('读取 Webinar 失败。');
      return response.json() as Promise<{ data: WebinarPackage | null }>;
    },
    staleTime: 30_000,
  });
}

export function WebinarDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useWebinar();
  const pkg = query.data?.data ?? null;
  const [activeOutput, setActiveOutput] = React.useState('strategy');
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmingRegeneration, setConfirmingRegeneration] =
    React.useState(false);
  const [regenerationError, setRegenerationError] = React.useState('');
  const [saved, setSaved] = React.useState<Draft | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [message, setMessage] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const session = React.useRef(0);
  const packageRef = React.useRef(pkg);
  packageRef.current = pkg;
  const generatedFeedback = React.useRef<{
    id: string;
    message: string;
  } | null>(null);

  React.useEffect(() => {
    const activePackage = packageRef.current;
    session.current += 1;
    if (activePackage) {
      const next = draftOf(activePackage);
      setSaved(next);
      setDraft(next);
    } else {
      setSaved(null);
      setDraft(null);
    }
    const feedback = generatedFeedback.current;
    setMessage(
      feedback && feedback.id === activePackage?.id ? feedback.message : '',
    );
    generatedFeedback.current = null;
    setRegenerationError('');
    setEditing(false);
    setDeleting(false);
    setConfirmingRegeneration(false);
  }, [pkg?.id]);

  const generate = useMutation({
    mutationFn: async ({ ownedSession }: { ownedSession: number }) => {
      const response = await fetch('/api/v1/webinar-center/generate', {
        method: 'POST',
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: WebinarPackage;
        error?: { message?: string };
      };
      if (!response.ok || !body.data) {
        throw new Error(
          body.error?.message ?? '重新生成失败，现有 Webinar 已保留。',
        );
      }
      return { data: body.data, ownedSession };
    },
    onSuccess: ({ data, ownedSession }) => {
      if (ownedSession !== session.current) return;
      generatedFeedback.current = {
        id: data.id,
        message: pkg ? '重新生成成功。' : '生成成功。',
      };
      setRegenerationError('');
      queryClient.setQueryData(['webinar'], { data });
    },
    onError: (error, { ownedSession }) => {
      if (ownedSession !== session.current) return;
      setRegenerationError(
        error instanceof Error
          ? error.message
          : '重新生成失败，现有 Webinar 已保留。',
      );
    },
  });

  const handleIntentResolved = React.useCallback(
    (resolution: RevenueDriverResolvedIntent) => {
      if (typeof resolution.state.output === 'string') {
        setActiveOutput(resolution.state.output);
      }
    },
    [],
  );
  const dirty = Boolean(saved && draft && !same(saved, draft));

  function startGeneration() {
    if (generate.isPending) return;
    setRegenerationError('');
    generate.mutate({ ownedSession: session.current });
  }

  function requestRegeneration() {
    if (generate.isPending) return;
    if (dirty) {
      setMessage('请先保存、取消或明确放弃未保存的编辑，再重新生成。');
      setEditing(true);
      return;
    }
    setMessage('');
    setConfirmingRegeneration(true);
  }

  async function save() {
    if (!pkg || !draft || !dirty || pending) return;
    const owned = session.current;
    const submitted = draft;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/webinar-center', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pkg.id, ...submitted }),
      });
      const body = (await response.json()) as { data?: WebinarPackage };
      if (!response.ok || !body.data) {
        throw new Error('保存失败，输入已保留。');
      }
      if (owned !== session.current) return;
      const next = draftOf(body.data);
      setSaved(next);
      setDraft((current) =>
        current && same(current, submitted) ? next : current,
      );
      queryClient.setQueryData(['webinar'], { data: body.data });
      setMessage('保存成功。');
    } catch (error) {
      if (owned === session.current) {
        setMessage(
          error instanceof Error ? error.message : '保存失败，输入已保留。',
        );
      }
    } finally {
      if (owned === session.current) setPending(false);
    }
  }

  async function remove() {
    if (!pkg || pending || generate.isPending) return;
    const owned = session.current;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/webinar-center', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pkg.id }),
      });
      if (!response.ok) {
        throw new Error('删除失败，Webinar 仍然保留。');
      }
      if (owned === session.current) {
        queryClient.setQueryData(['webinar'], { data: null });
        setDeleting(false);
      }
    } catch (error) {
      if (owned === session.current) {
        setMessage(
          error instanceof Error
            ? error.message
            : '删除失败，Webinar 仍然保留。',
        );
      }
    } finally {
      if (owned === session.current) setPending(false);
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <RevenueDriverIntentResolver
        route="/webinar-center"
        onResolved={handleIntentResolved}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="返回仪表板"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold">线上讲座中心</h1>
            <p className="text-xs text-gray-500">
              创建教育型讲座，把兴趣变成信任和成交。
            </p>
          </div>
        </div>
        {pkg ? (
          <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <Trophy className="mr-1 inline h-3 w-3" />已保存
          </div>
        ) : null}
      </div>

      {!pkg ? (
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <Presentation className="mx-auto mb-3 h-8 w-8 text-blue-500" />
          <h2 className="mb-2 text-lg font-bold">生成你的第一场 Webinar</h2>
          <button
            type="button"
            onClick={startGeneration}
            disabled={generate.isPending}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white disabled:opacity-50"
          >
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            生成完整 Webinar
          </button>
          {regenerationError ? (
            <div role="alert" className="mt-4 text-sm text-red-700">
              {regenerationError}
              <button
                type="button"
                onClick={startGeneration}
                disabled={generate.isPending}
                className="ml-3 inline-flex items-center gap-1 underline disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />重试
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {pkg && draft ? (
        <div className="space-y-4" data-canonical-id={pkg.id}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={generate.isPending}
              onClick={() => setEditing(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />编辑
            </button>
            <button
              type="button"
              disabled={generate.isPending}
              onClick={requestRegeneration}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-blue-200 px-3 text-blue-700 disabled:opacity-50"
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              重新生成 Webinar
            </button>
            <ClipboardButton
              sessionKey={`${pkg.id}:script`}
              text={draft.loomScript}
              label="复制当前讲稿"
            />
            <ClipboardButton
              sessionKey={`${pkg.id}:registration`}
              text={`${draft.registrationHeadline}\n${draft.registrationCta}`}
              label="复制当前注册页"
            />
            <ClipboardButton
              sessionKey={`${pkg.id}:slides`}
              text={pkg.slideOutline
                .map(
                  (slide) =>
                    `${slide.slideNumber}. ${slide.title}\n${slide.keyMessage}`,
                )
                .join('\n\n')}
              label="复制当前 Slides"
            />
            <ClipboardButton
              sessionKey={`${pkg.id}:followup`}
              text={pkg.followupSequence
                .map((followup) => `Day ${followup.day}: ${followup.message}`)
                .join('\n\n')}
              label="复制跟进序列"
            />
            <button
              type="button"
              disabled={generate.isPending}
              onClick={() => setDeleting(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />删除
            </button>
          </div>

          {regenerationError ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <p>{regenerationError}</p>
              <button
                type="button"
                onClick={startGeneration}
                disabled={generate.isPending}
                className="mt-2 inline-flex min-h-10 items-center gap-2 font-semibold underline disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />重试重新生成
              </button>
            </div>
          ) : null}

          <Section title="🎯 策略" active={activeOutput === 'strategy'}>
            <p className="text-sm">
              <strong>受众:</strong> {pkg.strategy.targetAudience}
            </p>
            <p className="text-sm">
              <strong>目标:</strong> {pkg.strategy.desiredOutcome}
            </p>
          </Section>
          <Section title="📝 主题">
            <p className="text-lg font-bold">{draft.title}</p>
            <p className="text-sm text-blue-600">{draft.promise}</p>
            <p className="text-xs text-gray-500">{draft.subtitle}</p>
          </Section>
          <Section title="🎙️ Speaker Script" active={activeOutput === 'script'}>
            <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs">
              {draft.loomScript}
            </pre>
          </Section>
          <Section
            title="🖼️ Presentation Slides"
            active={activeOutput === 'slides'}
          >
            {pkg.slideOutline.map((slide) => (
              <div
                key={slide.slideNumber}
                className="border-b py-2 text-sm last:border-0"
              >
                <strong>
                  Slide {slide.slideNumber}: {slide.title}
                </strong>
                <br />
                <span className="text-xs text-gray-500">
                  {slide.keyMessage}
                </span>
              </div>
            ))}
          </Section>
          <Section title="📄 注册页">
            <p className="font-bold">{draft.registrationHeadline}</p>
            <p className="text-sm text-blue-600">{draft.registrationCta}</p>
          </Section>
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${message.includes('失败') ? 'text-red-700' : 'text-green-700'}`}
        >
          {message}
        </p>
      ) : null}

      <AccessibleDialog
        open={editing && Boolean(pkg && draft)}
        title="编辑 Webinar"
        description={pkg ? `保存同一个 canonical ID：${pkg.id}` : ''}
        onRequestClose={() => {
          if (!pending) setEditing(false);
        }}
      >
        {draft ? (
          <div className="space-y-4 p-5">
            {(
              [
                ['title', '标题', 200],
                ['promise', '承诺', 1000],
                ['subtitle', '副标题', 500],
                ['loomScript', '讲稿', 20000],
                ['registrationHeadline', '注册页标题', 300],
                ['registrationCta', '注册 CTA', 200],
              ] as const
            ).map(([key, label, max]) => (
              <label key={key} className="block text-sm font-medium">
                {label}
                <textarea
                  value={draft[key]}
                  maxLength={max}
                  rows={key === 'loomScript' ? 10 : 3}
                  onChange={(event) =>
                    setDraft((value) =>
                      value ? { ...value, [key]: event.target.value } : value,
                    )
                  }
                  className="mt-1 w-full rounded-md border p-3"
                />
              </label>
            ))}
            {dirty && message.includes('重新生成') ? (
              <p role="alert" className="text-sm text-amber-700">
                {message}
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setDraft(saved);
                  setMessage('');
                  setEditing(false);
                }}
                className="min-h-11 rounded-md border px-4"
              >
                取消并放弃编辑
              </button>
              <button
                type="button"
                disabled={pending || !dirty}
                onClick={() => void save()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-white disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                保存
              </button>
            </div>
          </div>
        ) : null}
      </AccessibleDialog>

      <AccessibleDialog
        open={confirmingRegeneration && Boolean(pkg)}
        title="重新生成并替换 Webinar？"
        description="成功后会产生新的 canonical ID，并替换当前 singleton package。"
        onRequestClose={() => {
          if (!generate.isPending) setConfirmingRegeneration(false);
        }}
        className="max-w-md"
      >
        <div className="space-y-4 p-5">
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            只有生成成功才会替换当前 Webinar。失败时，当前 ID、内容、编辑器和复制状态都会保留。
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={generate.isPending}
              onClick={() => setConfirmingRegeneration(false)}
              className="min-h-11 rounded-md border px-4"
            >
              保留当前 Webinar
            </button>
            <button
              type="button"
              disabled={generate.isPending}
              onClick={() => {
                setConfirmingRegeneration(false);
                startGeneration();
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-white disabled:opacity-50"
            >
              确认生成新 Webinar
            </button>
          </div>
        </div>
      </AccessibleDialog>

      <AccessibleDialog
        open={deleting && Boolean(pkg)}
        title="删除 Webinar？"
        description="删除后无法恢复，但其他 user metadata 不受影响。"
        onRequestClose={() => {
          if (!pending) setDeleting(false);
        }}
        className="max-w-md"
      >
        <div className="space-y-4 p-5">
          {message.includes('失败') ? (
            <p role="alert" className="text-sm text-red-700">
              {message}
            </p>
          ) : null}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => setDeleting(false)}
              className="min-h-11 rounded-md border px-4"
            >
              取消
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void remove()}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-red-600 px-4 text-white disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {message.includes('失败') ? '重试删除' : '确认删除'}
            </button>
          </div>
        </div>
      </AccessibleDialog>
    </div>
  );
}

function Section({
  title,
  children,
  active = false,
}: {
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-white p-5',
        active
          ? 'border-blue-300 ring-2 ring-blue-100'
          : 'border-[var(--color-border)]',
      )}
    >
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      {children}
    </section>
  );
}
