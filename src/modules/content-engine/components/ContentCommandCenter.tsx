'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Copy,
  FileText,
  Fingerprint,
  Loader2,
  MessageCircle,
  PenLine,
  RefreshCw,
  Save,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  CONTENT_COMMAND_CENTER_PLATFORMS,
  CONTENT_UPDATE_LIMITS,
  isContentCommandCenterPlatform,
  type ContentCalendar,
  type ContentCommandCenterPlatform,
  type ContentTrack,
  type GeneratedPost,
} from '@/modules/content-engine/types';
import {
  applyPersistedContent,
  canSaveDraft,
  contentEditStartedProperties,
  contentPatchPayload,
  isDraftDirty,
  reconcilePersistedEditorDraft,
  toEditableContentDraft,
  type ContentEditStartedProperties,
  type EditableContentDraft,
} from '@/modules/content-engine/contentDraftEditor';
import {
  fetchTelemetryUserId,
  trackContentCopied,
  trackContentEditStarted,
  trackContentGenerated,
  trackContentLoopCompleted,
  trackContentSaved,
} from '@/lib/telemetry/tracker';
import { RevenueDriverIntentResolver } from '@/modules/revenue-drivers/components/RevenueDriverIntentResolver';
import type { RevenueDriverResolvedIntent } from '@/modules/revenue-drivers/constants/revenue-driver-intents';

type BrandProfile = Record<string, unknown>;

type ContentEngineResponse = {
  data: {
    trackCalendars?: Record<ContentTrack, ContentCalendar | null>;
    lastPost?: GeneratedPost | null;
  };
};

type PersistedContent = {
  id: string;
  title: string | null;
  body: string;
  platform: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const CONTENT_MIX = [
  { type: '教育', ratio: '40%', reason: '解释问题、方法和正确观念。' },
  { type: '故事', ratio: '20%', reason: '建立个人信任和情感连接。' },
  { type: '权威', ratio: '20%', reason: '证明你有能力带他们前进。' },
  { type: '推广', ratio: '10%', reason: '把兴趣引导到领取、私聊或预约。' },
  { type: '社群', ratio: '10%', reason: '制造互动、回应和持续触达。' },
];

const PLATFORMS = ['Facebook', 'Instagram', 'TikTok', '小红书'];

const POST_PLATFORM_LABELS: Record<ContentCommandCenterPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  xhs: '小红书',
};

const POST_PLATFORMS = CONTENT_COMMAND_CENTER_PLATFORMS.map((value) => ({
  value,
  label: POST_PLATFORM_LABELS[value],
}));

type OutputTabId =
  | 'calendar'
  | 'pillars'
  | 'hooks'
  | 'cta'
  | 'retail'
  | 'recruitment'
  | 'first-seven';

const OUTPUTS: Array<{ id: OutputTabId; label: string }> = [
  { id: 'calendar', label: '30 天内容日历' },
  { id: 'pillars', label: '内容支柱' },
  { id: 'hooks', label: 'Hook 素材库' },
  { id: 'cta', label: 'CTA 话术库' },
  { id: 'retail', label: 'Retail 文案方向' },
  { id: 'recruitment', label: 'Recruitment 文案方向' },
  { id: 'first-seven', label: '前 7 天立即执行内容' },
];

const TRACKS: Array<{
  id: ContentTrack;
  title: string;
  goal: string;
  copy: string;
  cta: string;
}> = [
  {
    id: 'retail',
    title: 'Retail Content',
    goal: '吸引客户、教育市场、建立信任、推动购买。',
    copy: '围绕产品、服务、方案、真实问题和购买理由来生成内容。',
    cta: '领取资源 / 预约咨询 / 加 WhatsApp',
  },
  {
    id: 'recruitment',
    title: 'Recruitment Content',
    goal: '吸引伙伴、展示机会、建立团队复制信任。',
    copy: '围绕副业路径、个人成长、团队支持和机会判断来生成内容。',
    cta: '了解合作 / 申请加入 / 加 WhatsApp',
  },
];

function valueOf(
  profile: BrandProfile | null | undefined,
  keys: string[],
  fallback = '等待 Brand DNA 确认',
) {
  if (!profile) return fallback;

  for (const key of keys) {
    const value = profile[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && value.length > 0) {
      return value
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'name' in item)
            return String((item as { name: unknown }).name);
          return '';
        })
        .filter(Boolean)
        .slice(0, 3)
        .join('、');
    }
  }

  return fallback;
}

