'use client';

import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { BadgeCheck, Download, ImageIcon, Layers, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
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

  const activePlatform = PLATFORMS.find((p) => p.value === platform);
  const activeStyle = STYLES.find((s) => s.value === style);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">AI 工具</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">AI 生图</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
            为社交媒体快速生成图片素材。选择尺寸和风格，输入具体画面，生成后可直接下载使用。
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-[var(--color-text-muted)]">当前规格</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{activePlatform?.ratio} / {activeStyle?.label}</p>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">图片描述</h2>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="例如：一位自信的马来西亚女性在咖啡馆工作，笔记本电脑，明亮自然光，专业但亲切"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {PROMPT_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {example.slice(0, 20)}...
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">输出设置</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">平台尺寸</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPlatform(item.value)}
                      className={cn(
                        'flex min-h-[108px] flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border p-3 text-center transition-colors',
                        platform === item.value
                          ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-primary)]',
                      )}
                    >
                      <span className={cn('block border-2 bg-current opacity-20', item.value === 'square' && 'h-8 w-8', item.value === 'landscape' && 'h-5 w-10', item.value === 'portrait' && 'h-10 w-5')} />
                      <span className="text-xs font-semibold">{item.label}</span>
                      <span className="text-[10px] opacity-75">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">图片风格</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStyle(item.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                        style === item.value
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                          : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]',
                      )}
                    >
                      <span>{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnhancePrompt(!enhancePrompt)}
                className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                  <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                  AI 自动优化描述
                </span>
                <span className={cn('relative h-5 w-9 rounded-full transition-colors', enhancePrompt ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', enhancePrompt ? 'translate-x-4' : 'translate-x-0.5')} />
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || mutation.isPending}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />生成中...</> : result ? <><RefreshCw className="h-4 w-4" />重新生成</> : <><ImageIcon className="h-4 w-4" />生成图片</>}
            </button>

            {mutation.isError ? <p className="mt-3 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-600">{(mutation.error as Error).message}</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-[var(--color-text)]">预览</h2>
              </div>
              <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)]">{activePlatform?.ratio}</span>
            </div>

            {mutation.isPending ? (
              <div className="flex aspect-square items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--color-primary)]" />
                  <p className="text-sm font-medium text-[var(--color-text)]">AI 正在创作中</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">通常需要 20-40 秒</p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:image/png;base64,${result.imageBase64}`} alt="AI generated" className="w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => downloadImage(result.imageBase64, result.platform)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <Download className="h-4 w-4" /> 下载图片
                </button>
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="text-center">
                  <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[var(--color-border)]" />
                  <p className="text-sm font-medium text-[var(--color-text)]">等待生成</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">输入描述后点击生成图片</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">生成建议</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
              {['描述人物、场景、光线和情绪', '避免要求图片出现文字或 logo', '产品图要写清楚背景和构图', '同一 prompt 可切换尺寸重复生成'].map((item) => (
                <div key={item} className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--color-primary)]" />{item}</div>
              ))}
            </div>
          </div>

          {result?.revisedPrompt && result.revisedPrompt !== prompt ? (
            <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-text)]">AI 优化后的描述</summary>
              <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">{result.revisedPrompt}</p>
            </details>
          ) : null}
        </div>
      </section>
    </div>
  );
}
