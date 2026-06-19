'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMissionCurrent } from '@/modules/mission-engine/components/MissionCard';
import type { MissionStage } from '@/modules/mission-engine/missionStages';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface TodaysActionCardProps {
  locale?: Locale;
  className?: string;
}

// ============================================================
// Today's action generator — rule-based from current stage
// ============================================================

interface DailyAction {
  emoji: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  route: string;
  buttonLabel: Record<Locale, string>;
}

function getActionForStage(stage: MissionStage | null): DailyAction | null {
  if (!stage) return null;

  const actions: Partial<Record<string, DailyAction>> = {
    account_approved: {
      emoji: '🎤',
      title: { zh: '完成品牌探索访谈', en: 'Complete Brand Discovery', ms: 'Lengkapkan Penemuan Jenama' },
      description: {
        zh: '告诉 AI 你的故事、背景和愿景。AI 会从中提取你的独特定位。',
        en: 'Tell AI your story, background and vision. AI will extract your unique positioning.',
        ms: 'Beritahu AI kisah, latar belakang dan visi anda. AI akan mengekstrak kedudukan unik anda.',
      },
      route: '/brand-builder/step/interview',
      buttonLabel: { zh: '开始访谈 →', en: 'Start Interview →', ms: 'Mula Temuduga →' },
    },
    brand_discovery: {
      emoji: '🎤',
      title: { zh: '完成品牌探索访谈', en: 'Complete Brand Discovery', ms: 'Lengkapkan Penemuan Jenama' },
      description: {
        zh: '告诉 AI 你的故事、背景和愿景。AI 会从中提取你的独特定位。',
        en: 'Tell AI your story, background and vision. AI will extract your unique positioning.',
        ms: 'Beritahu AI kisah, latar belakang dan visi anda. AI akan mengekstrak kedudukan unik anda.',
      },
      route: '/brand-builder/step/interview',
      buttonLabel: { zh: '开始访谈 →', en: 'Start Interview →', ms: 'Mula Temuduga →' },
    },
    brand_dna: {
      emoji: '🧬',
      title: { zh: '确认你的品牌 DNA', en: 'Confirm Your Brand DNA', ms: 'Sahkan DNA Jenama Anda' },
      description: {
        zh: 'AI 已经生成了你的品牌定位、故事和受众画像。检查并确认。',
        en: 'AI has generated your brand positioning, story, and audience profile. Review and confirm.',
        ms: 'AI telah menjana kedudukan jenama, kisah dan profil audiens anda. Semak dan sahkan.',
      },
      route: '/brand-builder/step/profile',
      buttonLabel: { zh: '确认品牌 DNA →', en: 'Confirm Brand DNA →', ms: 'Sahkan DNA Jenama →' },
    },
    social_setup: {
      emoji: '📱',
      title: { zh: '设置你的社交媒体', en: 'Set Up Social Media', ms: 'Sediakan Media Sosial' },
      description: {
        zh: '跟着指引创建 Facebook Page 和 Instagram 专业账号。这是你的数字门面。',
        en: 'Follow the guide to set up Facebook Page and Instagram. This is your digital storefront.',
        ms: 'Ikuti panduan untuk menyediakan Facebook Page dan Instagram profesional.',
      },
      route: '/brand-builder/step/guides',
      buttonLabel: { zh: '设置社交媒体 →', en: 'Set Up Social →', ms: 'Sediakan Sosial →' },
    },
    first_bio: {
      emoji: '✍️',
      title: { zh: '生成你的个人简介', en: 'Generate Your Bio', ms: 'Jana Bio Anda' },
      description: {
        zh: 'AI 帮你写一份让人一看就想关注你的简介。每个平台不同风格。',
        en: 'AI writes a bio that makes people want to follow you. Different style for each platform.',
        ms: 'AI tulis bio yang membuat orang mahu ikut anda. Gaya berbeza untuk setiap platform.',
      },
      route: '/brand-builder/step/accounts',
      buttonLabel: { zh: '生成 Bio →', en: 'Generate Bio →', ms: 'Jana Bio →' },
    },
    first_content: {
      emoji: '📝',
      title: { zh: '生成你的第一篇内容', en: 'Generate First Content', ms: 'Jana Kandungan Pertama' },
      description: {
        zh: 'AI 根据你的品牌 DNA 生成第一条社交媒体帖子。好的内容是吸引客户的第一步。',
        en: 'AI generates your first social post based on brand DNA. Good content is step one to attract clients.',
        ms: 'AI menjana pos media sosial pertama berdasarkan DNA jenama anda.',
      },
      route: '/content-engine',
      buttonLabel: { zh: '生成内容 →', en: 'Generate Content →', ms: 'Jana Kandungan →' },
    },
    first_video: {
      emoji: '🎬',
      title: { zh: '生成第一支视频脚本', en: 'Generate First Video Script', ms: 'Jana Skrip Video Pertama' },
      description: {
        zh: 'AI 帮你写短视频脚本，从 Hook 到 CTA，一条龙。视频是现在最快的涨粉方式。',
        en: 'AI writes your short video script from hook to CTA. Video is the fastest way to grow now.',
        ms: 'AI tulis skrip video pendek anda dari hook ke CTA. Video adalah cara terpantas.',
      },
      route: '/video/new',
      buttonLabel: { zh: '生成视频脚本 →', en: 'Generate Script →', ms: 'Jana Skrip →' },
    },
    lead_magnet: {
      emoji: '🧲',
      title: { zh: '创建你的引流磁铁', en: 'Create Lead Magnet', ms: 'Cipta Magnet Pelanggan' },
      description: {
        zh: '做一个免费但有价值的东西（指南/清单/模板），让人愿意留下联系方式。',
        en: 'Create something free but valuable (guide/checklist/template) people will trade their contact for.',
        ms: 'Cipta sesuatu percuma tapi bernilai (panduan/senarai semak) yang orang sanggup tukar dengan kontak.',
      },
      route: '/funnel',
      buttonLabel: { zh: '创建引流磁铁 →', en: 'Create Lead Magnet →', ms: 'Cipta Magnet →' },
    },
    webinar: {
      emoji: '🎙️',
      title: { zh: '准备你的线上讲座', en: 'Prepare Your Webinar', ms: 'Sediakan Webinar Anda' },
      description: {
        zh: 'Webinar 是线上成交率最高的工具。准备好内容，让价值说话。',
        en: 'Webinar is the highest-converting online sales tool. Prepare content that speaks value.',
        ms: 'Webinar adalah alat jualan dalam talian dengan kadar penukaran tertinggi.',
      },
      route: '/funnel',
      buttonLabel: { zh: '准备 Webinar →', en: 'Prepare Webinar →', ms: 'Sediakan Webinar →' },
    },
    funnel: {
      emoji: '🚀',
      title: { zh: '组装你的销售漏斗', en: 'Build Your Funnel', ms: 'Bina Funnel Anda' },
      description: {
        zh: '把引流磁铁和 Webinar 串起来，变成一个 24 小时自动运转的成交机器。',
        en: 'Connect your lead magnet and webinar into a 24/7 automated sales machine.',
        ms: 'Sambungkan magnet pelanggan dan webinar anda menjadi mesin jualan 24/7.',
      },
      route: '/funnel',
      buttonLabel: { zh: '构建漏斗 →', en: 'Build Funnel →', ms: 'Bina Funnel →' },
    },
    traffic_campaign: {
      emoji: '📣',
      title: { zh: '启动你的流量活动', en: 'Launch Traffic Campaign', ms: 'Lancarkan Kempen Trafik' },
      description: {
        zh: '把漏斗推给目标受众。没有流量，再好的漏斗也没人看到。',
        en: 'Push your funnel to your target audience. No traffic means no one sees your funnel.',
        ms: 'Hantar funnel anda kepada audiens sasaran. Tiada trafik bermakna tiada yang lihat.',
      },
      route: '/ai/funnel-builder',
      buttonLabel: { zh: '启动流量 →', en: 'Launch Traffic →', ms: 'Lancarkan Trafik →' },
    },
    whatsapp_followup: {
      emoji: '💬',
      title: { zh: '设置 WhatsApp AI 跟进', en: 'Set Up WhatsApp AI Follow-up', ms: 'Sediakan Susulan WhatsApp AI' },
      description: {
        zh: '让 AI 自动回复和跟进 WhatsApp 消息。5 分钟内回复的成交率比 5 小时高 10 倍。',
        en: 'Let AI auto-respond to WhatsApp. Replying in 5 min converts 10x more than 5 hours.',
        ms: 'Biarkan AI balas auto WhatsApp. Membalas dalam 5 minit menukar 10x lebih banyak.',
      },
      route: '/crm',
      buttonLabel: { zh: '设置 AI 跟进 →', en: 'Set Up AI →', ms: 'Sediakan AI →' },
    },
    crm_setup: {
      emoji: '📊',
      title: { zh: '整理你的 CRM', en: 'Organize Your CRM', ms: 'Urus CRM Anda' },
      description: {
        zh: '把潜在客户分类、打分、排跟进。不漏掉任何一个可能成交的人。',
        en: 'Categorize, score, and schedule follow-ups. Never lose a potential customer.',
        ms: 'Kategorikan, skor, dan jadualkan susulan. Jangan kehilangan bakal pelanggan.',
      },
      route: '/crm/pipeline',
      buttonLabel: { zh: '管理 CRM →', en: 'Manage CRM →', ms: 'Urus CRM →' },
    },
    first_sale: {
      emoji: '💰',
      title: { zh: '完成你的第一笔成交', en: 'Close Your First Sale', ms: 'Tutup Jualan Pertama Anda' },
      description: {
        zh: '当客户买单的那一刻，你就从「在做品牌的创业者」变成了「有客户的老板」。',
        en: 'The moment a customer pays, you go from brand-builder to business owner.',
        ms: 'Saat pelanggan membayar, anda beralih dari pembina jenama ke pemilik perniagaan.',
      },
      route: '/crm/pipeline',
      buttonLabel: { zh: '去 CRM 标记成交 →', en: 'Mark Sale →', ms: 'Tandakan Jualan →' },
    },
    growth_mode: {
      emoji: '📈',
      title: { zh: '进入增长模式', en: 'Enter Growth Mode', ms: 'Masuk Mod Pertumbuhan' },
      description: {
        zh: '你已经有了完整系统。现在做更多内容、更多流量、更多成交。',
        en: 'You have the full system. Now: more content, more traffic, more sales.',
        ms: 'Anda ada sistem lengkap. Kini: lebih kandungan, lebih trafik, lebih jualan.',
      },
      route: '/dashboard',
      buttonLabel: { zh: '开始增长 →', en: 'Start Growing →', ms: 'Mula Berkembang →' },
    },
  };

  return actions[stage.id] ?? null;
}

