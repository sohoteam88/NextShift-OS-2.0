'use client';

import * as React from 'react';
import { Sparkles, Loader2, Copy, Check, RefreshCw, Smartphone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SceneCard, type SceneBlock } from './SceneCard';

type Platform = 'facebook_reel' | 'instagram_reel' | 'tiktok' | 'story';
type Duration = '15s' | '30s' | '60s';
type Style = 'talking_head' | 'faceless' | 'broll_voiceover' | 'tutorial';

type VideoScript = {
  title: string;
  duration: string;
  hook: SceneBlock & { time?: string };
  scenes: (SceneBlock & { time?: string })[];
  cta: SceneBlock;
  music_mood: string;
  hashtags: string[];
  caption: string;
  equipment_needed: string;
};

type Props = {
  defaultTopic?: string;
  defaultPlatform?: Platform;
  calendarId?: string;
  onScriptSaved?: (calendarId: string) => void;
};

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string }> = [
  { value: 'facebook_reel', label: 'FB Reel' },
  { value: 'instagram_reel', label: 'IG Reel' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'story', label: 'Story' },
];

const DURATION_OPTIONS: Array<{ value: Duration; label: string }> = [
  { value: '15s', label: '15 秒' },
  { value: '30s', label: '30 秒' },
  { value: '60s', label: '60 秒' },
];

const STYLE_OPTIONS: Array<{ value: Style; label: string; desc: string }> = [
  { value: 'talking_head', label: '真人出镜', desc: '面对镜头说话' },
  { value: 'faceless', label: '无需露脸', desc: '字幕+画面' },
  { value: 'broll_voiceover', label: '旁白+画面', desc: '电影感旁白' },
  { value: 'tutorial', label: '教程演示', desc: '手把手教学' },
];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? '已复制 ✓' : label}
    </button>
  );
}

function buildFullScript(script: VideoScript): string {
  const lines: string[] = [`🎬 ${script.title}`, `⏱ ${script.duration} · 🎵 ${script.music_mood}`, ''];
  lines.push('── Hook ──', `📷 画面: ${script.hook.visual}`, `📝 字幕: ${script.hook.text_overlay}`, `🎤 旁白: ${script.hook.voiceover}`, '');
  script.scenes.forEach((s, i) => {
    lines.push(`── Scene ${i + 1} ──`, `📷 画面: ${s.visual}`, `📝 字幕: ${s.text_overlay}`, `🎤 旁白: ${s.voiceover}`, '');
  });
  lines.push('── CTA ──', `📷 画面: ${script.cta.visual}`, `📝 字幕: ${script.cta.text_overlay}`, `🎤 旁白: ${script.cta.voiceover}`, '');
  lines.push(`📋 Caption:\n${script.caption}`, '', `🏷 Hashtags:\n${script.hashtags.join(' ')}`, '', `📱 设备: ${script.equipment_needed}`);
  return lines.join('\n');
}

