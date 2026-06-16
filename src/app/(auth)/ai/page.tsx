'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Bot, MessageCircle, BarChart3, Clock3, Sparkles, Video } from 'lucide-react';
import { ContentCommandCenter } from '@/modules/content-engine/components/ContentCommandCenter';
import { WhatsAppReplyPanel } from '@/modules/ai/components/WhatsAppReplyPanel';
import { LeadAnalysisPanel } from '@/modules/ai/components/LeadAnalysisPanel';
const ContentHistory = React.lazy(() => import('@/modules/ai/components/ContentHistory').then(m => ({ default: m.ContentHistory })));
import { AIUsageMeter } from '@/modules/ai/components/AIUsageMeter';
import { SafeSection } from '@/components/molecules/ErrorFallback';
import { VideoScriptGenerator } from '@/modules/brand-builder/components/VideoScriptGenerator';
import { cn } from '@/lib/cn';

type Tool = 'content' | 'whatsapp_reply' | 'lead_analysis' | 'history' | 'video_script';

function useUsage() {
  return useQuery({
    queryKey: ['ai-usage-tenant'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/usage?scope=tenant');
      if (!res.ok) throw new Error('Failed to fetch AI usage');
      return res.json() as Promise<{
        data: {
          used: number;
          limit: number;
          remaining: number;
          percentUsed: number;
          totalCost: number;
          byFeature: Record<string, { calls: number; cost: number }>;
        };
      }>;
    },
    staleTime: 30_000,
  });
}

export default function AiPage() {
  const t = useTranslations('ai');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = React.useState<Tool>('content');
  const { data: usageData } = useUsage();

  React.useEffect(() => {
    const tool = searchParams.get('tool') as Tool | null;
    const tab = searchParams.get('tab') as string | null;
    // Redirect /ai to /content-engine for default content tab
    if (!tool && !tab) {
      router.replace('/content-engine');
      return;
    }
    if (tool && ['content', 'whatsapp_reply', 'lead_analysis', 'history', 'video_script'].includes(tool)) {
      setActiveTool(tool);
    }
  }, [searchParams, router]);

  const leadId = searchParams.get('leadId') ?? undefined;
  const topic = searchParams.get('topic') ?? undefined;
  const platform = searchParams.get('platform') ?? undefined;
  const messageContext = searchParams.get('messageContext') ?? undefined;

  const contentDefaults: Record<string, string> = {};
  if (topic) contentDefaults.topic = topic;
  if (platform) contentDefaults.platform = platform;
  if (searchParams.get('language')) contentDefaults.language = searchParams.get('language')!;
  if (messageContext) contentDefaults.additional_context = messageContext;

  const tabItems: Array<{ id: Tool; label: string; icon: React.ReactNode; description: string }> = [
    { id: 'content', label: t('contentGenerator'), icon: <Sparkles className="h-4 w-4" />, description: t('contentHelp') },
    { id: 'video_script', label: t('videoScript'), icon: <Video className="h-4 w-4" />, description: t('videoScriptHelp') },
    { id: 'whatsapp_reply', label: t('whatsappReply'), icon: <MessageCircle className="h-4 w-4" />, description: t('whatsappHelp') },
    { id: 'lead_analysis', label: t('leadAnalysis'), icon: <BarChart3 className="h-4 w-4" />, description: t('analysisHelp') },
    { id: 'history', label: t('contentHistory'), icon: <Clock3 className="h-4 w-4" />, description: t('contentHistoryHelp') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">内容指挥中心</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">AI 驱动的内容操作系统——系统知道你是谁、你的受众、你应该发布什么。</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/ai-templates')}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        >
          <Bot className="h-4 w-4" />
          {t('templateManager')}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tabItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTool(item.id)}
            className={cn(
              'rounded-[var(--radius-lg)] border bg-white p-4 text-left shadow-sm transition-colors',
              activeTool === item.id
                ? 'border-[var(--color-primary)] bg-blue-50'
                : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2 text-[var(--color-primary)]">
                {item.icon}
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">{item.label}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeTool === 'content' && (
        <SafeSection>
          <ContentCommandCenter />
        </SafeSection>
      )}
      {activeTool === 'whatsapp_reply' && (
        <SafeSection>
          <WhatsAppReplyPanel leadId={leadId} defaultValues={{ leadId: leadId ?? '', message_context: messageContext ?? '' }} />
        </SafeSection>
      )}
      {activeTool === 'lead_analysis' && (
        <SafeSection>
          <LeadAnalysisPanel leadId={leadId} defaultValues={{ leadId: leadId ?? '' }} />
        </SafeSection>
      )}
      {activeTool === 'video_script' && (
        <SafeSection>
          <VideoScriptGenerator
            defaultTopic={topic}
            defaultPlatform={
              (['facebook_reel', 'instagram_reel', 'tiktok', 'story'] as const).includes(
                platform as 'facebook_reel' | 'instagram_reel' | 'tiktok' | 'story',
              )
                ? (platform as 'facebook_reel' | 'instagram_reel' | 'tiktok' | 'story')
                : 'facebook_reel'
            }
          />
        </SafeSection>
      )}
      {activeTool === 'history' && (
        <SafeSection>
          <React.Suspense fallback={<div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
            <ContentHistory />
          </React.Suspense>
        </SafeSection>
      )}

      {usageData?.data && (
        <SafeSection>
          <AIUsageMeter
            used={usageData.data.used}
            limit={usageData.data.limit}
            costUsd={usageData.data.totalCost}
          />
        </SafeSection>
      )}
    </div>
  );
}
