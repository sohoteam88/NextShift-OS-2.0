'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMissionCurrent } from '@/modules/mission-engine/components/MissionCard';
import { ALL_STAGES } from '@/modules/mission-engine/missionStages';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface AiRecommendationPanelProps {
  locale?: Locale;
  className?: string;
}

// ============================================================
// Rule-based recommendation engine
// No paid API calls — pure logic based on completedChecks
// ============================================================

interface Recommendation {
  id: string;
  priority: number; // lower = more urgent
  emoji: string;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
  route: string;
  buttonLabel: Record<Locale, string>;
}

function generateRecommendations(completedChecks: string[]): Recommendation[] {
  const checks = new Set(completedChecks);
  const recommendations: Recommendation[] = [];

  // Rule 1: No Brand DNA → recommend Brand Discovery
  if (!checks.has('brand_dna_confirmed')) {
    if (!checks.has('brand_discovery_completed')) {
      recommendations.push({
        id: 'do_brand_discovery',
        priority: 1,
        emoji: '🎤',
        title: {
          zh: '完成品牌探索访谈',
          en: 'Complete Brand Discovery',
          ms: 'Lengkapkan Penemuan Jenama',
        },
        body: {
          zh: '你还没有做品牌探索。这是最重要的一步 — AI 通过访谈了解你的故事，帮你找到别人抄不走的定位。',
          en: 'You have not done brand discovery yet. This is the most important step — AI learns your story and finds a positioning no one can copy.',
          ms: 'Anda belum buat penemuan jenama. Ini langkah paling penting — AI belajar kisah anda dan cari kedudukan yang tiada siapa boleh salin.',
        },
        route: '/brand-builder/step/interview',
        buttonLabel: { zh: '开始品牌探索 →', en: 'Start Discovery →', ms: 'Mula Penemuan →' },
      });
    } else {
      recommendations.push({
        id: 'confirm_brand_dna',
        priority: 1,
        emoji: '🧬',
        title: {
          zh: '确认你的品牌 DNA',
          en: 'Confirm Your Brand DNA',
          ms: 'Sahkan DNA Jenama Anda',
        },
        body: {
          zh: 'AI 已经生成了你的品牌定位，但还需要你确认。花 5 分钟检查，这是你所有内容的基础。',
          en: 'AI generated your brand positioning but needs your confirmation. Spend 5 min reviewing — this is the foundation for everything.',
          ms: 'AI telah menjana kedudukan jenama anda tapi perlu pengesahan. Luangkan 5 minit — ini asas untuk semua.',
        },
        route: '/brand-builder/step/profile',
        buttonLabel: { zh: '确认品牌 DNA →', en: 'Confirm DNA →', ms: 'Sahkan DNA →' },
      });
    }
  }

  // Rule 2: Has Brand DNA but no social profile setup
  if (checks.has('brand_dna_confirmed') && !checks.has('social_setup_completed')) {
    recommendations.push({
      id: 'setup_social',
      priority: 2,
      emoji: '📱',
      title: {
        zh: '完成社交资料设置',
        en: 'Complete Social Profile Setup',
        ms: 'Lengkapkan Profil Sosial',
      },
      body: {
        zh: '你已经确认 Brand DNA。下一步先生成社交用户名、平台 Bio 和头像方向，内容引擎和漏斗 CTA 会优先使用这些资料。',
        en: 'Your Brand DNA is confirmed. Generate your username, platform bios, and avatar direction before content and funnel CTA use them.',
        ms: 'DNA jenama sudah disahkan. Jana nama pengguna, bio platform dan arah avatar sebelum kandungan dan CTA funnel menggunakannya.',
      },
      route: '/brand-builder/step/accounts',
      buttonLabel: { zh: '设置社交资料 →', en: 'Set Up Profile →', ms: 'Sediakan Profil →' },
    });
  }

  // Rule 3: Has social but no content
  if (checks.has('social_setup_completed') && !checks.has('first_content_generated')) {
    recommendations.push({
      id: 'create_first_content',
      priority: 3,
      emoji: '📝',
      title: {
        zh: '发布你的第一篇内容',
        en: 'Publish Your First Content',
        ms: 'Terbitkan Kandungan Pertama',
      },
      body: {
        zh: '社交媒体账号空空如也？AI 帮你写第一篇帖子。不发内容，没人知道你的存在。',
        en: 'Empty social accounts? AI writes your first post. No content means nobody knows you exist.',
        ms: 'Akaun media sosial kosong? AI tulis pos pertama anda. Tiada kandungan bermakna tiada siapa tahu anda wujud.',
      },
      route: '/content-engine',
      buttonLabel: { zh: '生成第一篇内容 →', en: 'Create Content →', ms: 'Cipta Kandungan →' },
    });
  }

  // Rule 4: Has content but no funnel
  if (checks.has('first_content_generated') && !checks.has('lead_magnet_created')) {
    recommendations.push({
      id: 'build_lead_magnet',
      priority: 4,
      emoji: '🧲',
      title: {
        zh: '创建你的第一个引流资源',
        en: 'Build Your First Lead Magnet',
        ms: 'Bina Magnet Pelanggan Pertama',
      },
      body: {
        zh: '有内容吸引人了，但怎么把观众变成联系人？做一个免费资源让他们留下电话/email。',
        en: 'Content attracts people — but how do you turn viewers into contacts? Create a free resource they will trade their info for.',
        ms: 'Kandungan menarik orang — tapi bagaimana tukar penonton ke kontak? Cipta sumber percuma.',
      },
      route: '/funnel',
      buttonLabel: { zh: '创建引流资源 →', en: 'Build Lead Magnet →', ms: 'Bina Magnet →' },
    });
  }

  // Rule 5: Has funnel but no traffic
  if (checks.has('funnel_published') && !checks.has('traffic_campaign_launched')) {
    recommendations.push({
      id: 'launch_traffic',
      priority: 5,
      emoji: '📣',
      title: {
        zh: '你的漏斗需要流量',
        en: 'Your Funnel Needs Traffic',
        ms: 'Funnel Anda Perlukan Trafik',
      },
      body: {
        zh: '漏斗已经建好了，但没人看到就没有意义。启动你的第一个流量活动，把漏斗推给目标受众。',
        en: 'Funnel is built but meaningless without traffic. Launch your first campaign to push it to your target audience.',
        ms: 'Funnel dah siap tapi tiada makna tanpa trafik. Lancarkan kempen pertama untuk hantar pada audiens sasaran.',
      },
      route: '/traffic-engine',
      buttonLabel: { zh: '启动流量 →', en: 'Launch Traffic →', ms: 'Lancarkan Trafik →' },
    });
  }

  // Rule 6: Has leads but no CRM follow-up system
  if (checks.has('traffic_campaign_launched') && !checks.has('crm_setup_completed')) {
    recommendations.push({
      id: 'setup_crm',
      priority: 6,
      emoji: '📊',
      title: {
        zh: '整理你的客户跟进系统',
        en: 'Organize Your CRM',
        ms: 'Urus Sistem Susulan Anda',
      },
      body: {
        zh: '流量来了，潜在客户也来了。现在需要 CRM 来追踪每个人，确保没有人被遗漏。',
        en: 'Traffic is flowing and leads are coming. Now you need CRM to track everyone so no one falls through.',
        ms: 'Trafik masuk dan pelanggan datang. Kini anda perlu CRM untuk jejak semua.',
      },
      route: '/crm/pipeline',
      buttonLabel: { zh: '设置 CRM →', en: 'Set Up CRM →', ms: 'Sediakan CRM →' },
    });
  }

  // Rule 7: Everything done → growth tips
  if (checks.has('growth_mode_active')) {
    recommendations.push({
      id: 'scale_content',
      priority: 10,
      emoji: '📈',
      title: {
        zh: '放大你的内容产出',
        en: 'Scale Your Content Output',
        ms: 'Besarkan Output Kandungan',
      },
      body: {
        zh: '你已经跑通了整个系统。现在的关键是：更多内容 → 更多流量 → 更多成交。每天至少发一条。',
        en: 'You have proven the system. Now the key: more content → more traffic → more sales. Post at least daily.',
        ms: 'Anda telah buktikan sistem. Kini kuncinya: lebih kandungan → lebih trafik → lebih jualan.',
      },
      route: '/ai/content-plan',
      buttonLabel: { zh: '规划内容日历 →', en: 'Plan Calendar →', ms: 'Rancang Kalendar →' },
    });
  }

  // Sort by priority
  return recommendations.sort((a, b) => a.priority - b.priority);
}

