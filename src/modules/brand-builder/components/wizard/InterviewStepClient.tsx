'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  FileText,
  Fingerprint,
  LayoutTemplate,
  Mic,
  RadioTower,
  RotateCcw,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { VoiceRecorder } from '@/modules/voice/components/VoiceRecorder';
import type { VoiceLanguage } from '@/modules/voice/types';
// O2 deliberately reuses the owned guided-funnel surface; dialogue remains available below.
// eslint-disable-next-line no-restricted-imports
import { ForkedInterviewExperience } from '@/modules/brand-discovery/components/ForkedInterviewExperience';

type ExtractedProfile = Record<string, unknown>;

type DialogueMessage = {
  role: 'ai' | 'user';
  type: 'text' | 'voice';
  content: string;
  ts?: string;
};

type DialogueState = {
  messages?: DialogueMessage[];
  turn_count?: number;
  slots?: Record<string, { value?: string; status?: string }>;
};

type InterviewRecord = {
  id: string;
  answers?: Record<string, unknown>;
};

type VoiceUploadResponse = {
  data?: {
    id: string;
    transcript?: string | null;
    audioUrl?: string;
  };
};

type Props = {
  existingInterviewId?: string;
};

const FALLBACK_OPENING =
  '嗨，我是你的品牌教练 👋 先别紧张，我们就随便聊聊。你现在平时都在忙些什么呀？';

const CAPTURE_FIELDS = [
  {
    label: '你是谁',
    hint: '身份、经历、为什么开始',
    keys: ['identity', 'role', 'background', 'personal_story', 'story', 'bio'],
  },
  {
    label: '产品 / 服务',
    hint: '你卖什么、解决什么问题',
    keys: ['product', 'service', 'offer', 'business', 'solution'],
  },
  {
    label: '目标受众',
    hint: '你想吸引哪一种人',
    keys: ['audience', 'target', 'customer', 'avatar', 'who'],
  },
  {
    label: '核心痛点',
    hint: '客户现在卡在哪里',
    keys: ['pain', 'problem', 'challenge', 'struggle', 'blocker'],
  },
  {
    label: '信任证明',
    hint: '案例、经历、结果、资格',
    keys: ['proof', 'credibility', 'trust', 'result', 'testimonial', 'authority'],
  },
  {
    label: '零售方向',
    hint: '谁会购买产品或服务',
    keys: ['retail', 'buyer', 'customer_goal', 'retail_goal'],
  },
  {
    label: '招募方向',
    hint: '谁适合成为伙伴',
    keys: ['recruit', 'recruitment', 'partner', 'team', 'opportunity'],
  },
  {
    label: '行动入口',
    hint: '预约、领取、WhatsApp、私信',
    keys: ['cta', 'action', 'whatsapp', 'lead_magnet', 'booking'],
  },
];

const OUTPUT_PIPELINE = [
  { label: 'Brand DNA', help: '定位、受众、故事、Offer', icon: Fingerprint },
  { label: '内容引擎', help: '零售/招募两套内容方向', icon: FileText },
  { label: '引流资源', help: '让目标受众愿意留下资料', icon: Target },
  { label: '双漏斗落地页', help: '零售漏斗 + 招募漏斗', icon: LayoutTemplate },
  { label: '流量测试', help: '把内容和漏斗接到真实流量', icon: RadioTower },
];

function findCapturedValue(
  slots: Record<string, { value?: string; status?: string }>,
  keys: string[],
) {
  const entry = Object.entries(slots).find(([slot]) => {
    const normalized = slot.toLowerCase().replace(/[^a-z0-9]/g, '');
    return keys.some((key) => normalized.includes(key.replace(/[^a-z0-9]/g, '')));
  });
  if (!entry) return null;
  return entry[1];
}

function isCaptured(status?: string) {
  return status === 'filled' || status === 'partial';
}

function getDialogue(record?: InterviewRecord | null): DialogueState | null {
  const raw = record?.answers?.__dialogue;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as DialogueState;
}

