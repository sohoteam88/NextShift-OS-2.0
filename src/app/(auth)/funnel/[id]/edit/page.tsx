'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus, ChevronDown, ChevronUp, Eye, Globe, ArrowLeft, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AddSectionDialog } from '@/modules/funnel/components/AddSectionDialog';
import { ThemeSettings } from '@/modules/funnel/components/ThemeSettings';
import { HeroEditor } from '@/modules/funnel/components/editors/HeroEditor';
import { PainEditor } from '@/modules/funnel/components/editors/PainEditor';
import { BenefitsEditor } from '@/modules/funnel/components/editors/BenefitsEditor';
import { TestimonialEditor } from '@/modules/funnel/components/editors/TestimonialEditor';
import { FormEditor } from '@/modules/funnel/components/editors/FormEditor';
import { FAQEditor } from '@/modules/funnel/components/editors/FAQEditor';
import { MechanismEditor } from '@/modules/funnel/components/editors/MechanismEditor';
import { CTAEditor } from '@/modules/funnel/components/editors/CTAEditor';
import { QuizEditor } from '@/modules/funnel/components/editors/QuizEditor';
import { useFunnel, useUpdateFunnel, usePublishFunnel } from '@/modules/funnel/hooks/use-funnels';
import { AIFunnelCopyButton } from '@/modules/funnel/components/AIFunnelCopyButton';
import { useToast } from '@/stores/toast-store';
import type { FunnelConfig, FunnelSection, FunnelTheme, QuizConfig } from '@/modules/funnel/types';
import type { FunnelCopyOutput } from '@/modules/ai/services/funnel-copy-service';

const FunnelPreview = dynamic(
  () => import('@/modules/funnel/components/FunnelPreview').then((mod) => mod.FunnelPreview),
  {
    ssr: false,
    loading: () => <div className="h-[420px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm" />,
  },
);

const SECTION_LABELS: Record<string, string> = {
  hero: '🎯 Hero', pain: '😰 痛点', benefits: '✅ 优势',
  testimonial: '💬 评价', mechanism: '🔧 原理', faq: '❓ FAQ',
  form: '📝 表单', cta: '📢 CTA',
};

const DEFAULT_THEME: FunnelTheme = { primary_color: '#2563eb', bg_color: '#ffffff', font: 'system' };
const DEFAULT_CONFIG: FunnelConfig = { type: 'landing', theme: DEFAULT_THEME, sections: [] };

function buildAICopyContext(config: FunnelConfig, fallbackTitle?: string | null) {
  const hero = config.sections.find((section): section is Extract<FunnelSection, { type: 'hero' }> => section.type === 'hero');
  const pain = config.sections.find((section): section is Extract<FunnelSection, { type: 'pain' }> => section.type === 'pain');
  const cta = config.sections.find((section): section is Extract<FunnelSection, { type: 'cta' }> => section.type === 'cta');

  return {
    audience: [hero?.subheadline, pain?.title].filter(Boolean).join(' ') || fallbackTitle || '',
    offer: cta?.headline || hero?.headline || fallbackTitle || '',
    product: fallbackTitle || hero?.headline || undefined,
    language: 'zh' as const,
  };
}

function SectionItem({
  section, index, expanded, onToggle, onDelete, onChange,
}: {
  section: FunnelSection; index: number; expanded: boolean;
  onToggle: () => void; onDelete: () => void; onChange: (s: FunnelSection) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(index) });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm font-medium text-[var(--color-text)]">
          {SECTION_LABELS[section.type] ?? section.type}
        </span>
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-700">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-border)] px-3 pb-3">
          <SectionEditorSwitch section={section} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function SectionEditorSwitch({ section, onChange }: { section: FunnelSection; onChange: (s: FunnelSection) => void }) {
  switch (section.type) {
    case 'hero': return <HeroEditor value={section} onChange={onChange} />;
    case 'pain': return <PainEditor value={section} onChange={onChange} />;
    case 'benefits': return <BenefitsEditor value={section} onChange={onChange} />;
    case 'testimonial': return <TestimonialEditor value={section} onChange={onChange} />;
    case 'form': return <FormEditor value={section} onChange={onChange} />;
    case 'faq': return <FAQEditor value={section} onChange={onChange} />;
    case 'mechanism': return <MechanismEditor value={section} onChange={onChange} />;
    case 'cta': return <CTAEditor value={section} onChange={onChange} />;
    default: return null;
  }
}

