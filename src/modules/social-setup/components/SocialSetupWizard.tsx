'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Copy, Edit3, ExternalLink,
  Globe, Image, Loader2, MessageCircle, Paintbrush, Share2, Sparkles, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SocialSetup, FacebookSetup, InstagramSetup, VisualBrandSetup, SocialReadinessResult } from '../types';
import { getSocialAdvisorTips } from '../socialSetupAdvisor';

// ============================================================
// Hooks
// ============================================================

function useSocialSetup() {
  return useQuery({
    queryKey: ['social-setup'],
    queryFn: async () => {
      const res = await fetch('/api/v1/social-setup');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ data: SocialSetup; readiness: SocialReadinessResult }>;
    },
    staleTime: 30_000,
  });
}

function useGenerateSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/social-setup/generate', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-setup'] }),
  });
}

function useSaveSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (setup: SocialSetup) => {
      const res = await fetch('/api/v1/social-setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setup }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-setup'] }),
  });
}

// ============================================================
// Card Components
// ============================================================

function SetupCard({ icon: Icon, title, score, children, color = 'blue' }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  score: number;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', color === 'blue' ? 'text-blue-600' : color === 'pink' ? 'text-pink-600' : 'text-purple-600')} />
          <h3 className="text-sm font-bold text-[var(--color-text)]">{title}</h3>
        </div>
        <span className={cn('text-xs font-bold', score >= 70 ? 'text-emerald-600' : 'text-amber-600')}>{score}%</span>
      </div>
      {children}
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-0.5">{label}</p>
      <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">{value || '—'}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
    >
      {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? '已复制' : '复制'}
    </button>
  );
}

// ============================================================
// Main Wizard
// ============================================================

export function SocialSetupWizard() {
  const router = useRouter();
  const query = useSocialSetup();
  const generate = useGenerateSocial();
  const save = useSaveSocial();

  const setup = query.data?.data;
  const readiness = query.data?.readiness;
  const advisorTips = readiness ? getSocialAdvisorTips(readiness) : [];
  const hasSetup = setup?.status === 'generated' || setup?.status === 'saved';

  function handleGenerate() {
    generate.mutate();
  }

  // Loading
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">社交媒体设置</h1>
            <p className="text-xs text-[var(--color-text-muted)]">我帮你把 FB / IG 基础设置准备好，你只需要复制去使用。</p>
          </div>
        </div>
        {readiness && (
          <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5">
            <Trophy className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">{readiness.score}%</span>
          </div>
        )}
      </div>

      {/* Generate button (if no setup yet) */}
      {!hasSetup && (
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <Sparkles className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">从 Brand DNA 自动生成社交媒体设置</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            AI 读取你的品牌定位、受众、内容调性，自动生成 FB Page 和 IG 个人资料设置。
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            自动生成社交媒体设置
          </button>
        </div>
      )}

      {/* Advisor tips */}
      {hasSetup && advisorTips.length > 0 && advisorTips[0].priority < 99 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-700 mb-2">💡 建议</p>
          {advisorTips.slice(0, 2).map((tip) => (
            <p key={tip.id} className="text-sm text-amber-800">{tip.body}</p>
          ))}
        </div>
      )}

      {/* Facebook Card */}
      {hasSetup && setup && (
        <SetupCard icon={Globe} title="Facebook Page 设置" score={readiness?.facebookCompleteness ?? 0}>
          <FieldDisplay label="主页名称" value={setup.facebook.pageName} />
          <FieldDisplay label="关于 (About)" value={setup.facebook.about} />
          <FieldDisplay label="行动按钮 (CTA)" value={setup.facebook.cta} />
          <FieldDisplay label="第一篇帖子方向" value={setup.facebook.firstPostDirection} />
          <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
            <CopyButton text={setup.facebook.about} />
            <CopyButton text={setup.facebook.pageName} />
          </div>
        </SetupCard>
      )}

      {/* Instagram Card */}
      {hasSetup && setup && (
        <SetupCard icon={Image} title="Instagram 个人资料" score={readiness?.instagramCompleteness ?? 0} color="pink">
          <FieldDisplay label="用户名" value={setup.instagram.username} />
          <FieldDisplay label="显示名称" value={setup.instagram.displayName} />
          <FieldDisplay label="BIO" value={setup.instagram.bio} />
          <FieldDisplay label="Highlights" value={setup.instagram.highlights.join('、')} />
          <FieldDisplay label="链接 CTA" value={setup.instagram.linkCta} />
          <FieldDisplay label="WhatsApp 预设消息" value={setup.instagram.whatsappPrefilled} />
          <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
            <CopyButton text={setup.instagram.bio} />
            <CopyButton text={setup.instagram.username} />
          </div>
        </SetupCard>
      )}

      {/* Visual Card */}
      {hasSetup && setup && (
        <SetupCard icon={Paintbrush} title="视觉品牌方向" score={readiness?.visualConsistency ?? 0} color="purple">
          <FieldDisplay label="品牌颜色" value={setup.visual.brandColors.join(', ')} />
          <FieldDisplay label="头像提示词" value={setup.visual.profilePicturePrompt} />
          <FieldDisplay label="封面提示词" value={setup.visual.coverBannerPrompt} />
          <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
            <CopyButton text={setup.visual.profilePicturePrompt} />
            <CopyButton text={setup.visual.coverBannerPrompt} />
          </div>
        </SetupCard>
      )}

      {/* Link Strategy */}
      {hasSetup && setup && (
        <SetupCard icon={Share2} title="Link in Bio 策略" score={readiness?.linkStrategy ?? 0}>
          <FieldDisplay label="链接策略" value={setup.linkStrategy} />
        </SetupCard>
      )}

      {/* Regenerate button */}
      {hasSetup && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-5 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            重新生成
          </button>
        </div>
      )}
    </div>
  );
}