function hasBrandDNA(profile: BrandProfile | null | undefined) {
  if (!profile) return false;
  const audience = valueOf(profile, ['target_audience', 'targetAudience'], '');
  const offer = valueOf(
    profile,
    ['offer', 'primaryOffer', 'value_proposition', 'coreMessage'],
    '',
  );
  const positioning = valueOf(
    profile,
    ['identity', 'brandName', 'brandPositioning', 'positioning'],
    '',
  );
  return Boolean(audience && offer && positioning);
}

function firstSevenDays(calendar?: ContentCalendar | null) {
  return calendar?.items.slice(0, 7) ?? [];
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function responseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    message?: string;
  };
  return payload.error?.message ?? payload.message ?? fallback;
}

function BrandDNAGate({ isError }: { isError: boolean }) {
  return (
    <div className="mx-auto max-w-5xl pb-12">
      <section className="rounded-[var(--radius-lg)] border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-1 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              Brand DNA Required
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
              Brand DNA 还不完整。
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">
              内容引擎需要先知道你的受众、Offer、品牌方向和信任证明，才可以自动生成
              Retail 与 Recruitment 两套内容计划。
              {isError
                ? ' 目前读取 Brand DNA 时出现问题，你可以先回到确认页检查资料。'
                : ''}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/brand-builder/step/profile"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                返回确认 Brand DNA{' '}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                回到 AI COO
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div className="h-[340px] animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        <div className="h-72 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
      </div>
    </div>
  );
}

