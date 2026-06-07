'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Mic,
  RefreshCw,
  Save,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/stores/toast-store';
import { VoiceRecorder } from '@/modules/voice/components/VoiceRecorder';
import type { VoiceExtractionData, VoiceLanguage, VoiceListResult, VoiceRecord } from '@/modules/voice/types';
import { useApiError } from '@/hooks/useApiError';

type DraftState = {
  transcript: string;
  summary: string;
  pain_points: string;
  health_goals: string;
  story_angle: string;
  content_pillars: string;
  background: string;
  motivation: string;
  preferred_topics: string;
  tone: string;
};

type VoiceDetailResult = {
  data: VoiceRecord;
};

const EMPTY_DRAFT: DraftState = {
  transcript: '',
  summary: '',
  pain_points: '',
  health_goals: '',
  story_angle: '',
  content_pillars: '',
  background: '',
  motivation: '',
  preferred_topics: '',
  tone: '',
};

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDraft(record: VoiceRecord | null): DraftState {
  const extracted = record?.extractedData;
  if (!record || !extracted) {
    return {
      ...EMPTY_DRAFT,
      transcript: record?.transcript ?? '',
    };
  }

  return {
    transcript: record.transcript ?? '',
    summary: extracted.summary ?? '',
    pain_points: extracted.pain_points?.join('\n') ?? '',
    health_goals: extracted.health_goals?.join('\n') ?? '',
    story_angle: extracted.story_angle ?? '',
    content_pillars: extracted.content_pillars?.join('\n') ?? '',
    background: extracted.background ?? '',
    motivation: extracted.motivation ?? '',
    preferred_topics: extracted.preferred_topics?.join('\n') ?? '',
    tone: extracted.tone ?? '',
  };
}

function buildExtractionPayload(draft: DraftState, record: VoiceRecord | null): Partial<VoiceExtractionData> {
  const extracted = record?.extractedData ?? null;
  return {
    summary: draft.summary.trim(),
    pain_points: splitLines(draft.pain_points),
    health_goals: splitLines(draft.health_goals),
    story_angle: draft.story_angle.trim(),
    content_pillars: splitLines(draft.content_pillars),
    background: draft.background.trim(),
    motivation: draft.motivation.trim(),
    preferred_topics: splitLines(draft.preferred_topics),
    tone: draft.tone.trim(),
    language: extracted?.language ?? 'zh',
    duration_secs: extracted?.duration_secs ?? 0,
    source_language: extracted?.source_language ?? null,
    source_file_name: extracted?.source_file_name ?? null,
  };
}

function statusVariant(status: VoiceRecord['status']) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'failed':
      return 'danger';
    case 'review':
      return 'info';
    case 'transcribing':
    case 'extracting':
    case 'uploaded':
      return 'warning';
    default:
      return 'default';
  }
}

function statusLabel(t: (key: string) => string, status: VoiceRecord['status']) {
  switch (status) {
    case 'approved':
      return t('statusApproved');
    case 'failed':
      return t('statusFailed');
    case 'review':
      return t('statusReview');
    case 'transcribing':
      return t('statusTranscribing');
    case 'extracting':
      return t('statusExtracting');
    case 'uploaded':
      return t('statusUploaded');
    default:
      return status;
  }
}

