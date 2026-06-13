'use client';

import * as React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMissionCurrent } from '@/modules/mission-engine/components/MissionCard';
import { ALL_STAGES, type MissionStageId } from '@/modules/mission-engine/missionStages';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface QuickLaunchGridProps {
  locale?: Locale;
  className?: string;
}

// ============================================================
// Tool cards — each mapped to a stage unlock condition
// ============================================================

interface ToolCard {
  id: string;
  emoji: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  route: string;
  /** completionCheck required to unlock this tool */
  unlocksAfter: string | null; // null = always available
}

const TOOLS: ToolCard[] = [
  {
    id: 'brand_discovery',
    emoji: '🎤',
    title: { zh: 'AI 品牌探索', en: 'AI Brand Discovery', ms: 'Penemuan Jenama AI' },
    description: {
      zh: '通过 AI 访谈发现你的独特品牌定位',
      en: 'Discover your unique brand positioning through AI interview',
      ms: 'Temui kedudukan jenama unik anda melalui temuduga AI',
    },
    route: '/brand-builder/step/interview',
    unlocksAfter: 'account_approved',
  },
  {
    id: 'brand_dna',
    emoji: '🧬',
    title: { zh: '品牌 DNA', en: 'Brand DNA', ms: 'DNA Jenama' },
    description: {
      zh: '确认你的品牌定位、故事和受众画像',
      en: 'Confirm your brand positioning, story and audience',
      ms: 'Sahkan kedudukan jenama, kisah dan profil audiens',
    },
    route: '/brand-builder/step/profile',
    unlocksAfter: 'brand_discovery_completed',
  },
  {
    id: 'social_setup',
    emoji: '📱',
    title: { zh: '社交媒体设置', en: 'Social Setup', ms: 'Persediaan Sosial' },
    description: {
      zh: '创建 FB Page 和 IG 专业账号',
      en: 'Set up FB Page and IG professional account',
      ms: 'Sediakan FB Page dan akaun profesional IG',
    },
    route: '/brand-builder/step/guides',
    unlocksAfter: 'brand_dna_confirmed',
  },
  {
    id: 'content_engine',
    emoji: '📝',
    title: { zh: '内容引擎', en: 'Content Engine', ms: 'Enjin Kandungan' },
    description: {
      zh: 'AI 帮你写帖子、文案和内容日历',
      en: 'AI writes posts, copy and content calendar',
      ms: 'AI tulis pos, salinan dan kalendar kandungan',
    },
    route: '/ai',
    unlocksAfter: 'first_bio_completed',
  },
  {
    id: 'video_engine',
    emoji: '🎬',
    title: { zh: '视频引擎', en: 'Video Engine', ms: 'Enjin Video' },
    description: {
      zh: '生成短视频脚本，从 Hook 到 CTA',
      en: 'Generate short video scripts from hook to CTA',
      ms: 'Jana skrip video pendek dari hook ke CTA',
    },
    route: '/video/new',
    unlocksAfter: 'first_content_generated',
  },
  {
    id: 'lead_magnet',
    emoji: '🧲',
    title: { zh: '引流磁铁', en: 'Lead Magnet', ms: 'Magnet Pelanggan' },
    description: {
      zh: '创建免费资源吸引潜在客户留联系方式',
      en: 'Create free resource to attract leads',
      ms: 'Cipta sumber percuma untuk menarik pelanggan',
    },
    route: '/funnel',
    unlocksAfter: 'first_video_generated',
  },
  {
    id: 'funnel_builder',
    emoji: '🚀',
    title: { zh: '漏斗构建器', en: 'Funnel Builder', ms: 'Pembina Funnel' },
    description: {
      zh: '组装完整的自动成交漏斗',
      en: 'Build a complete automated sales funnel',
      ms: 'Bina funnel jualan automatik lengkap',
    },
    route: '/funnel',
    unlocksAfter: 'webinar_created',
  },
  {
    id: 'whatsapp_ai',
    emoji: '💬',
    title: { zh: 'WhatsApp AI', en: 'WhatsApp AI', ms: 'WhatsApp AI' },
    description: {
      zh: 'AI 自动回复和跟进 WhatsApp 消息',
      en: 'AI auto-reply and follow-up for WhatsApp',
      ms: 'AI balas auto dan susulan untuk WhatsApp',
    },
    route: '/crm',
    unlocksAfter: 'traffic_campaign_launched',
  },
  {
    id: 'crm',
    emoji: '📊',
    title: { zh: 'CRM 管理', en: 'CRM', ms: 'CRM' },
    description: {
      zh: '分类、打分、跟进你的潜在客户',
      en: 'Categorize, score and follow up leads',
      ms: 'Kategori, skor dan susulan pelanggan',
    },
    route: '/crm/pipeline',
    unlocksAfter: 'whatsapp_followup_configured',
  },
];

// ============================================================
// Component
// ============================================================

export function QuickLaunchGrid({ locale = 'zh', className }: QuickLaunchGridProps) {
  const query = useMissionCurrent();
  const completedChecks = new Set(query.data?.data?.progress?.completedChecks ?? []);

  function isUnlocked(tool: ToolCard): boolean {
    if (!tool.unlocksAfter) return true;
    return completedChecks.has(tool.unlocksAfter);
  }

  // Sort: unlocked first, then locked
  const sortedTools = [...TOOLS].sort((a, b) => {
    const aUnlocked = isUnlocked(a);
    const bUnlocked = isUnlocked(b);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  const title =
    locale === 'en'
      ? 'Quick Launch'
      : locale === 'ms'
        ? 'Pelancaran Pantas'
        : '快速启动';

  if (query.isLoading) {
    return (
      <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-5 animate-pulse', className)}>
        <div className="h-5 w-28 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn(className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
        {title}
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sortedTools.map((tool) => {
          const unlocked = isUnlocked(tool);

          const card = (
            <div
              className={cn(
                'rounded-xl border p-4 transition-colors',
                unlocked
                  ? 'border-[var(--color-border)] bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer shadow-sm'
                  : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed',
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-xl">{tool.emoji}</span>
                {!unlocked && <Lock className="h-3.5 w-3.5 text-gray-400" />}
              </div>
              <p
                className={cn(
                  'mt-2 text-sm font-semibold',
                  unlocked ? 'text-[var(--color-text)]' : 'text-gray-400',
                )}
              >
                {tool.title[locale]}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)] line-clamp-2">
                {unlocked
                  ? tool.description[locale]
                  : locale === 'en'
                    ? 'Complete previous steps to unlock'
                    : locale === 'ms'
                      ? 'Selesaikan langkah sebelumnya'
                      : '完成前面的步骤后解锁'}
              </p>
            </div>
          );

          if (!unlocked) return <div key={tool.id}>{card}</div>;

          return (
            <Link key={tool.id} href={tool.route}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