export function ContentCommandCenter() {
  const queryClient = useQueryClient();
  const [activeOutputTab, setActiveOutputTab] =
    useState<OutputTabId>('calendar');
  const [selectedPlatform, setSelectedPlatform] =
    useState<ContentCommandCenterPlatform>('facebook');
  const [editorDraft, setEditorDraft] = useState<EditableContentDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<EditableContentDraft | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyError, setCopyError] = useState<string | null>(null);
  const [pendingEditStarted, setPendingEditStarted] =
    useState<ContentEditStartedProperties | null>(null);
  const savedAfterEditRef = useRef<string | null>(null);
  const trackedEditingRef = useRef<string | null>(null);
  const reportedEditingRef = useRef<string | null>(null);
  const handleIntentResolved = useCallback((resolution: RevenueDriverResolvedIntent) => {
    const outputTab = resolution.state.outputTab as OutputTabId | undefined;
    if (outputTab && OUTPUTS.some((output) => output.id === outputTab)) {
      setActiveOutputTab(outputTab);
    }
  }, []);
  const brandProfileQuery = useQuery({
    queryKey: ['brand-builder-profile'],
    queryFn: async () => {
      const response = await fetch('/api/v1/brand-builder/profile');
      if (!response.ok) throw new Error('Failed to load Brand DNA');
      const payload = (await response.json()) as { data: BrandProfile | null };
      return payload.data;
    },
  });

  const contentQuery = useQuery({
    queryKey: ['content-engine'],
    queryFn: async () => {
      const response = await fetch('/api/v1/content-engine');
      if (!response.ok) throw new Error('Failed to load content engine');
      return response.json() as Promise<ContentEngineResponse>;
    },
  });

  const telemetryUserQuery = useQuery({
    queryKey: ['telemetry-user-id'],
    queryFn: fetchTelemetryUserId,
    staleTime: 5 * 60_000,
  });

  const generatePost = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/content-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          format: 'text_post',
          funnelStage: 'awareness',
        }),
      });

      if (!response.ok) {
        throw new Error(await responseError(response, '内容暂时无法生成。'));
      }

      return response.json() as Promise<{ data: GeneratedPost }>;
    },
    onMutate: () => {
      setCopyFeedback('idle');
      setCopyError(null);
    },
    onSuccess: ({ data: post }) => {
      const draft = toEditableContentDraft(post);
      setEditorDraft(draft);
      setSavedDraft(draft);
      if (isContentCommandCenterPlatform(draft.platform)) {
        setSelectedPlatform(draft.platform);
      }
      savedAfterEditRef.current = null;
      trackedEditingRef.current = null;
      reportedEditingRef.current = null;
      setPendingEditStarted(null);
      const userId = telemetryUserQuery.data;
      if (userId) {
        trackContentGenerated(userId, {
          contentId: draft.id,
          platform: draft.platform,
          contentType: draft.format,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ['content-engine'] });
      void queryClient.invalidateQueries({ queryKey: ['content-library'] });
    },
  });

  const saveDraft = useMutation({
    mutationFn: async (draft: EditableContentDraft) => {
      const response = await fetch(`/api/v1/ai/content/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentPatchPayload(draft)),
      });

      if (!response.ok) {
        throw new Error(await responseError(response, '草稿暂时无法保存。'));
      }

      const payload = (await response.json()) as { data: PersistedContent };
      return payload.data;
    },
    onSuccess: (content, draft) => {
      const saved = applyPersistedContent(draft, content);
      setSavedDraft(saved);
      setEditorDraft((currentDraft) =>
        reconcilePersistedEditorDraft(currentDraft, draft, saved),
      );
      savedAfterEditRef.current = saved.id;
      const userId = telemetryUserQuery.data;
      if (userId) {
        trackContentSaved(userId, {
          contentId: saved.id,
          platform: saved.platform,
          contentType: saved.format,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ['content-engine'] });
      void queryClient.invalidateQueries({ queryKey: ['content-library'] });
    },
  });

  const generatePlan = useMutation({
    mutationFn: async () => {
      const responses = await Promise.all(
        TRACKS.map(async (track) => {
          const response = await fetch('/api/v1/content-engine/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: 30, track: track.id }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as {
              error?: { message?: string };
              message?: string;
            };
            throw new Error(
              payload.error?.message ??
                payload.message ??
                '内容计划暂时无法生成。',
            );
          }

          return response.json() as Promise<{ data: ContentCalendar }>;
        }),
      );

      return responses.map((response) => response.data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content-engine'] });
      void queryClient.invalidateQueries({
        queryKey: ['dashboard-projection'],
      });
    },
  });

  const lastPost = contentQuery.data?.data.lastPost ?? null;
  const isDirty = isDraftDirty(editorDraft, savedDraft);

  useEffect(() => {
    if (
      editorDraft ||
      !lastPost ||
      lastPost.format !== 'text_post' ||
      !isContentCommandCenterPlatform(lastPost.platform)
    ) {
      return;
    }
    const draft = toEditableContentDraft(lastPost);
    setEditorDraft(draft);
    setSavedDraft(draft);
    setSelectedPlatform(lastPost.platform);
    trackedEditingRef.current = null;
    reportedEditingRef.current = null;
    setPendingEditStarted(null);
  }, [editorDraft, lastPost]);

  useEffect(() => {
    if (!pendingEditStarted || !telemetryUserQuery.data) return;
    if (reportedEditingRef.current === pendingEditStarted.contentId) {
      setPendingEditStarted(null);
      return;
    }

    reportedEditingRef.current = pendingEditStarted.contentId;
    trackContentEditStarted(telemetryUserQuery.data, pendingEditStarted);
    setPendingEditStarted(null);
  }, [pendingEditStarted, telemetryUserQuery.data]);

  useEffect(() => {
    if (!isDirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const confirmLinkNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]');
      if (!link || link.getAttribute('target') === '_blank' || event.defaultPrevented) return;
      if (!window.confirm('你有未保存的内容，确定要离开吗？')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', confirmLinkNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', confirmLinkNavigation, true);
    };
  }, [isDirty]);

  function handleGeneratePost() {
    if (
      isDirty &&
      !window.confirm('重新生成会保留当前草稿，但未保存的编辑不会自动写入。确定继续吗？')
    ) {
      return;
    }
    generatePost.mutate();
  }

  function updateEditorDraft(field: 'title' | 'body', value: string) {
    if (!editorDraft) return;
    const editStarted = contentEditStartedProperties(
      trackedEditingRef.current,
      editorDraft,
    );
    if (editStarted) {
      trackedEditingRef.current = editStarted.contentId;
      const userId = telemetryUserQuery.data;
      if (userId) {
        reportedEditingRef.current = editStarted.contentId;
        trackContentEditStarted(userId, editStarted);
      } else {
        setPendingEditStarted(editStarted);
      }
    }
    setCopyFeedback('idle');
    setCopyError(null);
    setEditorDraft({ ...editorDraft, [field]: value });
  }

  async function handleCopy() {
    if (!editorDraft?.body.trim()) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('此浏览器不支持复制功能。');
      }
      await navigator.clipboard.writeText(editorDraft.body);
      setCopyFeedback('success');
      setCopyError(null);
      const userId = telemetryUserQuery.data;
      if (userId) {
        const properties = {
          contentId: editorDraft.id,
          platform: editorDraft.platform,
          contentType: editorDraft.format,
        };
        trackContentCopied(userId, properties);
        if (savedAfterEditRef.current === editorDraft.id && !isDirty) {
          trackContentLoopCompleted(userId, properties);
        }
      }
    } catch (error) {
      setCopyFeedback('error');
      setCopyError(error instanceof Error ? error.message : '内容无法复制，请重试。');
    }
  }

  if (brandProfileQuery.isLoading || contentQuery.isLoading) {
    return <LoadingState />;
  }

  const profile = brandProfileQuery.data;

  if (brandProfileQuery.isError || !hasBrandDNA(profile)) {
    return <BrandDNAGate isError={brandProfileQuery.isError} />;
  }

  const trackCalendars = contentQuery.data?.data.trackCalendars ?? {
    retail: null,
    recruitment: null,
  };
  const retailCalendar = trackCalendars.retail;
  const recruitmentCalendar = trackCalendars.recruitment;
  const hasGeneratedPlan = Boolean(retailCalendar && recruitmentCalendar);
  const retailItems = retailCalendar?.items ?? [];
  const recruitmentItems = recruitmentCalendar?.items ?? [];
  const allCalendarItems = [
    ...retailItems.map((item) => ({ ...item, trackLabel: 'Retail' })),
    ...recruitmentItems.map((item) => ({
      ...item,
      trackLabel: 'Recruitment',
    })),
  ];
  const previewItems = [
    ...firstSevenDays(retailCalendar).map((item) => ({
      ...item,
      trackLabel: 'Retail',
    })),
    ...firstSevenDays(recruitmentCalendar).map((item) => ({
      ...item,
      trackLabel: 'Recruitment',
    })),
  ].slice(0, 7);
  const pillarSummary = uniqueValues(
    allCalendarItems.map((item) => item.pillar),
  ).map((pillar) => {
    const matchingItems = allCalendarItems.filter(
      (item) => item.pillar === pillar,
    );
    return {
      pillar,
      emoji: matchingItems[0]?.pillarEmoji ?? '',
      count: matchingItems.length,
      sample: matchingItems[0]?.title ?? '',
    };
  });
  const hookBank = uniqueValues(allCalendarItems.map((item) => item.hook));
  const ctaLibrary = uniqueValues(allCalendarItems.map((item) => item.cta));

  const brandSummary = [
    {
      label: '用户是谁',
      value: valueOf(profile, ['identity', 'personalName', 'brandName']),
    },
    {
      label: '目标受众',
      value: valueOf(profile, ['target_audience', 'targetAudience']),
    },
    {
      label: '核心痛点',
      value: valueOf(profile, [
        'audience_pain_points',
        'painPoints',
        'audiencePainPoints',
      ]),
    },
    {
      label: 'Offer / 产品 / 服务',
      value: valueOf(profile, [
        'offer',
        'primaryOffer',
        'value_proposition',
        'coreMessage',
      ]),
    },
    {
      label: '信任证明',
      value: valueOf(profile, [
        'trust_proof',
        'differentiator',
        'uniqueAngle',
        'expertise',
      ]),
    },
    {
      label: '品牌语气',
      value: valueOf(
        profile,
        ['personality', 'contentTone', 'tone'],
        '温暖、清楚、有行动感',
      ),
    },
    {
      label: 'Retail 方向',
      value: valueOf(profile, [
        'primaryOffer',
        'transformationPromise',
        'value_proposition',
      ]),
    },
    {
      label: 'Recruitment 方向',
      value: valueOf(
        profile,
        ['teamOpportunity', 'secondaryOffer', 'story'],
        '用个人故事、成长路径和团队支持建立合作信任',
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <RevenueDriverIntentResolver route="/content-engine" onResolved={handleIntentResolved} />
      <section className="rounded-[var(--radius-lg)] border border-blue-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex min-h-[360px] flex-col justify-between p-5 md:p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                AI COO 任务
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl">
                生成你的内容计划
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">
                AI COO
                判断你目前缺少稳定内容系统。先生成内容计划，后面才能生成引流资源、漏斗落地页和流量测试。
              </p>
            </div>

            <div className="mt-8 space-y-4 border-l-2 border-blue-100 pl-4">
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  根据什么生成
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  根据已确认的 Brand DNA 自动生成，不重新问基础资料。
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  当前目标
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  建立稳定内容节奏，并为 Retail 与 Recruitment
                  两条漏斗准备可发布内容。
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">
                  生成后下一步
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  确认内容计划后进入引流资源，开始设计可领取的 Lead Magnet。
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {hasGeneratedPlan ? (
                <Link
                  href="/lead-magnet"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  确认并进入引流资源{' '}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => generatePlan.mutate()}
                  disabled={generatePlan.isPending}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {generatePlan.isPending ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      正在生成内容计划
                    </>
                  ) : (
                    <>
                      生成内容计划{' '}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                回到 AI COO
              </Link>
            </div>

            {generatePlan.isError ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  内容计划暂时无法生成。
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  {(generatePlan.error as Error).message} 你可以重试，或回到 AI
                  COO 继续当前任务。
                </p>
                <button
                  type="button"
                  onClick={() => generatePlan.mutate()}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  重试
                </button>
              </div>
            ) : null}
          </div>

          <aside className="border-t border-blue-100 bg-blue-50/40 p-5 lg:border-l lg:border-t-0 md:p-6">
            <div className="flex items-center gap-2">
              <Fingerprint
                className="h-4 w-4 text-blue-700"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-blue-700">
                Brand DNA 输入摘要
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {brandSummary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-md)] border border-blue-100 bg-white p-3"
                >
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[var(--color-text)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section
        aria-labelledby="content-post-editor-heading"
        className="rounded-[var(--radius-lg)] border border-blue-200 bg-white p-5 shadow-sm md:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
              可编辑内容草稿
            </div>
            <h2
              id="content-post-editor-heading"
              className="mt-3 text-xl font-bold text-[var(--color-text)]"
            >
              生成、编辑并保存一篇贴文
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              选择平台后生成草稿。你可以先修改标题和正文，再保存同一份草稿并复制当前版本。
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <label
              htmlFor="content-post-platform"
              className="block text-sm font-semibold text-[var(--color-text)]"
            >
              发布平台
            </label>
            <select
              id="content-post-platform"
              value={selectedPlatform}
              onChange={(event) =>
                setSelectedPlatform(
                  event.target.value as ContentCommandCenterPlatform,
                )
              }
              disabled={generatePost.isPending}
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] md:max-w-sm"
            >
              {POST_PLATFORMS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleGeneratePost}
            disabled={generatePost.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generatePost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                正在生成贴文
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                生成贴文
              </>
            )}
          </button>
        </div>

        <div className="mt-4" aria-live="polite" role="status">
          {generatePost.isPending ? (
            <p className="text-sm text-blue-700">正在创建可编辑草稿…</p>
          ) : null}
          {generatePost.isError ? (
            <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">贴文暂时无法生成。</p>
              <p className="mt-1 text-xs leading-5 text-red-700">
                {(generatePost.error as Error).message}
              </p>
              <button
                type="button"
                onClick={handleGeneratePost}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-700 hover:text-red-800"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                重试生成
              </button>
            </div>
          ) : null}
          {copyFeedback === 'success' ? (
            <p className="text-sm font-semibold text-emerald-700">已复制当前编辑版本。</p>
          ) : null}
          {copyFeedback === 'error' ? (
            <p className="text-sm font-semibold text-red-700">{copyError}</p>
          ) : null}
        </div>

        {editorDraft ? (
          <div className="mt-5 space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5">
            <div>
              <label
                htmlFor="content-post-title"
                className="block text-sm font-semibold text-[var(--color-text)]"
              >
                贴文标题
              </label>
              <input
                id="content-post-title"
                value={editorDraft.title}
                onChange={(event) => updateEditorDraft('title', event.target.value)}
                maxLength={CONTENT_UPDATE_LIMITS.title}
                className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label
                htmlFor="content-post-body"
                className="block text-sm font-semibold text-[var(--color-text)]"
              >
                贴文正文
              </label>
              <textarea
                id="content-post-body"
                value={editorDraft.body}
                onChange={(event) => updateEditorDraft('body', event.target.value)}
                maxLength={CONTENT_UPDATE_LIMITS.body}
                rows={12}
                className="mt-2 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 text-sm leading-6 text-[var(--color-text)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs" aria-live="polite">
                {saveDraft.isPending ? (
                  <span className="font-semibold text-blue-700">正在保存草稿…</span>
                ) : saveDraft.isError ? (
                  <span className="font-semibold text-red-700">
                    保存失败：{(saveDraft.error as Error).message}。你的编辑仍保留在这里。
                  </span>
                ) : isDirty ? (
                  <span className="font-semibold text-amber-700">有未保存的编辑。</span>
                ) : savedDraft ? (
                  <span className="font-semibold text-emerald-700">
                    草稿已保存{editorDraft.updatedAt ? ` · ${new Date(editorDraft.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {saveDraft.isError ? (
                  <button
                    type="button"
                    onClick={() => editorDraft && saveDraft.mutate(editorDraft)}
                    disabled={saveDraft.isPending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    重试保存
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => editorDraft && saveDraft.mutate(editorDraft)}
                  disabled={!canSaveDraft(editorDraft, isDirty, saveDraft.isPending)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveDraft.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  保存草稿
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  disabled={!editorDraft.body.trim()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  复制当前正文
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-blue-200 bg-blue-50/50 p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">还没有可编辑贴文</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              选择平台并点击「生成贴文」，系统会创建一份可保存、可重新打开的草稿。
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              双内容方向
            </h2>
          </div>
          <div className="grid gap-3">
            {TRACKS.map((track) => {
              const calendar = trackCalendars[track.id];
              return (
                <div
                  key={track.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text)]">
                        {track.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                        {track.goal}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        calendar
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {calendar ? '已生成' : '待生成'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text)]">
                    {track.copy}
                  </p>
                  <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      CTA
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                      {track.cta}
                    </p>
                  </div>
                  {calendar ? (
                    <div className="mt-3 text-xs text-emerald-700">
                      {calendar.days} 天 · {calendar.items.length} 条内容 ·
                      第一条：{calendar.items[0]?.title}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays
              className="h-5 w-5 text-emerald-600"
              aria-hidden="true"
            />
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              内容比例
            </h2>
          </div>
          <div className="space-y-3">
            {CONTENT_MIX.map((item) => (
              <div
                key={item.type}
                className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3"
              >
                <span className="w-12 shrink-0 text-sm font-bold text-[var(--color-text)]">
                  {item.ratio}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {item.type}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                    {item.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              默认平台
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <span
                  key={platform}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            输出内容
          </h2>
        </div>
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="tablist"
          aria-label="内容引擎输出"
        >
          {OUTPUTS.map((output) => (
            <button
              key={output.id}
              type="button"
              role="tab"
              aria-selected={activeOutputTab === output.id}
              aria-controls="content-engine-output-panel"
              onClick={() => setActiveOutputTab(output.id)}
              className={`min-h-12 rounded-[var(--radius-md)] border p-3 text-left text-sm font-semibold transition ${
                activeOutputTab === output.id
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-blue-200 hover:bg-blue-50/60'
              }`}
            >
              {output.label}
            </button>
          ))}
        </div>

        <div
          id="content-engine-output-panel"
          role="tabpanel"
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4"
        >
          {!hasGeneratedPlan ? (
            <div className="flex items-start gap-3">
              <BookOpen
                className="mt-1 h-5 w-5 text-blue-600"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  内容计划还没有生成
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                  点击生成后，这里会显示 30 天日历、内容支柱、Hook
                  素材库、CTA 话术库、Retail 与 Recruitment 两套文案方向。
                </p>
                <button
                  type="button"
                  onClick={() => generatePlan.mutate()}
                  disabled={generatePlan.isPending}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {generatePlan.isPending ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      正在生成
                    </>
                  ) : (
                    '生成内容计划'
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {hasGeneratedPlan && activeOutputTab === 'calendar' ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    30 天内容日历
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Retail 与 Recruitment 两条内容线已自动生成。
                  </p>
                </div>
                <Link
                  href="/brand-builder/calendar"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  查看完整日历
                </Link>
              </div>
              <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1">
                {allCalendarItems.slice(0, 30).map((item, index) => (
                  <div
                    key={`${item.trackLabel}-${item.date}-${item.title}`}
                    className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 md:grid-cols-[120px_1fr_170px]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                        Day {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-bold text-blue-700">
                        {item.trackLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                        {item.hook}
                      </p>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      <p className="font-semibold text-[var(--color-text)]">
                        {item.platform}
                      </p>
                      <p className="mt-1">{item.format}</p>
                      <p className="mt-1">{item.cta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasGeneratedPlan && activeOutputTab === 'pillars' ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                内容支柱
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                内容支柱来自 Brand DNA，并用于分配 30 天日历。
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pillarSummary.map((item) => (
                  <div
                    key={item.pillar}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        {item.emoji} {item.pillar}
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {item.count} 条
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">
                      {item.sample}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasGeneratedPlan && activeOutputTab === 'hooks' ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Hook 素材库
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                这些开头句会用于 Facebook、Instagram、TikTok 和小红书内容。
              </p>
              <div className="mt-4 grid gap-3">
                {hookBank.map((hook, index) => (
                  <div
                    key={hook}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                  >
                    <p className="text-xs font-semibold text-blue-700">
                      Hook {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text)]">
                      {hook}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasGeneratedPlan && activeOutputTab === 'cta' ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                CTA 话术库
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                CTA 会根据内容目标自动指向私信、领取资源或了解机会。
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ctaLibrary.map((cta) => (
                  <div
                    key={cta}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm font-semibold leading-6 text-[var(--color-text)]"
                  >
                    {cta}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasGeneratedPlan && activeOutputTab === 'retail' ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Retail 文案方向
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                用于吸引客户、教育市场、推动领取资源或咨询。
              </p>
              <div className="mt-4 grid gap-3">
                {retailItems.slice(0, 8).map((item, index) => (
                  <div
                    key={`${item.date}-${item.title}`}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                  >
                    <p className="text-xs font-semibold text-blue-700">
                      Retail {index + 1} · {item.platform}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                      {item.hook}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[var(--color-text)]">
                      CTA: {item.cta}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasGeneratedPlan && activeOutputTab === 'recruitment' ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Recruitment 文案方向
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                用于吸引伙伴、说明机会、建立团队复制信任。
              </p>
              <div className="mt-4 grid gap-3">
                {recruitmentItems.slice(0, 8).map((item, index) => (
                  <div
                    key={`${item.date}-${item.title}`}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                  >
                    <p className="text-xs font-semibold text-blue-700">
                      Recruitment {index + 1} · {item.platform}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                      {item.hook}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[var(--color-text)]">
                      CTA: {item.cta}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasGeneratedPlan && activeOutputTab === 'first-seven' ? (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <PenLine
                  className="h-5 w-5 text-blue-600"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  前 7 天立即执行内容
                </h3>
              </div>
              <div className="grid gap-3">
                {previewItems.map((item, index) => (
                  <div
                    key={`${item.trackLabel}-${item.date}-${item.title}`}
                    className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 md:grid-cols-[120px_1fr_180px]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                        Day {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-bold text-blue-700">
                        {item.trackLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                        {item.hook}
                      </p>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      <p className="font-semibold text-[var(--color-text)]">
                        {item.platform}
                      </p>
                      <p className="mt-1">{item.format}</p>
                      <p className="mt-1">{item.cta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessageCircle
              className="mt-1 h-5 w-5 text-emerald-700"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                下一步：引流资源
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                内容计划确认后，系统会用同一份 Brand DNA
                生成可领取资源，承接内容带来的兴趣。
              </p>
            </div>
          </div>
          <Link
            href={hasGeneratedPlan ? '/lead-magnet' : '#'}
            aria-disabled={!hasGeneratedPlan}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 text-sm font-semibold ${
              hasGeneratedPlan
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'pointer-events-none bg-emerald-100 text-emerald-400'
            }`}
          >
            进入引流资源 <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
