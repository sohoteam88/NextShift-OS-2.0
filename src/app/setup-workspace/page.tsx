'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import type { PlanTier } from '@/modules/tenant/constants/plans';
import { generateSlug } from '@/modules/tenant/utils/slug';
import { getTenantProvisionIntent } from '@/modules/tenant/utils/provisioning';

const PLAN_OPTIONS: Array<{ id: PlanTier; label: string }> = [
  { id: 'starter', label: 'Starter' },
  { id: 'growth', label: 'Growth' },
  { id: 'pro', label: 'Pro' },
];

function metadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export default function SetupWorkspacePage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [ownerName, setOwnerName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<PlanTier>('starter');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'nextshift.app';

  const provisionWorkspace = useCallback(async (input: {
    name: string;
    slug: string;
    plan: PlanTier;
    owner_name: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/tenant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: { code?: string; message?: string } }
        | null;

      if (!response.ok) {
        setError(
          payload?.error?.code === 'EMAIL_VERIFICATION_REQUIRED'
            ? t('emailVerificationRequired')
            : payload?.error?.message ?? t('workspaceSetupFailed'),
        );
        return false;
      }

      return true;
    } catch {
      setError(t('workspaceSetupFailed'));
      return false;
    }
  }, [t]);

  useEffect(() => {
    const loadWorkspaceIntent = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const intent = getTenantProvisionIntent(user.user_metadata);
      setOwnerName(
        intent?.owner_name
          ?? metadataString(user.user_metadata, 'full_name')
          ?? user.email?.split('@')[0]
          ?? '',
      );
      setTeamName(intent?.name ?? '');
      setSlug(intent?.slug ?? '');
      setPlan(intent?.plan ?? 'starter');
      setSlugTouched(Boolean(intent?.slug));

      if (intent) {
        setLoading(true);
        const provisioned = await provisionWorkspace(intent);
        if (provisioned) {
          router.replace('/dashboard');
          router.refresh();
          return;
        }
        setLoading(false);
      }

      setReady(true);
    };

    void loadWorkspaceIntent();
  }, [provisionWorkspace, router]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(generateSlug(teamName) || 'team');
    }
  }, [teamName, slugTouched]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const provisioned = await provisionWorkspace({
      name: teamName,
      slug,
      plan,
      owner_name: ownerName,
    });

    if (provisioned) {
      router.replace('/dashboard');
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-4 py-10">
      <section className="w-full max-w-lg rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-[var(--color-primary)]">NextShift OS</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t('workspaceSetupTitle')}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('workspaceSetupDescription')}</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <Input
            id="owner_name"
            name="owner_name"
            type="text"
            label={t('name')}
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            required
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
              {t('workspaceUrl')}
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
          </div>
          <div className="space-y-1.5">
            <label htmlFor="plan" className="block text-sm font-medium text-[var(--color-text)]">
              {t('workspacePlan')}
            </label>
            <select
              id="plan"
              name="plan"
              value={plan}
              onChange={(event) => setPlan(event.target.value as PlanTier)}
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)]"
            >
              {PLAN_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>

          {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}

          <Button type="submit" className="w-full" loading={loading} disabled={!ready}>
            {loading ? t('workspaceSettingUp') : t('finishWorkspaceSetup')}
          </Button>
        </form>
      </section>
    </main>
  );
}
