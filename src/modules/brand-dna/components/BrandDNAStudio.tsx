'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dna,
  Loader2,
  Save,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import {
  type BrandDNA,
  type BrandIdentity,
  type BrandAudience,
  type BrandMessaging,
  type BrandContent,
  type BrandOffer,
  type BrandVisual,
  type DNAHealthScore,
} from '../types';
import { getAdvisorRecommendations, type AdvisorRecommendation } from '../services/BrandDnaAdvisor';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface BrandDNAStudioProps {
  locale?: Locale;
  className?: string;
}

// ============================================================
// API Hooks
// ============================================================

function useBrandDNA() {
  return useQuery({
    queryKey: ['brand-dna'],
    queryFn: async () => {
      const res = await fetch('/api/v1/brand-dna');
      if (!res.ok) throw new Error('Failed to fetch Brand DNA');
      return res.json() as Promise<{ data: BrandDNA; health: DNAHealthScore }>;
    },
    staleTime: 30_000,
  });
}

function useSaveDNA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dna: BrandDNA) => {
      const res = await fetch('/api/v1/brand-dna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dna }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-dna'] }),
  });
}

function useRegenerateDNA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/brand-dna/regenerate', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to regenerate');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-dna'] }),
  });
}

// ============================================================
// Collapsible Section
// ============================================================

function Section({
  title,
  icon: Icon,
  score,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  score: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const scoreColor = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-bold text-[var(--color-text)]">{title}</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', scoreColor)} style={{ width: `${Math.max(3, score)}%` }} />
            </div>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">{score}%</span>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-[var(--color-border)] pt-4">{children}</div>}
    </div>
  );
}