// ============================================================
// Component
// ============================================================

export function AiRecommendationPanel({ locale = 'zh', className }: AiRecommendationPanelProps) {
  const query = useMissionCurrent();

  const recommendations = React.useMemo(() => {
    const completedChecks = query.data?.data?.progress?.completedChecks ?? [];
    return generateRecommendations(completedChecks);
  }, [query.data?.data?.progress?.completedChecks]);

  const title =
    locale === 'en'
      ? 'AI Coach Tips'
      : locale === 'ms'
        ? 'Tip AI Coach'
        : 'AI Coach 建议';

  if (query.isLoading) {
    return (
      <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-5 animate-pulse', className)}>
        <div className="h-5 w-32 rounded bg-gray-200 mb-4" />
        <div className="space-y-3">
          <div className="h-16 w-full rounded bg-gray-100" />
          <div className="h-16 w-full rounded bg-gray-100" />
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-5', className)}>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <TrendingUp className="h-4 w-4" />
          {locale === 'en'
            ? 'You are on track! Keep following the journey.'
            : locale === 'ms'
              ? 'Anda di landasan! Teruskan perjalanan.'
              : '你在正确的轨道上！继续跟着旅程走。'}
        </div>
      </section>
    );
  }

  // Show top 3 recommendations
  const visible = recommendations.slice(0, 3);

  return (
    <section className={cn('rounded-2xl border border-purple-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100">
          <Lightbulb className="h-4 w-4 text-purple-600" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700">{title}</h3>
      </div>

      <div className="space-y-3">
        {visible.map((rec) => (
          <Link
            key={rec.id}
            href={rec.route}
            className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
          >
            <span className="text-xl shrink-0">{rec.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--color-text)] group-hover:text-purple-800">
                {rec.title[locale]}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)] line-clamp-2">
                {rec.body[locale]}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-purple-400 group-hover:text-purple-600 mt-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
