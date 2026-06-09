'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GuideStep, type GuideStepData } from './GuideStep';

type BrandProfile = Record<string, unknown>;

type Props = {
  brandProfile: BrandProfile;
  phone?: string;
  stepsDone: number[];
  onStepComplete: (step: number) => void;
};

function buildSteps(profile: BrandProfile, phone: string): GuideStepData[] {
  const username = String(profile.username ?? profile.identity ?? '');
  const fbBio = String((profile.bios as Record<string, string> | undefined)?.facebook ?? '');

  return [
    {
      title: '创建 Fan Page',
      instruction: '打开 Facebook → 左侧菜单「Pages」→「Create New Page」',
      action: {
        type: 'external_link',
        value: 'https://www.facebook.com/pages/creation/',
        label: '打开 Facebook 创建页面',
      },
      image: '/guides/fb-step1.png',
    },
    {
      title: '填写 Page 名称',
      instruction: '输入你的品牌名称。建议使用以下名称：',
      action: { type: 'copy', value: username },
      tip: '建议使用你在上一步选择的用户名，保持品牌一致性',
    },
    {
      title: '选择分类',
      instruction: '选择 Category：「Health & Wellness」或「Personal Blog」',
      tip: '如果你是健康顾问，选「Health & Wellness」最合适',
    },
    {
      title: '填写简介 Bio',
      instruction: '把以下内容复制到 Bio 栏：',
      action: { type: 'copy', value: fbBio || '（请先完成账号设置步骤生成 Bio）' },
      tip: '你可以之后随时修改',
    },
    {
      title: '上传头像',
      instruction: '上传一张清晰的个人照片作为头像（建议 170×170px 以上）',
      tip: '使用你的真实照片，建立信任感。避免使用风景照或卡通图片',
    },
    {
      title: '上传封面图',
      instruction: '上传封面图（建议 820×312px）。点击下方链接在 Canva 免费制作：',
      action: {
        type: 'external_link',
        value: 'https://www.canva.com/search?q=facebook+cover',
        label: '打开 Canva 封面模板',
      },
      tip: '推荐用 Canva 免费制作，包含你的名字和价值主张',
    },
    {
      title: '设置 CTA 按钮',
      instruction: '在 Page 上点击「Add Action Button」→ 选择「Send WhatsApp Message」→ 输入你的 WhatsApp 号码：',
      action: { type: 'copy', value: phone || '（在设置中填写 WhatsApp 号码）' },
      tip: '这让访客可以直接 WhatsApp 你，大大提高转化率',
    },
  ];
}

export function FacebookGuide({ brandProfile, phone = '', stepsDone, onStepComplete }: Props) {
  const t = useTranslations('brandBuilder');
  const [currentStep, setCurrentStep] = React.useState(0);
  const steps = buildSteps(brandProfile, phone);

  const step = steps[currentStep];
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="space-y-4">
      <GuideStep
        stepNumber={currentStep + 1}
        totalSteps={steps.length}
        title={step.title}
        instruction={step.instruction}
        tip={step.tip}
        image={step.image}
        action={step.action}
        completed={stepsDone.includes(currentStep + 1)}
        onComplete={() => {
          onStepComplete(currentStep + 1);
          if (!isLast) setCurrentStep((i) => i + 1);
        }}
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((i) => i - 1)}
          disabled={isFirst}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('prev')}
        </button>

        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-[var(--color-primary)]'
                  : stepsDone.includes(i + 1)
                    ? 'bg-green-400'
                    : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep((i) => i + 1)}
          disabled={isLast}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('next')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
