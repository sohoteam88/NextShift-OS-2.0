'use client';

import * as React from 'react';
import { Mic, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import type { VoiceLanguage } from '../types';
import { Waveform } from './Waveform';

type UploadPayload = {
  file: File;
  durationSecs: number;
  language: VoiceLanguage;
};

type VoiceRecorderProps = {
  language: VoiceLanguage;
  onLanguageChange: (language: VoiceLanguage) => void;
  onUpload: (payload: UploadPayload) => Promise<unknown>;
  limitReached?: boolean;
  limitLabel?: string;
  className?: string;
};

function getMimeType() {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? 'audio/webm';
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}

async function getAudioDuration(blob: Blob) {
  return await new Promise<number>((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.max(0, Math.round(audio.duration)) : 0;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}

export function VoiceRecorder({
  language,
  onLanguageChange,
  onUpload,
  limitReached = false,
  limitLabel,
  className,
}: VoiceRecorderProps) {
  const t = useTranslations('voice');
  const [recording, setRecording] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const timerRef = React.useRef<number | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = React.useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  const stopRecording = React.useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }, []);

  const startRecording = React.useCallback(async () => {
    if (limitReached || recording || processing) return;
    setError(null);

    try {
      if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error(t('recordingFailed'));
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getMimeType();
      const recorder = new MediaRecorder(mediaStream, { mimeType });
      chunksRef.current = [];
      recorderRef.current = recorder;
      setStream(mediaStream);
      setElapsed(0);
      setRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        setError((event.error as DOMException | null)?.message ?? t('recordingFailed'));
      };

      recorder.onstop = async () => {
        clearTimer();
        setRecording(false);
        stopStream();

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        const durationSecs = await getAudioDuration(blob);
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type || 'audio/webm',
        });

        try {
          setProcessing(true);
          await onUpload({ file, durationSecs, language });
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
        } finally {
          setProcessing(false);
        }
      };

      recorder.start();
      clearTimer();
      timerRef.current = window.setInterval(() => {
        setElapsed((current) => current + 1);
      }, 1000);
    } catch (recordingError) {
      setError(recordingError instanceof Error ? recordingError.message : t('microphoneError'));
      stopStream();
      setRecording(false);
    }
  }, [clearTimer, language, limitReached, onUpload, processing, recording, stopStream, t]);

  React.useEffect(() => () => {
    clearTimer();
    stopStream();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, [clearTimer, stopStream]);

  return (
    <section className={cn('space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('recorderTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t('recorderHelp')}
          </p>
        </div>
        <Badge variant={recording ? 'warning' : processing ? 'info' : 'success'}>
          {limitReached ? t('limitReached') : recording ? t('recording') : processing ? t('processing') : t('ready')}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--color-text)]" htmlFor="voice-language">
            {t('language')}
          </label>
          <select
            id="voice-language"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value as VoiceLanguage)}
            disabled={recording || processing}
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:opacity-70"
          >
            <option value="zh">{t('languageZh')}</option>
            <option value="en">{t('languageEn')}</option>
            <option value="ms">{t('languageMs')}</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="secondary"
            icon={<StopCircle className="h-4 w-4" />}
            onClick={stopRecording}
            disabled={!recording || processing}
          >
            {t('stop')}
          </Button>
          <Button
            type="button"
            icon={<Mic className="h-4 w-4" />}
            onClick={startRecording}
            disabled={limitReached || recording || processing}
            loading={processing}
          >
            {recording ? t('recording') : t('start')}
          </Button>
        </div>
      </div>

      <Waveform stream={stream} active={recording} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-text-muted)]">
        <span>{recording ? t('recordingTime', { duration: formatDuration(elapsed) }) : t('pressStart')}</span>
        <span>{limitLabel ?? t('unlimitedUploads')}</span>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}