export default function VoiceCapturePage() {
  const t = useTranslations('voice');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleError } = useApiError();

  const listQuery = useQuery({
    queryKey: ['voice-recordings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/voice/me');
      if (!res.ok) throw new Error('Failed to load voice recordings');
      return res.json() as Promise<VoiceListResult>;
    },
  });

  const latestRecord = listQuery.data?.data[0] ?? null;
  const selectedId = searchParams.get('id') ?? latestRecord?.id ?? null;

  const detailQuery = useQuery({
    queryKey: ['voice-recording', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const res = await fetch(`/api/v1/voice/${selectedId}`);
      if (!res.ok) throw new Error('Failed to load voice recording');
      return res.json() as Promise<VoiceDetailResult>;
    },
  });

  const selectedRecord = detailQuery.data?.data ?? listQuery.data?.data.find((record) => record.id === selectedId) ?? null;
  const [language, setLanguage] = React.useState<VoiceLanguage>('zh');
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT);

  React.useEffect(() => {
    if (selectedRecord) {
      setDraft(buildDraft(selectedRecord));
      setLanguage(selectedRecord.extractedData?.language ?? selectedRecord.language ?? 'zh');
    } else if (latestRecord) {
      setLanguage(latestRecord.language ?? 'zh');
    }
  }, [latestRecord, selectedRecord]);

  React.useEffect(() => {
    if (!selectedId && latestRecord?.id) {
      router.replace(`/member/voice?id=${latestRecord.id}`);
    }
  }, [latestRecord?.id, router, selectedId]);

  const uploadMutation = useMutation({
    mutationFn: async (payload: { file: File; durationSecs: number; language: VoiceLanguage }) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('duration_secs', String(payload.durationSecs));
      formData.append('language', payload.language);

      const res = await fetch('/api/v1/voice/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const payloadJson = await res.json().catch(() => null);
        throw new Error(payloadJson?.error?.message ?? 'Failed to upload voice recording');
      }

      return res.json() as Promise<VoiceDetailResult>;
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['voice-recordings'] });
      await queryClient.invalidateQueries({ queryKey: ['voice-recording', response.data.id] });
      router.replace(`/member/voice?id=${response.data.id}`);
      toast('success', t('uploadSuccess'));
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecord) throw new Error('No voice record selected');

      const res = await fetch(`/api/v1/voice/${selectedRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: draft.transcript,
          extractedData: buildExtractionPayload(draft, selectedRecord),
          status: 'review',
        }),
      });

      if (!res.ok) {
        const payloadJson = await res.json().catch(() => null);
        throw new Error(payloadJson?.error?.message ?? 'Failed to save voice profile');
      }

      return res.json() as Promise<VoiceDetailResult>;
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['voice-recordings'] });
      await queryClient.invalidateQueries({ queryKey: ['voice-recording', response.data.id] });
      toast('success', t('saved'));
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecord) throw new Error('No voice record selected');
      const res = await fetch(`/api/v1/voice/${selectedRecord.id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const payloadJson = await res.json().catch(() => null);
        throw new Error(payloadJson?.error?.message ?? 'Failed to approve voice profile');
      }
      return res.json() as Promise<VoiceDetailResult>;
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['voice-recordings'] });
      await queryClient.invalidateQueries({ queryKey: ['voice-recording', response.data.id] });
      toast('success', t('approved'));
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecord) throw new Error('No voice record selected');
      const res = await fetch(`/api/v1/voice/${selectedRecord.id}/retry`, { method: 'POST' });
      if (!res.ok) {
        const payloadJson = await res.json().catch(() => null);
        throw new Error(payloadJson?.error?.message ?? 'Failed to retry voice profile');
      }
      return res.json() as Promise<VoiceDetailResult>;
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['voice-recordings'] });
      await queryClient.invalidateQueries({ queryKey: ['voice-recording', response.data.id] });
      router.replace(`/member/voice?id=${response.data.id}`);
      toast('success', t('retried'));
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecord) throw new Error('No voice record selected');
      const res = await fetch(`/api/v1/voice/${selectedRecord.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payloadJson = await res.json().catch(() => null);
        throw new Error(payloadJson?.error?.message ?? 'Failed to delete voice profile');
      }
      return res.json() as Promise<{ data: { id: string } }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['voice-recordings'] });
      router.replace('/member/voice');
      toast('success', t('deleted'));
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const limitReached = (listQuery.data?.meta.todayCount ?? 0) >= (listQuery.data?.meta.limitPerDay ?? 3);

  if (listQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/member" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            {t('backToMember')}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={limitReached ? 'warning' : 'info'}>
            {t('usageCount', {
              used: listQuery.data?.meta.todayCount ?? 0,
              limit: listQuery.data?.meta.limitPerDay ?? 3,
            })}
          </Badge>
          {selectedRecord ? <Badge variant={statusVariant(selectedRecord.status)}>{statusLabel(t, selectedRecord.status)}</Badge> : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <VoiceRecorder
            language={language}
            onLanguageChange={setLanguage}
            limitReached={limitReached}
            onUpload={(payload) => uploadMutation.mutateAsync(payload)}
          />

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('recordingsTitle')}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('recordingsHelp')}</p>
              </div>
              <Badge variant="default">{t('recordingsCount', { count: listQuery.data?.meta.total ?? 0 })}</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {(listQuery.data?.data ?? []).length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  {t('emptyState')}
                </div>
              ) : (
                listQuery.data!.data.map((record) => {
                  const active = record.id === selectedRecord?.id;
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => router.replace(`/member/voice?id=${record.id}`)}
                      className={[
                        'flex w-full items-start justify-between gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-colors',
                        active
                          ? 'border-[var(--color-primary)] bg-blue-50'
                          : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)]',
                      ].join(' ')}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--color-text)]">
                            {record.extractedData?.summary?.slice(0, 72) || t('untitledRecording')}
                          </span>
                          <Badge variant={statusVariant(record.status)}>{statusLabel(t, record.status)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {record.extractedData?.language?.toUpperCase() ?? 'ZH'} · {record.durationSecs ?? 0}s
                        </p>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('reviewTitle')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('reviewHelp')}</p>
            </div>
            {selectedRecord ? <Badge variant={statusVariant(selectedRecord.status)}>{statusLabel(t, selectedRecord.status)}</Badge> : null}
          </div>

          {selectedRecord ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Save className="h-4 w-4" />}
                  loading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {t('saveDraft')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={approveMutation.isPending}
                  onClick={async () => {
                    try {
                      await saveMutation.mutateAsync();
                      await approveMutation.mutateAsync();
                    } catch {
                      // handled by mutation toasts
                    }
                  }}
                  disabled={selectedRecord.status === 'approved'}
                >
                  {t('approve')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className="h-4 w-4" />}
                  loading={retryMutation.isPending}
                  onClick={() => retryMutation.mutate()}
                  disabled={selectedRecord.status !== 'failed'}
                >
                  {t('retry')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('confirmDelete'))) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  {t('delete')}
                </Button>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2 text-[var(--color-text)]">
                  <Mic className="h-4 w-4 text-[var(--color-primary)]" />
                  {t('audioPreview')}
                </div>
                <audio controls src={selectedRecord.audioUrl} className="mt-3 w-full" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-text)]">{t('language')}</span>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]">
                    {selectedRecord.language.toUpperCase()}
                  </div>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-text)]">{t('duration')}</span>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]">
                    {selectedRecord.durationSecs ?? 0}s
                  </div>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-[var(--color-text)]">{t('transcript')}</span>
                <textarea
                  value={draft.transcript}
                  onChange={(event) => setDraft((current) => ({ ...current, transcript: event.target.value }))}
                  rows={6}
                  className="min-h-32 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-4">
                {[
                  ['summary', t('summary')],
                  ['pain_points', t('painPoints')],
                  ['health_goals', t('healthGoals')],
                  ['story_angle', t('storyAngle')],
                  ['content_pillars', t('contentPillars')],
                  ['background', t('background')],
                  ['motivation', t('motivation')],
                  ['preferred_topics', t('preferredTopics')],
                  ['tone', t('tone')],
                ].map(([key, label]) => {
                  const currentKey = key as keyof DraftState;
                  return (
                    <label key={key} className="block space-y-1">
                      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
                      {currentKey === 'tone' || currentKey === 'story_angle' || currentKey === 'summary' ? (
                        <input
                          value={draft[currentKey]}
                          onChange={(event) => setDraft((current) => ({ ...current, [currentKey]: event.target.value }))}
                          className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <textarea
                          value={draft[currentKey]}
                          onChange={(event) => setDraft((current) => ({ ...current, [currentKey]: event.target.value }))}
                          rows={currentKey === 'background' ? 4 : 3}
                          className="min-h-24 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
                        />
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                  <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                  {t('profileSync')}
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('profileSyncHelp')}</p>
                <div className="mt-3 rounded-[var(--radius-md)] bg-white p-3 text-sm text-[var(--color-text)]">
                  {draft.summary || t('profileSyncEmpty')}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
              <Wand2 className="mx-auto h-5 w-5 text-[var(--color-primary)]" />
              <p className="mt-3">{t('noSelection')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
