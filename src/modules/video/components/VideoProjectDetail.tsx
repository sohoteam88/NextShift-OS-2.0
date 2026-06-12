'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { AIVideoPromptResult, BRollItem, CapCutScript, MasterScript, PlatformAdaptation, PlatformType, ShotListItem, VideoHook, VideoProductionInput, VideoStrategy } from '../types';
import { VideoStrategyStep } from './VideoStrategyStep';
import { MasterScriptEditor } from './MasterScriptEditor';
import { ProductionPlanView } from './ProductionPlanView';
import { CapCutGuideView } from './CapCutGuideView';
import { SubtitleView } from './SubtitleView';
import { PlatformAdaptationView } from './PlatformAdaptationView';

type Project = {
  id: string;
  topic: string;
  contentPillar: string;
  funnelStage: VideoProductionInput['funnel_stage'];
  platform: VideoProductionInput['platform'];
  duration: VideoProductionInput['duration'];
  style: VideoProductionInput['style'];
  status: string;
  strategy: VideoStrategy;
  masterScript: Partial<MasterScript> & { hook?: VideoHook };
  shotList?: ShotListItem[] | null;
  brollList?: BRollItem[] | null;
  veoPrompt?: string | null;
  minimaxPrompt?: string | null;
  capcutScript?: CapCutScript | null;
  subtitleSrt?: string | null;
  performanceId?: string | null;
  platformAdaptations?: {
    ai_video_prompts?: {
      veo?: AIVideoPromptResult | null;
      minimax?: AIVideoPromptResult | null;
    };
    posting_adaptations?: PlatformAdaptation[];
  } | PlatformAdaptation[] | null;
};