export function VideoScriptGenerator({
  defaultTopic = '',
  defaultPlatform = 'facebook_reel',
  calendarId,
  onScriptSaved,
}: Props) {
  const [topic, setTopic] = React.useState(defaultTopic);
  const [platform, setPlatform] = React.useState<Platform>(defaultPlatform);
  const [duration, setDuration] = React.useState<Duration>('30s');
  const [style, setStyle] = React.useState<Style>('talking_head');
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [script, setScript] = React.useState<VideoScript | null>(null);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [draftSaved, setDraftSaved] = React.useState(false);
  const [dragFrom, setDragFrom] = React.useState<number | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    setScript(null);
    setDraftSaved(false);
    try {
      const res = await fetch('/api/v1/brand-builder/video-script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, duration, style, calendarId }),
      });
      const json = (await res.json()) as { data?: VideoScript; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      setScript(json.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generating script');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!script) return;
    setSavingDraft(true);
    try {
      const caption = script.caption;
      const res = await fetch('/api/v1/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: buildFullScript(script),
          platform: platform.replace('_reel', ''),
          title: script.title,
          status: 'draft',
          promptUsed: topic,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const json = (await res.json()) as { data?: { id: string } };
      const contentId = json.data?.id;
      // Link to calendar item and update status if calendarId given
      if (calendarId && contentId) {
        await fetch(`/api/v1/brand-builder/calendar/${calendarId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'drafted', contentId }),
        });
        onScriptSaved?.(calendarId);
      }
      void caption; // used above
      setDraftSaved(true);
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSavingDraft(false);
    }
  }

  function updateHook(updated: SceneBlock) {
    setScript((s) => s ? { ...s, hook: { ...s.hook, ...updated } } : s);
  }

  function updateScene(idx: number, updated: SceneBlock) {
    setScript((s) => {
      if (!s) return s;
      const scenes = [...s.scenes];
      scenes[idx] = { ...scenes[idx], ...updated };
      return { ...s, scenes };
    });
  }

  function updateCta(updated: SceneBlock) {
    setScript((s) => s ? { ...s, cta: { ...s.cta, ...updated } } : s);
  }

  function handleDragStart(_e: React.DragEvent, idx: number) {
    setDragFrom(idx);
  }

  function handleDrop(_e: React.DragEvent, dropIdx: number) {
    if (dragFrom === null || dragFrom === dropIdx) return;
    setScript((s) => {
      if (!s) return s;
      const scenes = [...s.scenes];
      const [moved] = scenes.splice(dragFrom, 1);
      if (moved) scenes.splice(dropIdx, 0, moved);
      return { ...s, scenes };
    });
    setDragFrom(null);
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        {/* Topic */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">视频主题</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例：3个让你越来越有活力的早晨习惯"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            maxLength={200}
          />
        </div>

        {/* Platform */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">平台</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlatform(opt.value)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  platform === opt.value
                    ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">时长</label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(opt.value)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  duration === opt.value
                    ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">拍摄方式</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStyle(opt.value)}
                className={cn(
                  'rounded-[var(--radius-md)] border p-3 text-left transition-colors',
                  style === opt.value
                    ? 'border-[var(--color-primary)] bg-blue-50'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]',
                )}
              >
                <p className={cn('text-sm font-medium', style === opt.value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]')}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={!topic.trim() || generating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              ✨ 生成脚本
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {script && (
        <div className="space-y-5">
          {/* Title + meta */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">🎬 {script.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <span>⏱ {script.duration}</span>
              <span>·</span>
              <span>🎵 {script.music_mood}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5" />
                {script.equipment_needed}
              </span>
            </div>
          </div>

          {/* Hook */}
          <SceneCard
            scene={script.hook}
            index={-1}
            label="Hook"
            badge={script.hook.time ?? '0-3s'}
            onChange={updateHook}
          />

          {/* Scenes */}
          {script.scenes.map((scene, idx) => (
            <SceneCard
              key={idx}
              scene={scene}
              index={idx}
              label={`Scene ${idx + 1}`}
              badge={scene.time}
              draggable
              isDragging={dragFrom === idx}
              onDragStart={handleDragStart}
              onDragOver={(_e, i) => setDragFrom(i)}
              onDrop={handleDrop}
              onChange={(updated) => updateScene(idx, updated)}
            />
          ))}

          {/* CTA */}
          <SceneCard
            scene={script.cta}
            index={-2}
            label="CTA"
            onChange={updateCta}
          />

          {/* Caption */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">📋 Caption</h4>
              <CopyButton text={script.caption} label="复制 Caption" />
            </div>
            <p className="whitespace-pre-wrap text-sm text-[var(--color-text)]">{script.caption}</p>
          </div>

          {/* Hashtags */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">🏷 Hashtags</h4>
              <CopyButton text={script.hashtags.join(' ')} label="复制 Hashtags" />
            </div>
            <div className="flex flex-wrap gap-2">
              {script.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <CopyButton text={buildFullScript(script)} label="复制完整脚本" />
            <button
              type="button"
              onClick={() => void handleSaveDraft()}
              disabled={savingDraft || draftSaved}
              className={cn(
                'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium transition-colors',
                draftSaved
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)]',
              )}
            >
              {savingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : draftSaved ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : null}
              {draftSaved ? '已保存草稿' : '保存为草稿'}
            </button>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              重新生成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
