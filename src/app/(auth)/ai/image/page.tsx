'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Download, ImageIcon, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'square' | 'landscape' | 'portrait';
type Style = 'realistic' | 'professional' | 'lifestyle' | 'illustration' | 'minimal';

type GenerateInput = {
  prompt: string;
  style: Style;
  platform: Platform;
  enhancePrompt: boolean;
};

type GenerateResult = {
  imageBase64: string;
  revisedPrompt: string;
  platform: Platform;
  style: Style;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const PLATFORMS: { value: Platform; label: string; desc: string; ratio: string }[] = [
  { value: 'square',    label: '正方形',  desc: 'Instagram / 小红书',  ratio: '1:1' },
  { value: 'landscape', label: '横向',    desc: 'Facebook / 封面图',   ratio: '16:9' },
  { value: 'portrait',  label: '竖向',    desc: 'Stories / TikTok',   ratio: '9:16' },
];

const STYLES: { value: Style; label: string; emoji: string }[] = [
  { value: 'realistic',    label: '真实照片', emoji: '📷' },
  { value: 'lifestyle',    label: '生活风格', emoji: '🌿' },
  { value: 'professional', label: '商务专业', emoji: '💼' },
  { value: 'illustration', label: '插画风格', emoji: '🎨' },
  { value: 'minimal',      label: '简约设计', emoji: '⬜' },
];

const PROMPT_EXAMPLES = [
  '一位自信的马来西亚女性在咖啡馆工作，笔记本电脑，专业感',
  '健康营养产品摆放整齐，白色背景，高端感',
  '团队合作场景，多元文化，现代办公室',
  '成功的创业者展示产品，真实生活场景',
  '社交媒体内容创作，手机拍摄，网红风格',
];

// ─── API ─────────────────────────────────────────────────────────────────────

async function generateImage(input: GenerateInput): Promise<GenerateResult> {
  const res = await fetch('/api/v1/ai/generate/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? '生成失败，请重试');
  }
  const json = await res.json() as { data: GenerateResult };
  return json.data;
}

// ─── Download helper ──────────────────────────────────────────────────────────

function downloadImage(base64: string, platform: Platform) {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = `nextshift-image-${platform}-${Date.now()}.png`;
  link.click();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIImagePage() {
  const [prompt, setPrompt] = React.useState('');
  const [platform, setPlatform] = React.useState<Platform>('square');
  const [style, setStyle] = React.useState<Style>('realistic');
  const [enhancePrompt, setEnhancePrompt] = React.useState(true);

  const mutation = useMutation({
    mutationFn: generateImage,
  });

  function handleGenerate() {
    if (!prompt.trim()) return;
    mutation.mutate({ prompt, style, platform, enhancePrompt });
  }

  const result = mutation.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">AI 生图</h1>
          <p className="text-sm text-[var(--color-text-muted)]">生成社交媒体专属图片，支持多种平台尺寸与风格</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Left: inputs ── */}
        <div className="space-y-5">

          {/* Prompt */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
              描述你想要的图片
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="例如：一位自信的马来西亚女性在咖啡馆工作..."
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
            {/* Quick examples */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PROMPT_EXAMPLES.slice(0, 3).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {ex.slice(0, 18)}…
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">平台尺寸</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-[var(--radius-md)] border p-3 text-center transition-colors',
                    platform === p.value
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
                  )}
                >
                  {/* Aspect ratio visual */}
                  <span className={cn(
                    'block border-2 bg-current opacity-20',
                    p.value === 'square'    && 'h-8 w-8',
                    p.value === 'landscape' && 'h-5 w-9',
                    p.value === 'portrait'  && 'h-9 w-5',
                  )} />
                  <span className="text-xs font-medium">{p.label}</span>
                  <span className="text-[10px] opacity-70">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">图片风格</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    style === s.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]',
                  )}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enhance toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setEnhancePrompt(!enhancePrompt)}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                enhancePrompt ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
              )}
            >
              <span className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                enhancePrompt ? 'translate-x-4' : 'translate-x-0.5',
              )} />
            </div>
            <span className="text-sm text-[var(--color-text)]">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 text-[var(--color-primary)]" />
              AI 自动优化描述
            </span>
          </label>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> 生成中（约30秒）...</>
            ) : result ? (
              <><RefreshCw className="h-4 w-4" /> 重新生成</>
            ) : (
              <><ImageIcon className="h-4 w-4" /> 生成图片</>
            )}
          </button>

          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          )}
        </div>

        {/* ── Right: result ── */}
        <div>
          {mutation.isPending ? (
            <div className="flex aspect-square items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--color-primary)]" />
                <p className="text-sm text-[var(--color-text-muted)]">AI 正在创作中...</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">通常需要 20-40 秒</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${result.imageBase64}`}
                  alt="AI generated"
                  className="w-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => downloadImage(result.imageBase64, result.platform)}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white py-2.5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Download className="h-4 w-4" /> 下载图片
              </button>

              {result.revisedPrompt && result.revisedPrompt !== prompt && (
                <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--color-text-muted)]">
                    AI 优化后的描述
                  </summary>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">{result.revisedPrompt}</p>
                </details>
              )}
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="text-center">
                <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[var(--color-border)]" />
                <p className="text-sm text-[var(--color-text-muted)]">输入描述后点击生成</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">支持中文描述</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
