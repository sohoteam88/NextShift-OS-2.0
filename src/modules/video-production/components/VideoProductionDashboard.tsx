'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Copy, Film, Loader2, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { VideoBrief, VideoPackage, VideoType, VideoFunnelStage, VideoPlatform, VideoDuration } from '../types';

// ---- Hooks ----
function useVideoEngine() {
  return useQuery({ queryKey: ['video-engine'], queryFn: async () => {
    const res = await fetch('/api/v1/video-production');
    if (!res.ok) throw new Error('Failed');
    return res.json() as Promise<{ data: { latestPackage: VideoPackage | null } }>;
  }, staleTime: 30_000 });
}

function useGenerateVideo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (brief: VideoBrief) => {
    const res = await fetch('/api/v1/video-production/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief }) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['video-engine'] }) });
}

// ---- Component ----
export function VideoProductionDashboard() {
  const router = useRouter();
  const query = useVideoEngine();
  const generate = useGenerateVideo();
  const pkg = query.data?.data?.latestPackage ?? null;
  const [pillar, setPillar] = React.useState('个人故事');
  const [pain, setPain] = React.useState('不知道怎么做个人品牌');
  const [funnel, setFunnel] = React.useState<VideoFunnelStage>('awareness');
  const [platform, setPlatform] = React.useState<VideoPlatform>('instagram_reels');
  const [vtype, setVtype] = React.useState<VideoType>('personal_story');
  const [vlen, setVlen] = React.useState<VideoDuration>(30);
  const [copied, setCopied] = React.useState('');

  function handleGenerate() {
    generate.mutate({ contentPillar: pillar, audiencePain: pain, funnelStage: funnel, platformType: platform, videoType: vtype, videoLength: vlen, tone: '温暖亲切', ctaGoal: '引导评论互动' });
  }

  if (query.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button>
          <div><h1 className="text-xl font-bold">视频生产引擎</h1><p className="text-xs text-[var(--color-text-muted)]">我帮你把这支短视频从想法做到可以拍。</p></div>
        </div>
        {pkg && <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"><Trophy className="inline h-3 w-3 mr-1" />{pkg.qualityScore}%</div>}
      </div>

      {/* Brief form */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="text-sm font-bold mb-3">📋 视频简报</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="text-xs font-semibold">内容支柱</label><input value={pillar} onChange={(e) => setPillar(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 mt-1" /></div>
          <div><label className="text-xs font-semibold">受众痛点</label><input value={pain} onChange={(e) => setPain(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 mt-1" /></div>
          <div><label className="text-xs font-semibold">漏斗阶段</label>
            <select value={funnel} onChange={(e) => setFunnel(e.target.value as VideoFunnelStage)} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 mt-1">
              {['awareness','trust_building','consideration','conversion','follow_up'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-semibold">平台类型</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as VideoPlatform)} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 mt-1">
              {['instagram_reels','tiktok','facebook_reels','youtube_shorts','xhs_video'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-semibold">视频类型</label>
            <select value={vtype} onChange={(e) => setVtype(e.target.value as VideoType)} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 mt-1">
              {['personal_story','education','transformation','lifestyle','testimonial'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="text-xs font-semibold">时长</label>
            <select value={vlen} onChange={(e) => setVlen(Number(e.target.value) as VideoDuration)} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 mt-1">
              {[15,30,45,60].map(s => <option key={s} value={s}>{s}秒</option>)}
            </select>
          </div>
        </div>
        <button type="button" onClick={handleGenerate} disabled={generate.isPending} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
          生成完整视频包
        </button>
      </section>

      {/* Generated Package */}
      {pkg && (
        <>
          {/* Strategy */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-2">🎯 视频策略</h3><p className="text-sm"><strong>目标:</strong> {pkg.strategy.goal}</p><p className="text-sm"><strong>留人策略:</strong> {pkg.strategy.retentionStrategy}</p></section>

          {/* Hooks */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-2">🪝 Hook 选项</h3>
            {pkg.hooks.map((h, i) => <p key={i} className={cn('text-sm py-1.5 px-3 rounded-lg mb-1', pkg.selectedHook === h.text ? 'bg-blue-100 font-bold text-blue-800' : 'bg-gray-50')}>{h.type}: {h.text}</p>)}
          </section>

          {/* Master Script */}
          <section className="rounded-xl border border-emerald-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold">📝 完整脚本</h3><button onClick={() => { navigator.clipboard.writeText(pkg.masterScript); setCopied('script'); setTimeout(() => setCopied(''), 1500); }} className="text-xs font-medium text-blue-600">{copied === 'script' ? '✅ 已复制' : '📋 复制'}</button></div>
            <pre className="text-sm whitespace-pre-wrap bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">{pkg.masterScript}</pre>
          </section>

          {/* Shot List */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-2">🎥 镜头列表</h3>
            {pkg.shotList.map((s) => <div key={s.sceneNumber} className="text-sm py-2 border-b last:border-0"><strong>场景{s.sceneNumber}</strong> ({s.duration}秒) — {s.action}<br /><span className="text-xs text-gray-500">{s.visualDirection} | {s.cameraAngle} | 字幕: {s.onScreenText}</span></div>)}
          </section>

          {/* B-Roll */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-2">🎞️ B-Roll 清单</h3>
            {pkg.brollList.map((b, i) => <p key={i} className="text-sm">[{b.type}] {b.description} — <span className="text-xs text-gray-500">关键词: {b.keywords}</span></p>)}
          </section>

          {/* AI Prompts */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-purple-200 bg-white p-5"><h3 className="text-sm font-bold mb-2">🤖 Google Veo Prompt</h3><pre className="text-xs whitespace-pre-wrap bg-gray-50 rounded p-2 max-h-40 overflow-y-auto">{pkg.veoPrompt}</pre></div>
            <div className="rounded-xl border border-pink-200 bg-white p-5"><h3 className="text-sm font-bold mb-2">🎨 MiniMax Prompt</h3><pre className="text-xs whitespace-pre-wrap bg-gray-50 rounded p-2 max-h-40 overflow-y-auto">{pkg.minimaxPrompt}</pre></div>
          </section>

          {/* CapCut */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-2">✂️ CapCut 脚本</h3><pre className="text-xs whitespace-pre-wrap bg-gray-50 rounded p-3">{pkg.capcutScript}</pre></section>

          {/* Subtitles */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-2">💬 字幕</h3><pre className="text-xs whitespace-pre-wrap bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">{pkg.subtitles}</pre></section>

          {/* Platform Adaptations */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-2">📱 平台适配</h3>
            {pkg.platformAdaptations.map((a) => <div key={a.platform} className="mb-3 p-3 bg-gray-50 rounded-lg"><p className="text-sm font-bold">{a.platform}</p><p className="text-xs"><strong>Hook:</strong> {a.hook}</p><p className="text-xs"><strong>CTA:</strong> {a.cta}</p><p className="text-xs text-gray-500">{a.postingNote}</p></div>)}
          </section>
        </>
      )}
    </div>
  );
}
