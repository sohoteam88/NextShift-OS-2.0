'use client';

import { Sparkles, Plus, Trash2 } from 'lucide-react';
import type { FunnelBuilderInput } from '@/modules/ai/services/funnel-builder-service';
import type { RealMaterialForm } from '../../types/funnel-builder';
import { InputField } from '../shared/InputField';
import { TextareaField } from '../shared/TextareaField';
import { CASE_STUDY_FIELDS, buildExampleMaterial } from '../../constants/funnel-builder';

export function RealMaterialFormSection({
  form,
  realMaterial,
  onRealMaterialChange,
  onStrategyReset,
}: {
  form: FunnelBuilderInput;
  realMaterial: RealMaterialForm;
  onRealMaterialChange: (updater: (prev: RealMaterialForm) => RealMaterialForm) => void;
  onStrategyReset: () => void;
}) {
  const handleAutoFill = () => {
    onRealMaterialChange(() => buildExampleMaterial(form));
    onStrategyReset();
  };

  const handleFounderStoryChange = (value: string) => {
    onRealMaterialChange((prev) => ({ ...prev, founder_story: value }));
    onStrategyReset();
  };

  const handleAddCaseStudy = () => {
    onRealMaterialChange((prev) => ({
      ...prev,
      case_studies: [...prev.case_studies, { name: '', before_state: '', process: '', after_result: '' }],
    }));
  };

  const handleRemoveCaseStudy = (index: number) => {
    onRealMaterialChange((prev) => ({
      ...prev,
      case_studies: prev.case_studies.filter((_, i) => i !== index),
    }));
    onStrategyReset();
  };

  const handleCaseStudyChange = (index: number, key: string, value: string) => {
    onRealMaterialChange((prev) => ({
      ...prev,
      case_studies: prev.case_studies.map((cs, i) => i === index ? { ...cs, [key]: value } : cs),
    }));
    onStrategyReset();
  };

  const handleAddObjection = () => {
    onRealMaterialChange((prev) => ({
      ...prev,
      common_objections: [...prev.common_objections, ''],
    }));
  };

  const handleRemoveObjection = (index: number) => {
    onRealMaterialChange((prev) => ({
      ...prev,
      common_objections: prev.common_objections.filter((_, i) => i !== index),
    }));
    onStrategyReset();
  };

  const handleObjectionChange = (index: number, value: string) => {
    onRealMaterialChange((prev) => ({
      ...prev,
      common_objections: prev.common_objections.map((obj, i) => i === index ? value : obj),
    }));
    onStrategyReset();
  };

  const handleCompetitorsChange = (value: string) => {
    onRealMaterialChange((prev) => ({ ...prev, competitors_mentioned: value }));
    onStrategyReset();
  };

  return (
    <div className="mt-5 rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50/40 p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">真实素材</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">这是 AI 生成高质量、不重复文案的关键。至少 1 个案例和 3 条真实异议。</p>
        </div>
        <button
          type="button"
          onClick={handleAutoFill}
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-blue-200 bg-white px-3 text-xs font-medium text-blue-700 hover:bg-blue-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          使用 AI 帮我想几个常见的
        </button>
      </div>

      <TextareaField
        label="你的转变故事"
        value={realMaterial.founder_story}
        onChange={handleFounderStoryChange}
        placeholder="你自己从什么状态变成什么状态，可选但强烈建议填写"
      />

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text)]">真实学员案例 <span className="text-red-500">*</span></label>
          <button
            type="button"
            disabled={realMaterial.case_studies.length >= 3}
            onClick={handleAddCaseStudy}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            添加案例
          </button>
        </div>
        {realMaterial.case_studies.map((item, index) => (
          <div key={index} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">案例 {index + 1}</p>
              {realMaterial.case_studies.length > 1 ? (
                <button
                  type="button"
                  onClick={() => handleRemoveCaseStudy(index)}
                  className="text-[var(--color-text-muted)] hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CASE_STUDY_FIELDS.map(([key, label, placeholder]) => (
                <InputField
                  key={key}
                  label={label}
                  value={item[key]}
                  onChange={(value) => handleCaseStudyChange(index, key, value)}
                  placeholder={placeholder}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text)]">客户最常说的异议 <span className="text-red-500">*</span></label>
          <button
            type="button"
            disabled={realMaterial.common_objections.length >= 6}
            onClick={handleAddObjection}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            添加异议
          </button>
        </div>
        {realMaterial.common_objections.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleObjectionChange(index, e.target.value)}
              placeholder="例：我不懂技术，怎么做？"
              className="h-10 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            {realMaterial.common_objections.length > 3 ? (
              <button
                type="button"
                onClick={() => handleRemoveObjection(index)}
                className="text-[var(--color-text-muted)] hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <InputField
        className="mt-4"
        label="客户通常会比较什么"
        value={realMaterial.competitors_mentioned}
        onChange={handleCompetitorsChange}
        placeholder="例：其他副业课程 / 自己摸索"
      />
    </div>
  );
}