export default function FunnelEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: funnelData, isLoading } = useFunnel(id);
  const updateFunnel = useUpdateFunnel();
  const publishFunnel = usePublishFunnel();

  const [config, setConfig] = useState<FunnelConfig>(DEFAULT_CONFIG);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (funnelData?.data?.config) {
      setConfig(funnelData.data.config as FunnelConfig);
    }
  }, [funnelData?.data?.config]);

  useEffect(() => {
    if (funnelData?.data?.title !== undefined) {
      setTitleDraft(funnelData.data.title);
    }
  }, [funnelData?.data?.title]);

  const autoSave = useCallback((newConfig: FunnelConfig) => {
    setSaveState('unsaved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await updateFunnel.mutateAsync({ id, data: { config: newConfig } });
        setSaveState('saved');
      } catch {
        setSaveState('unsaved');
      }
    }, 1000);
  }, [id, updateFunnel]);

  const changeConfig = useCallback((c: FunnelConfig) => {
    setConfig(c);
    autoSave(c);
  }, [autoSave]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    const newSections = arrayMove(config.sections, oldIndex, newIndex);
    changeConfig({ ...config, sections: newSections });
  }

  async function handlePublish() {
    try {
      await publishFunnel.mutateAsync({ id });
      toast('success', '漏斗已发布！');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '发布失败');
    }
  }

  async function finishTitleEdit() {
    setEditingTitle(false);
    const nextTitle = titleDraft.trim();
    if (!funnel || !nextTitle || nextTitle === funnel.title) {
      if (funnel) setTitleDraft(funnel.title);
      return;
    }

    try {
      await updateFunnel.mutateAsync({ id, data: { title: nextTitle } });
      toast('success', '漏斗名称已更新');
    } catch {
      setTitleDraft(funnel.title);
      toast('error', '漏斗名称保存失败');
    }
  }

  async function handleManualSave() {
    setSaveState('saving');
    try {
      await updateFunnel.mutateAsync({ id, data: { config } });
      setSaveState('saved');
      toast('success', '已保存');
    } catch {
      setSaveState('unsaved');
      toast('error', '保存失败');
    }
  }

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;

  const funnel = funnelData?.data;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 py-3">
        <button onClick={() => router.push('/funnel')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => void finishTitleEdit()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void finishTitleEdit();
                if (event.key === 'Escape') {
                  setTitleDraft(funnel?.title ?? '');
                  setEditingTitle(false);
                }
              }}
              aria-label="漏斗名称"
              className="w-full max-w-xl rounded-md border border-blue-300 px-2 py-1 text-base font-semibold text-[var(--color-text)] outline-none ring-blue-100 focus:ring-2"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="group flex max-w-full items-center gap-2 text-left"
              aria-label="编辑漏斗名称"
            >
              <h1 className="min-w-0 truncate text-base font-semibold text-[var(--color-text)]">{funnel?.title}</h1>
              <Pencil className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
            </button>
          )}
        </div>
        <span className={`text-xs ${saveState === 'unsaved' ? 'text-amber-500' : saveState === 'saving' ? 'text-gray-400' : 'text-emerald-600'}`}>
          {saveState === 'unsaved' ? '未保存' : saveState === 'saving' ? '保存中...' : '✓ 已保存'}
        </span>
        <Button size="sm" variant="secondary" onClick={handleManualSave} loading={saveState === 'saving'}>保存</Button>
        {funnel && (
          <AIFunnelCopyButton
            funnelId={id}
            funnelType={(config.type ?? 'landing') as 'landing' | 'quiz' | 'lead_magnet'}
            context={buildAICopyContext(config, funnel.title)}
            onApply={(copy: Partial<FunnelCopyOutput>) => {
              const sectionTypeMap: Record<string, string> = {
                hero: 'hero', pain: 'pain', mechanism: 'mechanism',
                benefits: 'benefits', faq: 'faq', cta: 'cta',
              };
              const sections = [...config.sections];
              for (const [key, data] of Object.entries(copy)) {
                if (key === 'quiz' || !data) continue;
                const sType = sectionTypeMap[key];
                if (!sType) continue;
                const idx = sections.findIndex(s => s.type === sType);
                if (idx !== -1) sections[idx] = { ...sections[idx], ...data } as FunnelSection;
                else sections.push({ type: sType, ...data } as FunnelSection);
              }
              changeConfig({ ...config, sections, ...(copy.quiz && { quiz: copy.quiz }) });
            }}
          />
        )}
        <Button size="sm" variant="secondary" icon={<Eye className="h-4 w-4" />}
          onClick={() => window.open(`/f/${funnel?.slug}`, '_blank')}>预览</Button>
        <Button size="sm" icon={<Globe className="h-4 w-4" />} onClick={handlePublish} loading={publishFunnel.isPending}>发布</Button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row">
        {/* Left panel */}
        <div className="flex max-h-[44vh] w-full shrink-0 flex-col overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={config.sections.map((_, i) => String(i))} strategy={verticalListSortingStrategy}>
                {config.sections.map((section, i) => (
                  <SectionItem
                    key={i}
                    section={section}
                    index={i}
                    expanded={expandedIndex === i}
                    onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    onDelete={() => {
                      const sections = config.sections.filter((_, j) => j !== i);
                      changeConfig({ ...config, sections });
                      if (expandedIndex === i) setExpandedIndex(null);
                    }}
                    onChange={(s) => {
                      const sections = [...config.sections];
                      sections[i] = s;
                      changeConfig({ ...config, sections });
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {config.sections.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">点击下方按钮添加第一个 Section</p>
            )}

            {/* Quiz editor for quiz funnels */}
            {config.type === 'quiz' && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
                <p className="mb-2 text-sm font-semibold text-[var(--color-text)]">🧪 测试设置</p>
                <QuizEditor
                  value={config.quiz ?? { questions: [], results: [], capture_before_results: false }}
                  onChange={(quiz: QuizConfig) => changeConfig({ ...config, quiz })}
                />
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="border-t border-[var(--color-border)] p-3 space-y-2">
            <Button size="sm" variant="secondary" className="w-full" icon={<Plus className="h-4 w-4" />}
              onClick={() => setAddOpen(true)}>添加 Section</Button>
            <button
              onClick={() => setShowTheme(v => !v)}
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
            >
              <Palette className="h-4 w-4" /> 主题设置
              {showTheme ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
            </button>
            {showTheme && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
                <ThemeSettings value={config.theme ?? DEFAULT_THEME} onChange={(theme) => changeConfig({ ...config, theme })} />
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>状态: {funnel?.status === 'published' ? '✅ 已发布' : '📝 草稿'}</span>
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-100 p-3 lg:p-4">
          <FunnelPreview config={config} />
        </div>
      </div>

      <AddSectionDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(section) => changeConfig({ ...config, sections: [...config.sections, section] })}
      />
    </div>
  );
}
