'use client';

import * as React from 'react';
import { Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import type { AIVideoPromptResult, BRollItem, ShotListItem } from '../types';

type Props = {
  shotList: ShotListItem[];
  brollList: BRollItem[];
  veoPrompts?: AIVideoPromptResult | null;
  minimaxPrompts?: AIVideoPromptResult | null;
  veoCombined?: string | null;
  minimaxCombined?: string | null;
};

type Tab = 'shots' | 'broll' | 'prompts';

const DIFFICULTY: Record<string, { label: string; className: string }> = {
  easy: { label: '简单', className: 'bg-green-100 text-green-700' },
  medium: { label: '中等', className: 'bg-amber-100 text-amber-700' },
  hard: { label: '困难', className: 'bg-red-100 text-red-700' },
};

const SOURCE: Record<string, { label: string; icon: string }> = {
  film_yourself: { label: '自己拍摄', icon: '🎥' },
  stock_footage: { label: '素材网站', icon: '🌐' },
  ai_generated: { label: 'AI 生成', icon: '✨' },
  screen_recording: { label: '录屏', icon: '📱' },
};

function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? '已复制' : label}
    </button>
  );
}

function searchUrl(site: 'pexels' | 'mixkit', terms: string[]) {
  const q = encodeURIComponent(terms[0] ?? '');
  return site === 'pexels' ? `https://www.pexels.com/search/videos/${q}/` : `https://mixkit.co/free-stock-video/${q}/`;
}

export function ProductionPlanView({ shotList, brollList, veoPrompts, minimaxPrompts, veoCombined, minimaxCombined }: Props) {
  const [tab, setTab] = React.useState<Tab>('shots');
  const [promptTool, setPromptTool] = React.useState<'veo' | 'minimax'>('veo');
  const currentPrompt = promptTool === 'veo' ? veoPrompts : minimaxPrompts;
  const combined = promptTool === 'veo' ? (veoPrompts?.combined ?? veoCombined ?? '') : (minimaxPrompts?.combined ?? minimaxCombined ?? '');

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">拍摄计划</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">拍摄清单、素材清单与 AI 视频生成提示词。</p>
        </div>
        <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-1">
          {[
            ['shots', '拍摄清单'],
            ['broll', '素材清单'],
            ['prompts', 'AI 提示词'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value as Tab)}
              className={`rounded px-3 py-1.5 text-sm ${tab === value ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'shots' ? (
        <div className="space-y-3">
          {shotList.map((item) => (
            <div key={item.scene_number} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[var(--color-text)]">Scene {item.scene_number} · {item.shot_type}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY[item.difficulty]?.className ?? DIFFICULTY.easy.className}`}>
                  {DIFFICULTY[item.difficulty]?.label ?? '简单'}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text)]">主体：{item.subject}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">镜头运动：{item.camera_movement} · 时长：{item.duration_seconds}s</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">光线：{item.lighting_note}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">道具：{item.props_needed.join('、') || '无'}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'broll' ? (
        <div className="space-y-3">
          {brollList.map((item, index) => {
            const source = SOURCE[item.source_suggestion] ?? SOURCE.film_yourself;
            const terms = item.stock_search_terms ?? [];
            return (
              <div key={`${item.scene_number}-${index}`} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-semibold text-[var(--color-text)]">Scene {item.scene_number} · {source.label} {source.icon}</h3>
                <p className="mt-2 text-sm text-[var(--color-text)]">{item.description}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">时长：{item.duration_seconds}s</p>
                {terms.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)]">搜索词：{terms.join(', ')}</span>
                    <a href={searchUrl('pexels', terms)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                      Pexels <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href={searchUrl('mixkit', terms)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                      Mixkit <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === 'prompts' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPromptTool('veo')} className={`rounded-full border px-3 py-1 text-sm ${promptTool === 'veo' ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>Google Veo</button>
            <button type="button" onClick={() => setPromptTool('minimax')} className={`rounded-full border px-3 py-1 text-sm ${promptTool === 'minimax' ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>MiniMax</button>
            {combined ? <CopyButton text={combined} label={`复制全部 ${promptTool === 'veo' ? 'Veo' : 'MiniMax'} 提示词`} /> : null}
            <a href={promptTool === 'veo' ? 'https://labs.google/veo' : 'https://hailuoai.video/'} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 text-xs font-medium text-[var(--color-text)]">
              打开工具 <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {(currentPrompt?.scenes ?? []).length > 0 ? currentPrompt!.scenes.map((item) => (
            <div key={item.scene_number} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-[var(--color-text)]">Scene {item.scene_number}</h3>
                <CopyButton text={item.prompt} />
              </div>
              <p className="whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)]">{item.prompt}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">宽高比：{item.aspect_ratio} · 时长：{item.duration_hint}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">风格：{item.style_modifiers.join(', ')}</p>
              {item.negative_prompt ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">避免：{item.negative_prompt}</p> : null}
            </div>
          )) : (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
              <Sparkles className="mx-auto mb-2 h-5 w-5" />
              这个拍摄计划暂时没有需要 AI 生成的素材。
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