export function VideoProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = React.useState<Project | null>(null);
  const [selectedHook, setSelectedHook] = React.useState<VideoHook | null>(null);
  const [script, setScript] = React.useState<MasterScript | null>(null);
  const [productionPlan, setProductionPlan] = React.useState<{
    shotList: ShotListItem[];
    brollList: BRollItem[];
    veoPrompts?: AIVideoPromptResult | null;
    minimaxPrompts?: AIVideoPromptResult | null;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [planning, setPlanning] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<PlatformType[]>([]);
  const [finalAssets, setFinalAssets] = React.useState<{
    capcutScript?: CapCutScript | null;
    subtitleSrt?: string | null;
    platformAdaptations?: PlatformAdaptation[];
  } | null>(null);

  React.useEffect(() => {
    fetch(`/api/v1/video/projects/${projectId}`)
      .then((res) => res.json())
      .then((json: { data?: Project }) => {
        const data = json.data ?? null;
        setProject(data);
        setSelectedHook(data?.masterScript?.hook ?? null);
        if (data?.masterScript?.scenes) setScript(data.masterScript as MasterScript);
        if (data?.shotList && data?.brollList) {
          const aiPromptData = !Array.isArray(data.platformAdaptations) ? data.platformAdaptations?.ai_video_prompts : undefined;
          setProductionPlan({
            shotList: data.shotList,
            brollList: data.brollList,
            veoPrompts: aiPromptData?.veo,
            minimaxPrompts: aiPromptData?.minimax,
          });
        }
        if (data?.capcutScript || data?.subtitleSrt || Array.isArray(data?.platformAdaptations)) {
          setFinalAssets({
            capcutScript: data.capcutScript,
            subtitleSrt: data.subtitleSrt,
            platformAdaptations: Array.isArray(data.platformAdaptations)
              ? data.platformAdaptations
              : data.platformAdaptations?.posting_adaptations ?? [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  async function generateScript() {
    if (!project || !selectedHook) return;
    setGenerating(true);
    const input: VideoProductionInput = {
      topic: project.topic,
      content_pillar: project.contentPillar,
      audience_pain: '请根据品牌画像和当前主题判断受众痛点',
      funnel_stage: project.funnelStage,
      platform: project.platform,
      duration: project.duration,
      style: project.style,
    };
    const res = await fetch(`/api/v1/video/projects/${project.id}/script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosen_hook: selectedHook, input }),
    });
    const json = await res.json() as { data?: { masterScript: MasterScript } };
    if (res.ok && json.data) setScript(json.data.masterScript);
    setGenerating(false);
  }

  async function generateProductionPlan() {
    if (!project || !script) return;
    setPlanning(true);
    const res = await fetch(`/api/v1/video/projects/${project.id}/production-plan`, { method: 'POST' });
    const json = await res.json() as {
      data?: {
        shotList: ShotListItem[];
        brollList: BRollItem[];
        veoPrompts?: AIVideoPromptResult | null;
        minimaxPrompts?: AIVideoPromptResult | null;
      };
    };
    if (res.ok && json.data) setProductionPlan(json.data);
    setPlanning(false);
  }

  async function finalizeVideo(platforms = selectedPlatforms) {
    if (!project || !script) return;
    setFinalizing(true);
    const res = await fetch(`/api/v1/video/projects/${project.id}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additional_platforms: platforms }),
    });
    const json = await res.json() as { data?: { capcutScript: CapCutScript; subtitleSrt: string; platformAdaptations: PlatformAdaptation[] } };
    if (res.ok && json.data) setFinalAssets(json.data);
    setFinalizing(false);
  }

  async function publishVideo() {
    if (!project) return;
    setPublishing(true);
    const res = await fetch(`/api/v1/video/projects/${project.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ create_performance_record: true, platform: project.platform }),
    });
    if (res.ok) setProject((prev) => prev ? { ...prev, status: 'published' } : prev);
    setPublishing(false);
  }

  function togglePlatform(platform: PlatformType) {
    const next = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((item) => item !== platform)
      : [...selectedPlatforms, platform];
    setSelectedPlatforms(next);
    void finalizeVideo(next);
  }

  function updateScene(scene: MasterScript['scenes'][number]) {
    setScript((prev) => prev ? {
      ...prev,
      scenes: prev.scenes.map((item) => item.scene_number === scene.scene_number ? scene : item),
      cta: prev.cta.scene_number === scene.scene_number ? scene : prev.cta,
    } : prev);
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" />读取中...</div>;
  if (!project) return <div className="text-sm text-[var(--color-text-muted)]">视频项目不存在</div>;

  return (
    <div className="space-y-5">
      <Link href="/video" className="text-sm font-medium text-[var(--color-primary)] hover:underline">← 返回视频项目</Link>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{project.topic}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{project.platform} · {project.duration} · {project.strategy.recommended_angle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {['① 策略与Hook', '② 主脚本', '③ 拍摄计划', '④ 完成准备'].map((step, index) => {
            const active = index === 0 || (index === 1 && script) || (index === 2 && productionPlan) || (index === 3 && finalAssets);
            return (
              <span key={step} className={active ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}>
                {step}{index < 3 ? ' →' : ''}
              </span>
            );
          })}
        </div>
      </div>
      {project.masterScript?.hook && selectedHook ? (
        <VideoStrategyStep
          strategy={project.strategy}
          hook={project.masterScript.hook}
          selectedHook={selectedHook}
          onSelectHook={setSelectedHook}
          onGenerateScript={() => void generateScript()}
          generating={generating}
        />
      ) : null}
      {script ? <MasterScriptEditor projectId={project.id} script={script} onSceneUpdated={updateScene} /> : null}
      {script ? (
        <div className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--color-text)]">下一步：生成拍摄计划</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">生成 Shot List、B-Roll 素材清单、Veo 与 MiniMax 提示词。</p>
            </div>
            <button
              type="button"
              onClick={() => void generateProductionPlan()}
              disabled={planning}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {productionPlan ? '重新生成拍摄计划' : '生成拍摄计划'}
            </button>
          </div>
        </div>
      ) : null}
      {productionPlan ? (
        <ProductionPlanView
          shotList={productionPlan.shotList}
          brollList={productionPlan.brollList}
          veoPrompts={productionPlan.veoPrompts}
          minimaxPrompts={productionPlan.minimaxPrompts}
          veoCombined={project.veoPrompt}
          minimaxCombined={project.minimaxPrompt}
        />
      ) : null}
      {productionPlan ? (
        <div className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--color-text)]">最后一步：生成完成准备</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">生成 CapCut 剪辑指南、SRT 字幕文件和平台发布建议。</p>
            </div>
            <button
              type="button"
              onClick={() => void finalizeVideo()}
              disabled={finalizing}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {finalAssets ? '重新生成完成准备' : '生成完成准备'}
            </button>
          </div>
        </div>
      ) : null}
      {finalAssets?.capcutScript ? <CapCutGuideView capcut={finalAssets.capcutScript} /> : null}
      {finalAssets?.subtitleSrt ? <SubtitleView projectId={project.id} srt={finalAssets.subtitleSrt} /> : null}
      {finalAssets?.platformAdaptations ? (
        <PlatformAdaptationView
          adaptations={finalAssets.platformAdaptations}
          selected={selectedPlatforms}
          onToggle={togglePlatform}
        />
      ) : null}
      {finalAssets ? (
        <div className="rounded-[var(--radius-lg)] border border-green-200 bg-green-50 p-5">
          <h2 className="font-semibold text-[var(--color-text)]">状态：准备就绪</h2>
          <div className="mt-3 grid gap-1 text-sm text-[var(--color-text-muted)]">
            <span>✓ 策略与 Hook</span>
            <span>✓ 主脚本 {script ? `(${script.scenes.length} 个场景)` : ''}</span>
            <span>✓ 拍摄清单 + 素材清单</span>
            <span>✓ AI 视频提示词</span>
            <span>✓ CapCut 剪辑指南</span>
            <span>✓ 字幕文件</span>
            <span>✓ 平台发布建议</span>
          </div>
          <button
            type="button"
            onClick={() => void publishVideo()}
            disabled={publishing || project.status === 'published'}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-green-600 px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {project.status === 'published' ? '已发布' : '标记为已发布'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
