'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

type OnboardingOverview = {
  goals: {
    health_goals: string[];
    target_audience: string;
    specialty: string;
  };
  state: { completed: boolean };
};

const specialtyOptions = ['体重管理', '营养咨询', '运动指导', '美容护肤', '综合健康'];
const audienceOptions = ['忙碌的上班族', '全职妈妈', '大学生', '退休人士', '企业家'];
const goalOptions = ['获得第一个客户', '发布 10 条内容', '建立个人品牌', '组建团队'];

export default function OnboardingGoalsPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [specialty, setSpecialty] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [healthGoals, setHealthGoals] = React.useState<string[]>([]);

  const overviewQuery = useQuery({
    queryKey: ['member-onboarding-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/onboarding');
      if (!res.ok) throw new Error('Failed to load onboarding data');
      return res.json() as Promise<{ data: OnboardingOverview }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/onboarding/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          health_goals: healthGoals,
          target_audience: targetAudience,
          specialty,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to save goals');
      }
      return res.json() as Promise<{ data: unknown }>;
    },
    onSuccess: () => router.push('/onboarding/brand'),
  });

  React.useEffect(() => {
    const goals = overviewQuery.data?.data.goals;
    if (!goals) return;
    setSpecialty(goals.specialty || specialtyOptions[0]);
    setTargetAudience(goals.target_audience || audienceOptions[0]);
    setHealthGoals(goals.health_goals.length > 0 ? goals.health_goals : []);
  }, [overviewQuery.data?.data]);

  if (overviewQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  function toggleGoal(goal: string) {
    setHealthGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('goalsTitle')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('goalsHelp')}</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('specialtyLabel')}</label>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {specialtyOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSpecialty(option)}
                className={`rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  specialty === option
                    ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('targetAudienceLabel')}</label>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {audienceOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTargetAudience(option)}
                className={`rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  targetAudience === option
                    ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text)]">{t('goalTitle')}</label>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((goal) => {
              const active = healthGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  {goal}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saveMutation.isPending} disabled={!specialty || !targetAudience || healthGoals.length === 0}>
            {t('next')}
          </Button>
        </div>
      </form>
    </div>
  );
}
