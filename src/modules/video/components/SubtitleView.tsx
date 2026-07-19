'use client';

import { Download } from 'lucide-react';
import { ClipboardButton } from '@/components/ui/ClipboardButton';

export function SubtitleView({ projectId, srt }: { projectId: string; srt: string }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">字幕文件</h2>
        <div className="flex gap-2">
          <ClipboardButton sessionKey={projectId} text={srt} label="复制全部" />
          <a href={`/api/v1/video/projects/${projectId}/subtitle.srt`} className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-sm font-medium text-white">
            <Download className="h-4 w-4" />
            下载 .srt
          </a>
        </div>
      </div>
      <pre className="max-h-96 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-xs leading-relaxed text-[var(--color-text)]">{srt}</pre>
    </section>
  );
}