// ============================================================
// Component
// ============================================================

export function TodaysActionCard({ locale = 'zh', className }: TodaysActionCardProps) {
  const router = useRouter();
  const query = useMissionCurrent();
  const stage = query.data?.data?.currentMission?.stage ?? null;
  const action = getActionForStage(stage);

  if (query.isLoading) {
    return (
      <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-5 animate-pulse', className)}>
        <div className="h-5 w-32 rounded bg-gray-200 mb-3" />
        <div className="h-16 w-full rounded bg-gray-100" />
      </section>
    );
  }

  if (!action) {
    return (
      <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-5', className)}>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Lightbulb className="h-4 w-4" />
          {locale === 'en'
            ? 'All caught up! Keep going.'
            : locale === 'ms'
              ? 'Semua selesai! Teruskan.'
              : '今天没有待办事项，继续加油！'}
        </div>
      </section>
    );
  }

  return (
    <section className={cn('rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700">
          {locale === 'en' ? 'Today\'s Action' : locale === 'ms' ? 'Tindakan Hari Ini' : '今日行动'}
        </h3>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-amber-200 text-2xl shadow-sm">
          {action.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-bold text-[var(--color-text)]">
            {action.title[locale]}
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {action.description[locale]}
          </p>
          <button
            type="button"
            onClick={() => router.push(action.route)}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 transition-colors active:scale-[0.98]"
          >
            {action.buttonLabel[locale]}
          </button>
        </div>
      </div>
    </section>
  );
}
