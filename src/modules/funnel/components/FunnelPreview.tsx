'use client';
import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import type { FunnelConfig } from '../types';
import { SectionRenderer } from './sections/SectionRenderer';

type Props = { config: FunnelConfig };

const DEFAULT_THEME = { primary_color: '#2563eb', bg_color: '#ffffff', font: 'system' as const };

export function FunnelPreview({ config }: Props) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const theme = config.theme ?? DEFAULT_THEME;
  const sections = config.sections ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Device toggle */}
      <div className="flex items-center justify-center gap-2 border-b border-[var(--color-border)] pb-3">
        <button
          onClick={() => setDevice('mobile')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
            device === 'mobile' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <Smartphone className="h-4 w-4" /> 手机
        </button>
        <button
          onClick={() => setDevice('desktop')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
            device === 'desktop' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <Monitor className="h-4 w-4" /> 桌面
        </button>
      </div>

      {/* Preview area */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto pt-4">
        <div
          className="w-full overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-md"
          style={{
            width: device === 'mobile' ? 'min(100%, 375px)' : '100%',
            maxHeight: 'calc(100vh - 260px)',
            backgroundColor: theme.bg_color,
            fontFamily: theme.font === 'system' ? 'system-ui, sans-serif' : theme.font,
          }}
        >
          {sections.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              添加第一个 Section 开始
            </div>
          ) : (
            sections.map((section, i) => (
              <SectionRenderer key={i} section={section} theme={theme} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
