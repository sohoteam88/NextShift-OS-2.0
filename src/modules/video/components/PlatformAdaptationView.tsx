'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import type { PlatformAdaptation, PlatformType } from '../types';

const PLATFORMS: Array<{ value: PlatformType; label: string }> = [
  { value: 'facebook_reel', label: 'Facebook' },
  { value: 'instagram_reel', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'youtube_shorts', label: 'YouTube' },
];

function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-xs"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? '已复制' : '复制'}
    </button>
  );
}

export function PlatformAdaptationView({
  adaptations,
  selected,
  onToggle,
}: {
  adaptations: PlatformAdaptation[];
  selected: PlatformType[];
  onToggle: (platform: PlatformType) => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">平台发布建议</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--color-text-muted)]">同时发布到：</span>
        {PLATFORMS.map((platform) => (
          <button
            key={platform.value}
            type="button"
            onClick={() => onToggle(platform.value)}
            className={`rounded-full border px-3 py-1 text-sm ${selected.includes(platform.value) ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
          >
            {platform.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {adaptations.map((item) => (
          <div key={item.platform} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <h3 className="font-semibold text-[var(--color-text)]">{item.platform}</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium">Caption</p>
                  <CopyText text={item.title_or_caption} />
                </div>
                <p className="whitespace-pre-wrap text-[var(--color-text-muted)]">{item.title_or_caption}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium">Hashtags</p>
                  <CopyText text={item.hashtags.join(' ')} />
                </div>
                <p className="text-[var(--color-primary)]">{item.hashtags.join(' ')}</p>
              </div>
              <p>封面文字：{item.cover_thumbnail_text}</p>
              <p>最佳发布时间：{item.posting_time_suggestion}</p>
              <p className="text-[var(--color-text-muted)]">{item.platform_specific_notes}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
