'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { FunnelBuilderInput } from '@/modules/ai/services/funnel-builder-service';
import type { StrategyContext } from '@/modules/funnel/types/strategy-context';
import type { GenerateResult, RealMaterialForm, SavedFunnelRow } from '../types/funnel-builder';
import { generateFunnel, buildStrategy, fetchSavedFunnels } from '../services/funnel-builder-api';
import { normalizeRealMaterial } from '../constants/funnel-builder';

const DEFAULT_FORM: FunnelBuilderInput = {
  businessType: '',
  productOrService: '',
  targetAudience: '',
  marketLocation: 'Malaysia',
  language: 'zh',
  mainCustomerPain: '',
  desiredResult: '',
  offerPrice: '',
  funnelGoal: '',
  trafficSource: 'Facebook Ads',
  closingMethod: 'WhatsApp',
  brandTone: 'Warm & Relatable',
};

const DEFAULT_REAL_MATERIAL: RealMaterialForm = {
  founder_story: '',
  case_studies: [{ name: '', before_state: '', process: '', after_result: '' }],
  common_objections: ['', '', ''],
  competitors_mentioned: '',
};

export function useFunnelForm() {
  const [form, setForm] = React.useState<FunnelBuilderInput>(DEFAULT_FORM);
  const [realMaterial, setRealMaterial] = React.useState<RealMaterialForm>(DEFAULT_REAL_MATERIAL);
  const [strategyContext, setStrategyContext] = React.useState<StrategyContext | null>(null);
  const [generationStage, setGenerationStage] = React.useState<'idle' | 'strategy' | 'content'>('idle');
  const [result, setResult] = React.useState<GenerateResult | null>(null);

  const savedFunnelsQuery = useQuery({
    queryKey: ['world-class-funnel-history'],
    queryFn: fetchSavedFunnels,
  });

  const mutation = useMutation({
    mutationFn: async (input: FunnelBuilderInput) => {
      setGenerationStage('strategy');
      const context = strategyContext ?? await buildStrategy({
        business: {
          type: input.businessType,
          product: input.productOrService,
          audience: input.targetAudience,
          pain_point: input.mainCustomerPain,
          desired_outcome: input.desiredResult,
          price_range: input.offerPrice,
        },
        real_material: normalizeRealMaterial(realMaterial),
      });
      setStrategyContext(context);
      setGenerationStage('content');
      return generateFunnel({ ...input, strategyContext: context });
    },
    onSuccess: (data) => {
      setResult(data);
      setGenerationStage('idle');
      void savedFunnelsQuery.refetch();
      setTimeout(() => {
        document.getElementById('funnel-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    onError: () => setGenerationStage('idle'),
  });

  const set = (key: keyof FunnelBuilderInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStrategyContext(null);
    mutation.mutate(form);
  };

  const restoreSavedFunnel = (item: SavedFunnelRow) => {
    const output = item.config.ai_generated?.output;
    if (!output) return;

    const input = item.config.ai_generated?.input;
    if (input) setForm((prev) => ({ ...prev, ...input }));
    if (item.config.strategy_context) setStrategyContext(item.config.strategy_context);

    setResult({
      funnel: output,
      tokensUsed: 0,
      provider: 'saved',
      model: 'history',
      savedFunnelId: item.id,
      strategyContext: item.config.strategy_context,
      qualityGateResults: item.config.quality_gate_results,
    });

    setTimeout(() => {
      document.getElementById('funnel-result')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const normalizedMaterial = normalizeRealMaterial(realMaterial);

  const isValid = !!(form.businessType && form.productOrService && form.targetAudience &&
    form.mainCustomerPain && form.desiredResult && form.funnelGoal && form.closingMethod &&
    normalizedMaterial.case_studies && normalizedMaterial.case_studies.length >= 1 &&
    normalizedMaterial.common_objections && normalizedMaterial.common_objections.length >= 3);

  const requiredFields = [
    form.businessType,
    form.productOrService,
    form.targetAudience,
    form.mainCustomerPain,
    form.desiredResult,
    form.funnelGoal,
    form.closingMethod,
    (normalizedMaterial.case_studies && normalizedMaterial.case_studies.length >= 1) ? 'case' : '',
    (normalizedMaterial.common_objections && normalizedMaterial.common_objections.length >= 3) ? 'objections' : '',
  ];
  const completedRequired = requiredFields.filter(Boolean).length;
  const completionPct = Math.round((completedRequired / requiredFields.length) * 100);

  return {
    form,
    setForm,
    set,
    realMaterial,
    setRealMaterial,
    strategyContext,
    setStrategyContext,
    generationStage,
    result,
    savedFunnelsQuery,
    mutation,
    handleSubmit,
    restoreSavedFunnel,
    isValid,
    completedRequired,
    requiredFields,
    completionPct,
  };
}