function getMessages(record?: InterviewRecord | null, opening = FALLBACK_OPENING) {
  const messages = getDialogue(record)?.messages;
  if (Array.isArray(messages) && messages.length > 0) return messages;
  return [{ role: 'ai', type: 'text', content: opening, ts: new Date().toISOString() }] satisfies DialogueMessage[];
}

function BrandIntelligencePanel({ dialogue }: { dialogue: DialogueState | null }) {
  const slots = dialogue?.slots ?? {};
  const captured = CAPTURE_FIELDS.map((field) => ({
    ...field,
    slot: findCapturedValue(slots, field.keys),
  }));
  const complete = captured.filter((field) => isCaptured(field.slot?.status)).length;
  const nextGap = captured.find((field) => !isCaptured(field.slot?.status));

  return (
    <aside className="space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">实时 Brand DNA 提取</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              AI 会边聊边整理后续系统要用的业务资料。
            </p>
          </div>
          <Badge variant={complete >= CAPTURE_FIELDS.length ? 'success' : 'info'}>
            {complete}/{CAPTURE_FIELDS.length}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          {captured.map((field) => {
            const done = isCaptured(field.slot?.status);
            return (
              <div
                key={field.label}
                className={cn(
                  'rounded-[var(--radius-md)] border px-3 py-2',
                  done ? 'border-emerald-100 bg-emerald-50' : 'border-[var(--color-border)] bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text)]">{field.label}</span>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-slate-200" />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">
                  {done && field.slot?.value ? field.slot.value : field.hint}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className={cn(
            'mt-4 rounded-[var(--radius-md)] px-3 py-2 text-xs leading-5',
            nextGap ? 'border border-amber-100 bg-amber-50 text-amber-800' : 'border border-emerald-100 bg-emerald-50 text-emerald-800',
          )}
        >
          {nextGap
            ? `下一步优先补齐：${nextGap.label}。`
            : '资料已经足够生成 Brand DNA。'}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-blue-900">访谈完成后会生成什么？</p>
        <div className="mt-3 space-y-3">
          {OUTPUT_PIPELINE.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-950">{item.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-blue-800">{item.help}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function InterviewLoadingRoom() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_340px]">
      <section className="min-h-[620px] animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
      <aside className="space-y-4">
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        <div className="h-56 animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
      </aside>
    </div>
  );
}

function SuggestedPrompts({ onPick, disabled }: { onPick: (value: string) => void; disabled: boolean }) {
  const prompts = [
    '我主要想先吸引零售客户。',
    '我也想招募愿意一起做的人。',
    '我的客户最大问题是没有方向，不知道从哪里开始。',
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPick(prompt)}
          disabled={disabled}
          className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

function StartBrief() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[
        ['1', '像顾问聊天', '不用一次填完表格，AI 会一题一题追问。'],
        ['2', '边聊边提取', '右侧会显示已捕捉的 Brand DNA 资料。'],
        ['3', '生成下游系统', '完成后进入 Brand DNA，并驱动内容、引流和双漏斗。'],
      ].map(([step, title, copy]) => (
        <div key={step} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[var(--color-primary)]">
            {step}
          </span>
          <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{copy}</p>
        </div>
      ))}
    </div>
  );
}

function BusinessRoomHeader({
  analyzing,
  onFinish,
}: {
  analyzing: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">AI Business Interview Room</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
            先让 AI 真的理解你的业务。
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            这个访谈会成为 Brand DNA、内容引擎、引流资源、零售漏斗和招募漏斗的资料来源。你只需要像聊天一样回答，AI 会帮你整理成可执行的商业系统。
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onFinish} loading={analyzing}>
          生成 Brand DNA
        </Button>
      </div>
      <StartBrief />
    </div>
  );
}

export function InterviewStepClient({ existingInterviewId }: Props) {
  const searchParams = useSearchParams();
  // Retain the existing dialogue experience for its established route/tests;
  // O2 makes the guided funnel the default interview surface.
  if (searchParams.get('experience') !== 'dialogue') {
    return <ForkedInterviewExperience existingInterviewId={existingInterviewId} />;
  }

  return <LegacyInterviewStepClient existingInterviewId={existingInterviewId} />;
}

function LegacyInterviewStepClient({ existingInterviewId }: Props) {
  const router = useRouter();
  const t = useTranslations('brandBuilder.interview');
  const [interviewId, setInterviewId] = React.useState<string | null>(existingInterviewId ?? null);
  const [messages, setMessages] = React.useState<DialogueMessage[]>([]);
  const [dialogue, setDialogue] = React.useState<DialogueState | null>(null);
  const [draft, setDraft] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [voiceOpen, setVoiceOpen] = React.useState(false);
  const [language, setLanguage] = React.useState<VoiceLanguage>('zh');
  const [voiceDraft, setVoiceDraft] = React.useState<{ transcript: string; audioUrl?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending, analyzing, voiceDraft]);

  React.useEffect(() => {
    let cancelled = false;

    async function createInterview() {
      const res = await fetch('/api/v1/brand-builder/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'dialogue', opening: t('aiOpening') }),
      });
      if (!res.ok) throw new Error('Failed to create interview');
      return (await res.json()) as { data: InterviewRecord };
    }

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        if (existingInterviewId) {
          const res = await fetch('/api/v1/brand-builder/interview');
          if (!res.ok) throw new Error('Failed to load interview');
          const json = (await res.json()) as { data?: InterviewRecord | null };
          if (cancelled) return;
          if (getDialogue(json.data)) {
            setInterviewId(json.data?.id ?? existingInterviewId);
            setDialogue(getDialogue(json.data));
            setMessages(getMessages(json.data, t('aiOpening')));
            return;
          }
          const created = await createInterview();
          if (cancelled) return;
          setInterviewId(created.data.id);
          setDialogue(getDialogue(created.data));
          setMessages(getMessages(created.data, t('aiOpening')));
          return;
        }

        const json = await createInterview();
        if (cancelled) return;
        setInterviewId(json.data.id);
        setDialogue(getDialogue(json.data));
        setMessages(getMessages(json.data, t('aiOpening')));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [existingInterviewId, t]);

  async function finish(endedBy: 'ai' | 'user' | 'hardcap') {
    if (!interviewId || analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/brand-builder/interview/${interviewId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ended_by: endedBy }),
      });
      if (!res.ok) throw new Error('分析失败，请稍后再试');
      await res.json() as { data: ExtractedProfile };
      router.push('/brand-builder/step/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请稍后再试');
      setAnalyzing(false);
    }
  }

  async function sendMessage(content: string, type: 'text' | 'voice' = 'text', audioUrl?: string) {
    const trimmed = content.trim();
    if (!interviewId || !trimmed || sending || analyzing) return;

    const optimistic: DialogueMessage = {
      role: 'user',
      type,
      content: trimmed,
      ts: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setDraft('');
    setVoiceDraft(null);
    setVoiceOpen(false);
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/brand-builder/interview/${interviewId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, type, audio_url: audioUrl }),
      });
      if (!res.ok) throw new Error('发送失败，请再试一次');
      const json = (await res.json()) as {
        data: {
          dialogue: DialogueState;
          is_complete: boolean;
          completion_reason?: string | null;
        };
      };
      setDialogue(json.data.dialogue);
      setMessages(json.data.dialogue.messages ?? []);
      if (json.data.is_complete) {
        await finish(json.data.completion_reason === 'hardcap' ? 'hardcap' : 'ai');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请再试一次');
      setMessages((current) => current.filter((message) => message !== optimistic));
    } finally {
      setSending(false);
    }
  }

  async function uploadVoice(payload: { file: File; durationSecs: number; language: VoiceLanguage }) {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('duration_secs', String(payload.durationSecs));
    formData.append('language', payload.language);

    const res = await fetch('/api/v1/voice/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(res.status === 429 ? t('uploadLimitReached') : 'Voice upload failed');
    }

    const json = (await res.json()) as VoiceUploadResponse;
    const transcript = json.data?.transcript?.trim();
    if (!transcript) throw new Error('No transcript returned');
    setVoiceDraft({ transcript, audioUrl: json.data?.audioUrl });
  }

  async function handleSkip() {
    await fetch('/api/v1/brand-builder/wizard/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'interview' }),
    });
    router.push('/brand-builder/step/profile');
  }

  if (loading) {
    return <InterviewLoadingRoom />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 pb-8">
      <BusinessRoomHeader analyzing={analyzing} onFinish={() => void finish('user')} />

      {error ? (
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">AI 访谈暂时无法继续。</p>
            <p className="mt-1 leading-6">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[var(--color-primary)]">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">NextShift AI Business Coach</p>
                <p className="text-xs text-[var(--color-text-muted)]">正在建立你的 Brand DNA 资料库</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={analyzing ? 'info' : sending ? 'warning' : 'success'}>
                {analyzing ? t('analyzing') : sending ? 'AI 思考中' : 'Ready'}
              </Badge>
              <Badge variant="default">{dialogue?.turn_count ?? 0} turns</Badge>
            </div>
          </div>

          <div className="max-h-[560px] min-h-[460px] space-y-4 overflow-y-auto bg-[var(--color-surface)] px-4 py-5">
            {messages.map((message, index) => (
              <div
                key={`${message.ts ?? index}-${index}`}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm',
                    message.role === 'user'
                      ? 'rounded-br-md bg-[var(--color-primary)] text-white'
                      : 'rounded-bl-md border border-[var(--color-border)] bg-white text-[var(--color-text)]',
                  )}
                >
                  {message.type === 'voice' ? (
                    <span className="mb-1 inline-flex items-center gap-1 text-xs opacity-80">
                      <Mic className="h-3 w-3" />
                      {t('btnVoice')}
                    </span>
                  ) : null}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-muted)] shadow-sm">
                  AI 正在判断下一题...
                </div>
              </div>
            ) : null}

            {analyzing ? (
              <div className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[var(--color-primary)]">
                {t('analyzing')}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[var(--color-border)] bg-white p-4">
            <div className="mb-3">
              <SuggestedPrompts onPick={setDraft} disabled={sending || analyzing} />
            </div>

            {voiceDraft ? (
              <div className="mb-3 rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm font-medium text-[var(--color-text)]">{t('voiceConfirm')}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">{voiceDraft.transcript}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" icon={<Check className="h-4 w-4" />} onClick={() => void sendMessage(voiceDraft.transcript, 'voice', voiceDraft.audioUrl)}>
                    {t('voiceUse')}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setVoiceDraft(null)}>
                    {t('voiceRetry')}
                  </Button>
                </div>
              </div>
            ) : null}

            {voiceOpen ? (
              <VoiceRecorder
                language={language}
                onLanguageChange={setLanguage}
                onUpload={uploadVoice}
                className="mb-3"
              />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(draft);
                  }
                }}
                placeholder={t('inputPlaceholder')}
                rows={2}
                disabled={sending || analyzing}
                className="min-h-12 resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
              <Button
                type="button"
                variant="secondary"
                icon={<Mic className="h-4 w-4" />}
                onClick={() => setVoiceOpen((current) => !current)}
                disabled={sending || analyzing}
              >
                {t('btnVoice')}
              </Button>
              <Button
                type="button"
                icon={<Send className="h-4 w-4" />}
                onClick={() => void sendMessage(draft)}
                disabled={!draft.trim() || sending || analyzing}
                loading={sending}
              >
                {t('btnSend')}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
              <span>建议回答完整一点，AI 才能生成更准的内容、引流资源和双漏斗。</span>
              <button type="button" onClick={() => void handleSkip()} className="font-medium hover:text-[var(--color-text)]">
                暂时跳过，手动填写 Brand DNA
              </button>
            </div>
          </div>
        </section>

        <BrandIntelligencePanel dialogue={dialogue} />
      </div>
    </div>
  );
}