function FieldRow({ label, value, onChange, placeholder, multiline }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
        />
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function BrandDNAStudio({ locale = 'zh', className }: BrandDNAStudioProps) {
  const router = useRouter();
  const query = useBrandDNA();
  const saveDNA = useSaveDNA();
  const regenerateDNA = useRegenerateDNA();
  const queryClient = useQueryClient();

  const dna = query.data?.data;
  const health = query.data?.health;
  const [edited, setEdited] = React.useState<BrandDNA | null>(null);
  const [saved, setSaved] = React.useState(false);
  const initializedRef = React.useRef(false);
  const autosaveTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Sync edited state with fetched data (only once)
  React.useEffect(() => {
    if (dna && !initializedRef.current) {
      setEdited(dna);
      initializedRef.current = true;
    }
  }, [dna]);

  // Reset init flag when DNA changes (e.g., after regenerate)
  React.useEffect(() => {
    initializedRef.current = false;
  }, [dna?.meta?.version]);

  // Autosave after 2s of inactivity
  React.useEffect(() => {
    if (!edited || !dna || edited === dna) return;
    autosaveTimerRef.current = setTimeout(() => {
      saveDNA.mutate(edited);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edited]);

  function updateIdentity(patch: Partial<BrandIdentity>) {
    if (!edited) return;
    setEdited({ ...edited, identity: { ...edited.identity, ...patch } });
  }

  function updateAudience(patch: Partial<BrandAudience>) {
    if (!edited) return;
    setEdited({ ...edited, audience: { ...edited.audience, ...patch } });
  }

  function updateMessaging(patch: Partial<BrandMessaging>) {
    if (!edited) return;
    setEdited({ ...edited, messaging: { ...edited.messaging, ...patch } });
  }

  function updateContent(patch: Partial<BrandContent>) {
    if (!edited) return;
    setEdited({ ...edited, content: { ...edited.content, ...patch } });
  }

  function updateOffer(patch: Partial<BrandOffer>) {
    if (!edited) return;
    setEdited({ ...edited, offer: { ...edited.offer, ...patch } });
  }

  function updateVisual(patch: Partial<BrandVisual>) {
    if (!edited) return;
    setEdited({ ...edited, visual: { ...edited.visual, ...patch } });
  }

  async function handleSave() {
    if (!edited) return;
    await saveDNA.mutateAsync(edited);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const advisorRecs = health ? getAdvisorRecommendations(health) : [];

  // ---- Loading ----
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!edited || !health) return null;

  return (
    <div className={cn('mx-auto max-w-3xl space-y-4 pb-12', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Dna className="h-5 w-5 text-purple-600" />
              <h1 className="text-xl font-bold text-[var(--color-text)]">Brand DNA Studio</h1>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {locale === 'en' ? 'Your brand identity hub' : locale === 'ms' ? 'Hab identiti jenama anda' : '你的品牌身份中心'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Overall score */}
          <div className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1.5">
            <Trophy className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-sm font-bold text-purple-700">{health.overallScore}%</span>
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveDNA.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? '已保存' : '保存'}
          </button>
        </div>
      </div>

      {/* Advisor recommendations */}
      {advisorRecs.length > 0 && advisorRecs[0].priority < 99 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">AI 建议</span>
          </div>
          {advisorRecs.slice(0, 2).map((rec) => (
            <p key={rec.id} className="text-sm text-amber-800 leading-relaxed">
              💡 {rec.body}
            </p>
          ))}
        </div>
      )}

      {/* Sections */}
      <Section title="品牌身份 Identity" icon={Dna} score={health.identityClarity} defaultOpen>
        <FieldRow label="品牌名称" value={edited.identity.brandName} onChange={(v) => updateIdentity({ brandName: v })} placeholder="例如：Anna 营养教练" />
        <FieldRow label="个人姓名" value={edited.identity.personalName} onChange={(v) => updateIdentity({ personalName: v })} placeholder="你的真实姓名" />
        <FieldRow label="品牌定位" value={edited.identity.brandPositioning} onChange={(v) => updateIdentity({ brandPositioning: v })} placeholder="一句话说清你是谁、帮谁、怎么帮" multiline />
        <FieldRow label="标语 Slogan" value={edited.identity.slogan} onChange={(v) => updateIdentity({ slogan: v })} placeholder="让人记住你的一句话" />
      </Section>

      <Section title="受众定位 Audience" icon={Dna} score={health.audienceClarity}>
        <FieldRow label="目标受众" value={edited.audience.targetAudience} onChange={(v) => updateAudience({ targetAudience: v })} placeholder="你想帮助谁？越具体越好" multiline />
        <FieldRow label="受众痛点（逗号分隔）" value={edited.audience.audiencePainPoints.join('、')} onChange={(v) => updateAudience({ audiencePainPoints: v.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) })} placeholder="他们最大的痛苦是什么" />
        <FieldRow label="受众目标（逗号分隔）" value={edited.audience.audienceGoals.join('、')} onChange={(v) => updateAudience({ audienceGoals: v.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) })} placeholder="他们想要达到什么" />
        <FieldRow label="受众顾虑（逗号分隔）" value={edited.audience.audienceObjections.join('、')} onChange={(v) => updateAudience({ audienceObjections: v.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) })} placeholder="他们为什么不行动" />
      </Section>

      <Section title="信息传达 Messaging" icon={Sparkles} score={health.messagingClarity}>
        <FieldRow label="核心信息" value={edited.messaging.coreMessage} onChange={(v) => updateMessaging({ coreMessage: v })} placeholder="你最想让受众记住的一句话" multiline />
        <FieldRow label="独特角度" value={edited.messaging.uniqueAngle} onChange={(v) => updateMessaging({ uniqueAngle: v })} placeholder="你和别人有什么不同" multiline />
        <FieldRow label="电梯演讲（30秒版）" value={edited.messaging.elevatorPitch} onChange={(v) => updateMessaging({ elevatorPitch: v })} placeholder="30秒讲清楚你是谁、做什么、为什么重要" multiline />
      </Section>

      <Section title="内容策略 Content" icon={Sparkles} score={health.contentClarity}>
        <FieldRow label="内容调性" value={edited.content.contentTone} onChange={(v) => updateContent({ contentTone: v })} placeholder="温暖亲切 / 专业可信 / 激励人心 / 幽默风趣" />
        <FieldRow label="讲故事风格" value={edited.content.storytellingStyle} onChange={(v) => updateContent({ storytellingStyle: v })} placeholder="你如何讲述你的故事？个人经历 / 客户案例 / 幕后花絮" multiline />
        <FieldRow label="内容支柱（逗号分隔：名称,描述）" value={edited.content.contentPillars.map((p) => `${p.name}:${p.description}`).join('\n')} onChange={(v) => {
          const pillars = v.split('\n').filter(Boolean).map((line, i) => {
            const [name = '', desc = ''] = line.split(':');
            return { name: name.trim(), emoji: ['📚', '📖', '🏆', '🎁', '💬'][i] ?? '📝', percentage: Math.round(100 / (v.split('\n').filter(Boolean).length || 1)), description: desc.trim() };
          });
          updateContent({ contentPillars: pillars });
        }} placeholder="每行一个：名称:描述" multiline />
      </Section>

      <Section title="服务产品 Offer" icon={Trophy} score={health.offerClarity}>
        <FieldRow label="主要服务" value={edited.offer.primaryOffer} onChange={(v) => updateOffer({ primaryOffer: v })} placeholder="你最核心的服务是什么" multiline />
        <FieldRow label="次要服务" value={edited.offer.secondaryOffer} onChange={(v) => updateOffer({ secondaryOffer: v })} placeholder="辅助服务" />
        <FieldRow label="转变承诺" value={edited.offer.transformationPromise} onChange={(v) => updateOffer({ transformationPromise: v })} placeholder="客户跟你合作后会变成什么样" multiline />
      </Section>

      <Section title="视觉方向 Visual" icon={Sparkles} score={health.visualClarity}>
        <FieldRow label="品牌颜色（逗号分隔 hex）" value={edited.visual.brandColors.join(', ')} onChange={(v) => updateVisual({ brandColors: v.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} placeholder="#2563eb, #1e40af, #f59e0b" />
        <FieldRow label="头像方向提示词" value={edited.visual.profileImagePrompt} onChange={(v) => updateVisual({ profileImagePrompt: v })} placeholder="描述你理想中的头像：场景、光线、风格" multiline />
        <FieldRow label="封面方向提示词" value={edited.visual.coverBannerPrompt} onChange={(v) => updateVisual({ coverBannerPrompt: v })} placeholder="描述你理想的封面图：信息、风格、颜色" multiline />
      </Section>

      {/* Regenerate */}
      <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50 p-5 text-center">
        <p className="text-sm text-purple-700 mb-3">从品牌探索访谈重新生成 Brand DNA</p>
        <button
          type="button"
          onClick={() => regenerateDNA.mutate()}
          disabled={regenerateDNA.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {regenerateDNA.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          重新生成 Brand DNA
        </button>
      </div>
    </div>
  );
}
