'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GuideStep, type GuideStepData } from './GuideStep';

type BrandProfile = Record<string, unknown>;

type Props = {
  brandProfile: BrandProfile;
  funnelUrl?: string;
  stepsDone: number[];
  onStepComplete: (step: number) => void;
};

function buildSteps(profile: BrandProfile, funnelUrl: string): GuideStepData[] {
  const username = String(profile.username ?? profile.identity ?? '');
  const igBio = String((profile.bios as Record<string, string> | undefined)?.instagram ?? '');

  return [
    {
      title: '切换到专业账号',
      instruction: '打开 Instagram → 设置（右上角三条线）→ 账号 → 切换到专业账号 → 选择「Creator」或「Business」',
      tip: '专业账号可以查看数据分析和添加联系按钮，强烈推荐使用',
    },
    {
      title: '选择类别',
      instruction: '选择「Health/Beauty」或「Personal Blog」作为账号类别',
      tip: '类别会显示在你的 Profile 下方，帮助访客快速了解你',
    },
    {
      title: '设置用户名',
      instruction: '前往 Edit Profile → Username，输入以下用户名：',
      action: { type: 'copy', value: username },
      tip: '尽量和 Facebook 使用相同用户名，保持品牌一致性',
    },
    {
      title: '填写 Bio',
      instruction: '在 Edit Profile → Bio 中填入以下内容：',
      action: { type: 'copy', value: igBio || '（请先完成社交资料设置生成 Bio）' },
      tip: 'Instagram Bio 最多 150 字，每行一个重点，最后一行放 CTA',
    },
    {
      title: '添加 Link in Bio',
      instruction: funnelUrl
        ? '在 Edit Profile → Website 中添加你的漏斗页面链接：'
        : '在 Edit Profile → Website 中添加你的漏斗页面链接（你可以在创建漏斗后回来填写）',
      action: funnelUrl
        ? { type: 'copy', value: funnelUrl }
        : undefined,
      tip: '还没有漏斗页面？完成引导后可以在 NextShift 创建，再回来填写',
    },
    {
      title: '上传头像',
      instruction: '使用和 Facebook 相同的头像，保持品牌一致性',
      tip: '统一的头像让粉丝在不同平台都能认出你',
    },
  ];
}

export function InstagramGuide({ brandProfile, funnelUrl = '', stepsDone, onStepComplete }: Props) {
  const t = useTranslations('brandBuilder');
  const [currentStep, setCurrentStep] = React.useState(0);
  const steps = buildSteps(brandProfile, funnelUrl);

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
