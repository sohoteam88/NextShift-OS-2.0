'use client';

import * as React from 'react';
import { VoiceRecorder } from '@/modules/voice/components/VoiceRecorder';
import { VOICE_INTERVIEW_PROMPT } from '../constants/interview-questions';
import type { VoiceLanguage } from '@/modules/voice/types';

type ExtractedProfile = Record<string, unknown>;

type Props = {
  interviewId: string;
  language?: string;
  onSwitchToText: () => void;
  onComplete: (profile: ExtractedProfile) => void;
};

const TIPS: Record<string, string[]> = {
  zh: ['💡 你的背景和经历', '💡 你擅长什么', '💡 你想帮助什么样的人', '💡 你希望展示什么样的形象'],
  en: ['💡 Your background and experiences', '💡 What you are good at', '💡 Who you want to help', '💡 The image you want to project'],
  ms: ['💡 Latar belakang dan pengalaman anda', '💡 Apa yang anda mahir', '💡 Siapa yang ingin anda bantu', '💡 Imej yang ingin anda tunjukkan'],
};

async function uploadVoice(file: File, durationSecs: number, language: VoiceLanguage) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);
  formData.append('duration_secs', String(durationSecs));

  const res = await fetch('/api/v1/voice/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const json = (await res.json()) as { data: { id: string } };
  return json.data.id;
}

async function triggerExtraction(interviewId: string, voiceProfileId: string): Promise<ExtractedProfile> {
  const res = await fetch(`/api/v1/brand-builder/interview/${interviewId}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_profile_id: voiceProfileId }),
  });
  if (!res.ok) throw new Error('Extraction failed');
  const json = (await res.json()) as { data: ExtractedProfile };
  return json.data;
}

export function VoiceInterview({ interviewId, language = 'zh', onSwitchToText, onComplete }: Props) {
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [extracting, setExtracting] = React.useState(false);
  const [voiceLang, setVoiceLang] = React.useState<VoiceLanguage>((language as VoiceLanguage) ?? 'zh');

  const tips = TIPS[language] ?? TIPS.zh;
  const prompt = VOICE_INTERVIEW_PROMPT[language] ?? VOICE_INTERVIEW_PROMPT.zh;

  async function handleUpload({
    file,
    durationSecs,
    language: lang,
  }: {
    file: File;
    durationSecs: number;
    language: VoiceLanguage;
  }) {
    setError(null);
    setExtracting(true);
    try {
      const voiceProfileId = await uploadVoice(file, durationSecs, lang);
      const profile = await triggerExtraction(interviewId, voiceProfileId);
      onComplete(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试');
      setExtracting(false);
    }
  }

  if (extracting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        <p className="text-sm font-medium text-[var(--color-text)]">AI 正在分析你的品牌...</p>
        <p className="text-xs text-[var(--color-text-muted)]">通常需要 30-60 秒，请稍等</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">语音自我介绍</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{prompt}</p>
      </div>

      {!recording && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">请分享：</p>
          {tips.map((tip) => (
            <p key={tip} className="text-sm text-[var(--color-text)]">{tip}</p>
          ))}
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">不需要完美，想到什么就说什么 😊</p>
        </div>
      )}

      <VoiceRecorder
        language={voiceLang}
        onLanguageChange={setVoiceLang}
        onUpload={handleUpload}
      />

      {error && (
        <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToText}
          className="text-sm text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--color-text)]"
        >
          不想录音？用文字回答 →
        </button>
      </div>
    </div>
  );
}
