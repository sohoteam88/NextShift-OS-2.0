'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Mic, RotateCcw, Send, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { VoiceRecorder } from '@/modules/voice/components/VoiceRecorder';
import type { VoiceLanguage } from '@/modules/voice/types';

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

function BrandReadiness({ dialogue }: { dialogue: DialogueState | null }) {
  const t = useTranslations('brandBuilder.interview');
  const slots = dialogue?.slots ?? {};
  const values = Object.values(slots);
  const complete = values.filter((slot) => slot.status === 'filled' || slot.status === 'partial').length;
  const readiness = values.length ? Math.round((complete / values.length) * 100) : 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">{t('confidenceTitle')}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{dialogue?.turn_count ?? 0} turns</p>
        </div>
        <span className="text-2xl font-semibold text-[var(--color-text)]">{readiness}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-[var(--color-primary)] transition-all"
          style={{ width: `${readiness}%` }}
        />
      </div>
    </div>
  );
}

export function InterviewStepClient({ existingInterviewId }: Props) {
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

  async function completeWithProfile(profile: ExtractedProfile) {
    await fetch('/api/v1/brand-builder/wizard/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: 'interview', interviewId }),
    });
    await fetch('/api/v1/brand-builder/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    router.push('/brand-builder/step/profile');
  }

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
      const json = (await res.json()) as { data: ExtractedProfile };
      await completeWithProfile(json.data);
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
      throw new Error(res.status === 429 ? t('dailyLimit') : 'Voice upload failed');
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
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Brand Discovery</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">{t('subtitle')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void finish('user')} loading={analyzing}>
          {t('btnFinish')}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[var(--color-primary)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">NextShift Coach</p>
                <p className="text-xs text-[var(--color-text-muted)]">AI dialogue</p>
              </div>
            </div>
            <Badge variant={analyzing ? 'info' : sending ? 'warning' : 'success'}>
              {analyzing ? t('analyzing') : sending ? 'Thinking' : 'Ready'}
            </Badge>
          </div>

          <div className="max-h-[560px] min-h-[420px] space-y-4 overflow-y-auto bg-[var(--color-surface)] px-4 py-5">
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
                  ...
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
              <span>{t('dailyLimit')}</span>
              <button type="button" onClick={() => void handleSkip()} className="hover:text-[var(--color-text)]">
                Skip
              </button>
            </div>

            {error ? (
              <div className="mt-3 rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <BrandReadiness dialogue={dialogue} />
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[var(--color-text)]">Slots</p>
            <div className="mt-3 space-y-2">
              {Object.entries(dialogue?.slots ?? {}).map(([slot, value]) => (
                <div key={slot} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-[var(--color-text-muted)]">{slot.replace(/_/g, ' ')}</span>
                  <Badge variant={value.status === 'filled' ? 'success' : value.status === 'partial' ? 'info' : 'default'}>
                    {value.status ?? 'empty'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
