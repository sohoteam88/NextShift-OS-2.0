'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { generateSlug, suggestSlug } from '@/modules/tenant/utils/slug';
import type { PlanTier } from '@/modules/tenant/constants/plans';

type SlugState = 'idle' | 'checking' | 'available' | 'taken' | 'error';

const PLAN_OPTIONS: Array<{ id: PlanTier; label: string; price: string; description: string }> = [
  { id: 'starter', label: 'Starter 免费', price: 'RM 0', description: '适合新团队开始使用' },
  { id: 'growth', label: 'Growth', price: 'RM 99', description: '适合稳定增长的团队' },
  { id: 'pro', label: 'Pro', price: 'RM 299', description: '适合需要高级品牌能力的团队' },
];

export default function SignupPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<PlanTier>('starter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>('idle');
  const [slugSuggestion, setSlugSuggestion] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'nextshift.app';

  useEffect(() => {
    if (!slugTouched) {
      setSlug(generateSlug(teamName) || 'team');
    }
  }, [teamName, slugTouched]);

  useEffect(() => {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug || normalizedSlug.length < 3) {
      setSlugState('idle');
      setSlugSuggestion('');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSlugState('checking');
        const response = await fetch(`/api/v1/tenant/check-slug?slug=${encodeURIComponent(normalizedSlug)}`);
        const payload = (await response.json().catch(() => null)) as
          | { data?: { available?: boolean; suggestion?: string } }
          | null;

        if (!response.ok) {
          setSlugState('error');
          setSlugSuggestion('');
          return;
        }

        if (payload?.data?.available) {
          setSlugState('available');
          setSlugSuggestion('');
          return;
        }

        setSlugState('taken');
        setSlugSuggestion(payload?.data?.suggestion ?? suggestSlug(normalizedSlug));
      } catch {
        setSlugState('error');
        setSlugSuggestion('');
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const normalizedSlug = slug.trim();
    if (slugState === 'taken') {
      setError(slugSuggestion ? `团队 URL 已被占用，建议使用 ${slugSuggestion}` : '团队 URL 已被占用');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const response = await fetch('/api/v1/tenant/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: teamName || name,
        slug: normalizedSlug,
        plan,
        owner_name: name,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string; suggestion?: string } }
        | null;
      setError(
        payload?.error?.suggestion
          ? `${payload?.error?.message ?? 'Registration failed'} - 建议: ${payload.error.suggestion}`
          : payload?.error?.message ?? 'Registration failed',
      );
      setLoading(false);
      return;
    }

    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-6 shadow-sm lg:p-8">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-primary)]">NextShift OS</p>
              <h1 className="text-2xl font-semibold text-[var(--color-text)]">创建你的团队</h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                AI 社交媒体商业操作系统
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                id="owner_name"
                name="owner_name"
                type="text"
                label={t('name')}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <Input
                id="email"
                name="email"
                type="email"
                label={t('email')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <Input
                id="password"
                name="password"
                type="password"
                label={t('password')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />

              <Input
                id="team_name"
                name="team_name"
                type="text"
                label={t('teamName')}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label htmlFor="team_slug" className="block text-sm font-medium text-[var(--color-text)]">
                  团队 URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="team_slug"
                    name="team_slug"
                    type="text"
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(generateSlug(event.target.value));
                    }}
                    className="h-10 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">.{baseDomain}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>
                    {slugState === 'checking' && '检查可用性...'}
                    {slugState === 'available' && '可用'}
                    {slugState === 'taken' && '已被占用'}
                    {slugState === 'error' && '检查失败'}
                    {slugState === 'idle' && '会根据团队名称自动生成'}
                  </span>
                  {slugSuggestion && <span>建议: {slugSuggestion}</span>}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-text)]">计划</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {PLAN_OPTIONS.map((option) => {
                    const active = plan === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPlan(option.id)}
                        className={[
                          'rounded-[var(--radius-md)] border p-3 text-left transition-colors',
                          active
                            ? 'border-[var(--color-primary)] bg-blue-50'
                            : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)]',
                        ].join(' ')}
                      >
                        <div className="text-sm font-semibold text-[var(--color-text)]">{option.label}</div>
                        <div className="mt-1 text-xs text-[var(--color-text-muted)]">{option.description}</div>
                        <div className="mt-2 text-sm font-medium text-[var(--color-primary)]">{option.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={slugState === 'taken' || slugState === 'checking'}
              >
                {loading ? t('registering') : '创建账号'}
              </Button>
            </form>
          </section>

          <aside className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-6 shadow-sm lg:p-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">独立团队注册</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">开始你的新工作区</h2>
              </div>
              <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
                <p>注册后会自动创建 tenant、operator 账号和默认工作流。</p>
                <p>你可以先选择 Starter，之后再升级到 Growth 或 Pro。</p>
                <p>已有账号？直接登录。</p>
              </div>
              <Button type="button" variant="secondary" className="w-full" onClick={() => router.push('/login')}>
                {t('login')}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
