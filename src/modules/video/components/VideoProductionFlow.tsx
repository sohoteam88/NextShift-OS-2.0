'use client';

import * as React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { MasterScript, VideoHook, VideoProductionInput, VideoStrategy } from '../types';
import { VideoStrategyStep } from './VideoStrategyStep';
import { MasterScriptEditor } from './MasterScriptEditor';

type Props = {
  initialInput?: Partial<VideoProductionInput>;
};

type StageOneResult = {
  project: { id: string };
  strategy: VideoStrategy;
  hook: VideoHook;
  generation?: { degradedLabel?: string };
};

const PLATFORM_OPTIONS: VideoProductionInput['platform'][] = ['facebook_reel', 'instagram_reel', 'tiktok', 'instagram_story', 'xiaohongshu', 'youtube_shorts'];
const DURATION_OPTIONS: VideoProductionInput['duration'][] = ['15s', '30s', '60s', '90s'];
const STYLE_OPTIONS: VideoProductionInput['style'][] = ['talking_head', 'faceless', 'broll_voiceover', 'tutorial', 'storytelling'];
const FUNNEL_STAGES: VideoProductionInput['funnel_stage'][] = ['cold_audience', 'warm_lead', 'lead_magnet_delivered', 'webinar_invite', 'post_webinar', 'closing'];

export function VideoProductionFlow({ initialInput }: Props) {
  const [input, setInput] = React.useState<VideoProductionInput>({
    topic: initialInput?.topic ?? '',
    content_pillar: initialInput?.content_pillar ?? '',
    audience_pain: initialInput?.audience_pain ?? '',
    funnel_stage: initialInput?.funnel_stage ?? 'cold_audience',
    platform: initialInput?.platform ?? 'facebook_reel',
    duration: initialInput?.duration ?? '30s',
    style: initialInput?.style ?? 'talking_head',
    calendar_id: initialInput?.calendar_id,
    personal_story_excerpt: initialInput?.personal_story_excerpt ?? '',
  });
  const [stageOne, setStageOne] = React.useState<StageOneResult | null>(null);
  const [selectedHook, setSelectedHook] = React.useState<VideoHook | null>(null);
  const [script, setScript] = React.useState<MasterScript | null>(null);
  const [loading, setLoading] = React.useState<'strategy' | 'script' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [degradedLabel, setDegradedLabel] = React.useState<string | null>(null);

  function set<K extends keyof VideoProductionInput>(key: K, value: VideoProductionInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function startProject() {
    setLoading('strategy');
    setError(null);
    setDegradedLabel(null);
    setStageOne(null);
    setScript(null);
    const res = await fetch('/api/v1/video/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json() as { data?: StageOneResult; error?: { message?: string }; message?: string };
    setLoading(null);
    if (!res.ok || !json.data) {
      setError(json.error?.message ?? json.message ?? '策略生成失败');
      return;
    }
    setStageOne(json.data);
    setSelectedHook(json.data.hook);
    setDegradedLabel(json.data.generation?.degradedLabel ?? null);
  }

  async function generateScript() {
    if (!stageOne || !selectedHook) return;
    setLoading('script');
    setError(null);
    setDegradedLabel(null);
    const res = await fetch(`/api/v1/video/projects/${stageOne.project.id}/script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosen_hook: selectedHook, input }),
    });
    const json = await res.json() as { data?: { masterScript: MasterScript; generation?: { degradedLabel?: string } }; error?: { message?: string }; message?: string };
    setLoading(null);
    if (!res.ok || !json.data) {
      setError(json.error?.message ?? json.message ?? '脚本生成失败');
      return;
    }
    setScript(json.data.masterScript);
    setDegradedLabel(json.data.generation?.degradedLabel ?? null);
  }

  function updateScene(scene: MasterScript['scenes'][number]) {
    setScript((prev) => prev ? {
      ...prev,
      scenes: prev.scenes.map((item) => item.scene_number === scene.scene_number ? scene : item),
      cta: prev.cta.scene_number === scene.scene_number ? scene : prev.cta,
    } : prev);
  }

  const canStart = input.topic.trim() && input.content_pillar.trim() && input.audience_pain.trim();

  return (
    <div className="space-y-6">
      <section id="video-generator-controls" className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">视频策略与主脚本</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">先生成策略和 Hook，再选择一个 Hook 生成完整主脚本。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="视频主题" value={input.topic} onChange={(value) => set('topic', value)} />
          <Input label="内容支柱" value={input.content_pillar} onChange={(value) => set('content_pillar', value)} />
          <Input label="受众痛点" value={input.audience_pain} onChange={(value) => set('audience_pain', value)} className="md:col-span-2" />
          <Select label="漏斗阶段" value={input.funnel_stage} options={FUNNEL_STAGES} onChange={(value) => set('funnel_stage', value as VideoProductionInput['funnel_stage'])} />
          <Select label="平台" value={input.platform} options={PLATFORM_OPTIONS} onChange={(value) => set('platform', value as VideoProductionInput['platform'])} />
          <Select label="时长" value={input.duration} options={DURATION_OPTIONS} onChange={(value) => set('duration', value as VideoProductionInput['duration'])} />
          <Select label="拍摄方式" value={input.style} options={STYLE_OPTIONS} onChange={(value) => set('style', value as VideoProductionInput['style'])} />
        </div>
        <button
          type="button"
          onClick={() => void startProject()}
          disabled={!canStart || loading !== null}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading === 'strategy' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading === 'strategy' ? 'AI 正在制定策略...' : '生成策略 + Hook'}
        </button>
      </section>

      {error ? <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {degradedLabel ? <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{degradedLabel}。已提供基础版本，请检查内容后重试。</div> : null}

      {stageOne && selectedHook ? (
        <VideoStrategyStep
          strategy={stageOne.strategy}
          hook={stageOne.hook}
          selectedHook={selectedHook}
          onSelectHook={setSelectedHook}
          onGenerateScript={() => void generateScript()}
          generating={loading === 'script'}
        />
      ) : null}

      {script && stageOne ? (
        <MasterScriptEditor projectId={stageOne.project.id} script={script} onSceneUpdated={updateScene} />
      ) : null}
    </div>
  );
}

function Input({ label, value, onChange, className }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
