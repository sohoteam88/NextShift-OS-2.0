'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Globe, Lock, LogOut, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/stores/toast-store';
import { ModeToggle } from '@/modules/mission/components/ModeToggle';
import { useMissionState } from '@/modules/mission/hooks/use-mission';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ms', label: 'Bahasa Malaysia' },
];

type AuthMeResponse = {
  data?: {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
    } | null;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      plan: string;
    } | null;
  };
};

function Section({ title, description, icon, children }: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 text-[var(--color-primary)]">{icon}</span>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--color-text)]">{value}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [authMe, setAuthMe] = useState<AuthMeResponse['data'] | null>(null);
  const [currentLang, setCurrentLang] = useState('en');
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const mission = useMissionState({ enabled: authMe?.user?.role === 'member' });

  useEffect(() => {
    const locale = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1];
    if (locale) setCurrentLang(locale);

    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: AuthMeResponse | null) => setAuthMe(payload?.data ?? null))
      .catch(() => setAuthMe(null));
  }, []);

  const roleLabel = useMemo(() => {
    const role = authMe?.user?.role ?? 'member';
    return role
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, [authMe?.user?.role]);

  function setLang(code: string) {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
    setCurrentLang(code);
    toast('success', 'Language updated');
    router.refresh();
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (pwForm.next !== pwForm.confirm) {
      toast('error', 'Passwords do not match');
      return;
    }

    if (pwForm.next.length < 8) {
      toast('error', 'Password must be at least 8 characters');
      return;
    }

    setPwLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      toast('success', 'Password updated');
      setPwForm({ next: '', confirm: '' });
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace('/login');
      router.refresh();
    } catch (err) {
      setLogoutLoading(false);
      toast('error', err instanceof Error ? err.message : 'Failed to log out');
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Manage your profile, language, password, and session.</p>
        </div>
        <Button
          type="button"
          variant="danger"
          icon={<LogOut className="h-4 w-4" />}
          loading={logoutLoading}
          onClick={handleLogout}
          className="w-full sm:w-auto"
        >
          Log out
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Section
          title="Account"
          description="Current signed-in user details."
          icon={<User className="h-5 w-5" />}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Name" value={authMe?.user?.name ?? 'Steven Admin'} />
            <Detail label="Email" value={authMe?.user?.email ?? 'stevensc082@gmail.com'} />
            <Detail label="Role" value={roleLabel} />
            <Detail label="Status" value={authMe?.user?.status ?? 'active'} />
          </dl>
        </Section>

        <Section
          title="Workspace"
          description="Tenant and plan information for this account."
          icon={<Building2 className="h-5 w-5" />}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Tenant" value={authMe?.tenant?.name ?? 'NextShift Admin'} />
            <Detail label="Slug" value={authMe?.tenant?.slug ?? 'nextshift-admin'} />
            <Detail label="Plan" value={authMe?.tenant?.plan ?? 'admin'} />
            <Detail label="Access" value={roleLabel} />
          </dl>
        </Section>
      </div>

      <Section
        title="Brand & Social Profiles"
        description="Edit the social profile assets generated after Brand DNA confirmation."
        icon={<Globe className="h-5 w-5" />}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Social Profile Setup</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Update Facebook, Instagram, TikTok username ideas, Bio copy, avatar guidance, and cover direction used by the content engine and funnel CTA.
            </p>
          </div>
          <Link
            href="/brand-builder/step/accounts"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
          >
            Edit social profiles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      <Section
        title="Language"
        description="Choose the interface language for this browser."
        icon={<Globe className="h-5 w-5" />}
      >
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLang(lang.code)}
              className={`h-10 rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-colors ${
                currentLang === lang.code
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-gray-400 hover:text-[var(--color-text)]'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </Section>

      {authMe?.user?.role === 'member' && mission.data?.data ? <ModeToggle mode={mission.data.data.mode} /> : null}

      <Section
        title="Password"
        description="Set a new password for your current account."
        icon={<Lock className="h-5 w-5" />}
      >
        <form onSubmit={handlePasswordChange} className="max-w-xl space-y-4">
          <Input
            label="New password"
            name="next"
            type="password"
            value={pwForm.next}
            onChange={(e) => setPwForm((form) => ({ ...form, next: e.target.value }))}
            required
          />
          <Input
            label="Confirm password"
            name="confirm"
            type="password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((form) => ({ ...form, confirm: e.target.value }))}
            required
          />
          <Button type="submit" loading={pwLoading}>Update password</Button>
        </form>
      </Section>

      <Section
        title="Session"
        description="End this browser session and return to the login page."
        icon={<Shield className="h-5 w-5" />}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Log out of NextShift OS</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">This clears the current Supabase session from this browser.</p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<LogOut className="h-4 w-4" />}
            loading={logoutLoading}
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </Section>
    </div>
  );
}
