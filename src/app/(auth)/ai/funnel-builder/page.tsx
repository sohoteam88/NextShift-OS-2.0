'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { useFunnelForm } from '@/modules/funnel/hooks/use-funnel-form';
import { InputField } from '@/modules/funnel/components/shared/InputField';
import { SelectField } from '@/modules/funnel/components/shared/SelectField';
import { HistoryPanel, OutputPanel, StrategyPanel } from '@/modules/funnel/components/ai/HistoryPanel';
import { RealMaterialFormSection } from '@/modules/funnel/components/ai/RealMaterialForm';
import { GenerationProgress } from '@/modules/funnel/components/ai/GenerationProgress';
import { StrategyDisplay } from '@/modules/funnel/components/ai/StrategyDisplay';
import { CLOSING_OPTIONS, TRAFFIC_OPTIONS, TONE_OPTIONS, LANGUAGE_OPTIONS } from '@/modules/funnel/constants/funnel-builder';

const FunnelResult = React.lazy(() => import('@/modules/funnel/components/ai/FunnelResult').then(m => ({ default: m.FunnelResult })));

export default function FunnelBuilderPage() {
  const {
    form, set, realMaterial, setRealMaterial,
    strategyContext, setStrategyContext,
    generationStage, result, savedFunnelsQuery, mutation,
    handleSubmit, restoreSavedFunnel, isValid,
    completedRequired, requiredFields, completionPct,
  } = useFunnelForm();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">AI 工具</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">世界级漏斗生成器</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
            输入核心业务信息，一次生成落地页、WhatsApp 成交脚本、广告角度、短视频 hooks、异议处理和优化清单。
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-[var(--color-text-muted)]">表单完成度</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 w-28 rounded-full bg-[var(--color-surface)]">
              <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text)]">{completedRequired}/{requiredFields.length}</span>
          </div>
        </div>
      </div>

      {/* Main layout: form + sidebar */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <form onSubmit={handleSubmit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">业务输入</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">越具体，生成出来的 funnel 越能直接使用。</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">30-60 秒</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="业务类型" value={form.businessType} onChange={(value) => set('businessType', value)} placeholder="例：副业机会 / 健康产品 / 美容护肤 / 教育课程" required />
            <InputField label="产品 / 服务" value={form.productOrService} onChange={(value) => set('productOrService', value)} placeholder="例：AI 副业系统 / 减肥代餐 / 英语口语班" required />
            <InputField className="sm:col-span-2" label="目标受众" value={form.targetAudience} onChange={(value) => set('targetAudience', value)} placeholder="例：马来西亚华人上班族和家庭主妇，25-38岁，对副业感兴趣" required />
            <InputField label="客户最大痛点" value={form.mainCustomerPain} onChange={(value) => set('mainCustomerPain', value)} placeholder="例：死薪水，每月财务压力大，存不到钱" required />
            <InputField label="期望结果" value={form.desiredResult} onChange={(value) => set('desiredResult', value)} placeholder="例：每月额外收入，不影响正职" required />
            <InputField label="漏斗目标" value={form.funnelGoal} onChange={(value) => set('funnelGoal', value)} placeholder="例：收集名单 -> WhatsApp 成交" required />
            <InputField label="价格区间" value={form.offerPrice ?? ''} onChange={(value) => set('offerPrice', value)} placeholder="例：免费引流 -> 付费课程 RM299" />
            <InputField label="市场地区" value={form.marketLocation} onChange={(value) => set('marketLocation', value)} placeholder="Malaysia" />
            <SelectField label="输出语言" value={form.language} onChange={(value) => set('language', value)} options={LANGUAGE_OPTIONS} />
            <SelectField label="流量来源" value={form.trafficSource ?? ''} onChange={(value) => set('trafficSource', value)} options={TRAFFIC_OPTIONS} />
            <SelectField label="成交方式" value={form.closingMethod} onChange={(value) => set('closingMethod', value)} options={CLOSING_OPTIONS} required />
            <SelectField label="品牌调性" value={form.brandTone ?? ''} onChange={(value) => set('brandTone', value)} options={TONE_OPTIONS} />
          </div>

          <RealMaterialFormSection
            form={form}
            realMaterial={realMaterial}
            onRealMaterialChange={setRealMaterial}
            onStrategyReset={() => setStrategyContext(null)}
          />

          {mutation.error ? (
            <p className="mt-4 rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-600">
              {(mutation.error as Error).message}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
            <p className="text-xs text-[var(--color-text-muted)]">会消耗 AI 额度。生成后可复制每个模块的文案。</p>
            <button
              type="submit"
              disabled={mutation.isPending || !isValid}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {generationStage === 'strategy' ? 'AI 正在制定策略...' : 'AI 正在生成内容...'}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  生成完整漏斗
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <HistoryPanel
            savedFunnels={savedFunnelsQuery.data}
            isLoading={savedFunnelsQuery.isLoading}
            onRestore={restoreSavedFunnel}
          />
          <OutputPanel />
          <StrategyPanel />
        </aside>
      </section>

      {/* Generation progress */}
      <GenerationProgress stage={generationStage} />

      {/* Strategy context */}
      {strategyContext ? <StrategyDisplay context={strategyContext} /> : null}

      {/* Result */}
      {result ? (
        <div id="funnel-result">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">漏斗系统已生成</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {result.savedFunnelId ? '已保存为草稿记录，可直接进入漏斗编辑器继续调整。' : '先检查漏斗总结和目标客户画像，再复制需要的模块。'}
                {result.qualityGateResults ? ` 内容差异化通过率：${result.qualityGateResults.pass_rate}%。` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {result.savedFunnelId ? (
                <Link
                  href={`/funnel/${result.savedFunnelId}/edit`}
                  className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
                >
                  前往编辑
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => mutation.mutate(form)}
                disabled={mutation.isPending}
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)] disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                重新生成
              </button>
            </div>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {[
              ['类型', result.funnel.funnelSummary.funnelType],
              ['目标', result.funnel.funnelSummary.primaryGoal],
              ['成交', result.funnel.funnelSummary.closingChannel],
              ['Lead Magnet', result.funnel.landingPage.leadMagnet.name],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 shadow-sm">
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text)]">{value}</p>
              </div>
            ))}
          </div>
          <React.Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" /></div>}>
            <FunnelResult funnel={result.funnel} />
          </React.Suspense>
          <div className="mt-4">
            <Link
              href="/funnel"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
            >
              前往漏斗页面管理
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
