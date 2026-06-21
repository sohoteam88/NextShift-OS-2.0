'use client';

import * as React from 'react';
import { CheckCircle2, Lock, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ALL_STAGES, type MissionStageId } from '@/modules/mission-engine/missionStages';
import { useMissionCurrent } from '@/modules/mission-engine/components/MissionCard';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

type StageStatus = 'completed' | 'current' | 'locked';

interface JourneyProgressMapProps {
  locale?: Locale;
  className?: string;
  collapsed?: boolean;
}

// ============================================================
// Stage display labels — Malaysian Chinese friendly
// ============================================================

const STAGE_LABELS: Record<MissionStageId, Record<Locale, string>> = {
  account_approved: { zh: '账号开通', en: 'Account Active', ms: 'Akaun Aktif' },
  brand_discovery: { zh: 'AI 品牌探索', en: 'AI Brand Discovery', ms: 'Penemuan Jenama AI' },
  brand_dna: { zh: '品牌 DNA', en: 'Brand DNA', ms: 'DNA Jenama' },
  social_setup: { zh: '社交资料设置', en: 'Social Profile Setup', ms: 'Persediaan Profil Sosial' },
  first_bio: { zh: '平台 Bio', en: 'Platform Bio', ms: 'Bio Platform' },
  first_content: { zh: '第一篇内容', en: 'First Content', ms: 'Kandungan Pertama' },
  first_video: { zh: '第一支视频', en: 'First Video', ms: 'Video Pertama' },
  lead_magnet: { zh: '引流资源', en: 'Lead Magnet', ms: 'Magnet Pelanggan' },
  webinar: { zh: '线上讲座', en: 'Webinar', ms: 'Webinar' },
  funnel: { zh: '销售漏斗', en: 'Funnel', ms: 'Funnel Jualan' },
  traffic_campaign: { zh: '启动流量', en: 'Traffic Campaign', ms: 'Kempen Trafik' },
  whatsapp_followup: { zh: 'WhatsApp 跟进', en: 'WhatsApp Follow-up', ms: 'Susulan WhatsApp' },
  crm_setup: { zh: 'CRM 管理', en: 'CRM Setup', ms: 'Persediaan CRM' },
  first_sale: { zh: '首次成交', en: 'First Sale', ms: 'Jualan Pertama' },
  growth_mode: { zh: '增长模式', en: 'Growth Mode', ms: 'Mod Pertumbuhan' },
};

// ============================================================
// Component
// ============================================================

function StageDot({
  status,
  isLast,
  label,
}: {
  status: StageStatus;
  isLast: boolean;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      {/* Dot + line */}
      <div className="flex flex-col items-center shrink-0">
        {status === 'completed' ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        ) : status === 'current' ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-blue-100">
            <MapPin className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-400">
            <Lock className="h-3.5 w-3.5" />
          </div>
        )}
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[16px]',
              status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200',
            )}
          />
        )}
      </div>

      {/* Label */}
      <div className="pb-4 pt-0.5 min-w-0">
        <p
          className={cn(
            'text-sm leading-tight',
            status === 'completed'
              ? 'font-medium text-emerald-700'
              : status === 'current'
                ? 'font-bold text-blue-700'
                : 'text-gray-400',
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

export function JourneyProgressMap({
  locale = 'zh',
  className,
  collapsed: initialCollapsed = false,
}: JourneyProgressMapProps) {
  const query = useMissionCurrent();
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);

  const data = query.data?.data;
  const progress = data?.progress;
  const completedChecks = new Set(progress?.completedChecks ?? []);
  const currentStageId = progress?.currentStageId;

  // Figure out status for each stage
  const visibleStages = ALL_STAGES.filter((s) => s.id !== 'account_approved');

  function getStatus(stageId: MissionStageId, completionCheck: string): StageStatus {
    if (completedChecks.has(completionCheck)) return 'completed';
    if (stageId === currentStageId) return 'current';
    // If the completion check for the previous stage is done and unlocksNextStage is true,
    // and this stage isn't completed, it might be current
    const stage = ALL_STAGES.find((s) => s.id === stageId);
    if (stage) {
      const prevStage = ALL_STAGES.find((s) => s.order === stage.order - 1);
      if (prevStage && completedChecks.has(prevStage.completionCheck) && prevStage.unlocksNextStage) {
        // Check if there's any earlier non-completed stage
        const earlierIncomplete = ALL_STAGES.some(
          (s) => s.order < stage.order && s.id !== 'account_approved' && !completedChecks.has(s.completionCheck),
        );
        if (!earlierIncomplete && !completedChecks.has(completionCheck)) {
          return 'current';
        }
      }
    }
    return 'locked';
  }

  const title =
    locale === 'en'
      ? 'Your Journey'
      : locale === 'ms'
        ? 'Perjalanan Anda'
        : '你的成长地图';

  if (query.isLoading) {
    return (
      <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-5 animate-pulse', className)}>
        <div className="h-5 w-28 rounded bg-gray-200 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-full rounded bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between"
      >
        <h3 className="text-base font-bold text-[var(--color-text)]">{title}</h3>
        <span className="text-xs text-[var(--color-text-muted)]">
          {collapsed
            ? locale === 'en'
              ? 'Expand'
              : locale === 'ms'
                ? 'Kembang'
                : '展开'
            : locale === 'en'
              ? 'Collapse'
              : locale === 'ms'
                ? 'Kecilkan'
                : '收起'}
        </span>
      </button>

      {/* Progress summary */}
      <div className="mt-3 mb-4 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          {completedChecks.size - 1} {locale === 'en' ? 'done' : locale === 'ms' ? 'selesai' : '已完成'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3 text-gray-400" />
          {visibleStages.length - (completedChecks.size - 1)}{' '}
          {locale === 'en' ? 'remaining' : locale === 'ms' ? 'baki' : '未完成'}
        </span>
      </div>

      {/* Stage list */}
      {!collapsed && (
        <div className="max-h-[360px] overflow-y-auto">
          {visibleStages.map((stage, index) => {
            const status = getStatus(stage.id, stage.completionCheck);
            return (
              <StageDot
                key={stage.id}
                status={status}
                isLast={index === visibleStages.length - 1}
                label={STAGE_LABELS[stage.id]?.[locale] ?? stage.title}
              />
            );
          })}
        </div>
      )}

      {/* Collapsed: show only current */}
      {collapsed && (
        <div className="mt-2">
          {(() => {
            const currentStage = visibleStages.find((s) => getStatus(s.id, s.completionCheck) === 'current');
            if (!currentStage) return null;
            return (
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <MapPin className="h-4 w-4" />
                {STAGE_LABELS[currentStage.id]?.[locale] ?? currentStage.title}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
