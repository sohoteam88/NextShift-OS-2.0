'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type InviteData = {
  tenantId: string;
  sponsorId: string;
  tenantName: string;
  sponsorName: string;
  expiresAt: string;
  code: string;
};

type JoinState = 'loading' | 'form' | 'pending' | 'invalid';

export function JoinInviteForm({ code }: { code: string }) {
  const t = useTranslations('member');
  const auth = useTranslations('auth');
  const router = useRouter();
  const [state, setState] = React.useState<JoinState>('loading');
  const [invite, setInvite] = React.useState<InviteData | null>(null);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = React.useState(true);
  const [whatsapp, setWhatsapp] = React.useState('');
  const [language, setLanguage] = React.useState<'zh' | 'en' | 'ms'>('zh');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function loadInvite() {
      const res = await fetch(`/api/v1/public/member/invite/${code}`);
      if (!active) return;
      if (!res.ok) {
        setState('invalid');
        return;
      }
      const payload = (await res.json()) as { data: InviteData };
      setInvite(payload.data);
      setState('form');
    }

    loadInvite();
    return () => {
      active = false;
    };
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          whatsapp: whatsappSameAsPhone ? phone : whatsapp,
          preferred_language: language,
          invite_code: code,
        },
      },
    });

    if (signUpResult.error) {
      setError(signUpResult.error.message);
      setLoading(false);
      return;
    }

    const response = await fetch('/api/v1/member/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_code: code,
        name,
        phone: phone || undefined,
        whatsapp: whatsappSameAsPhone ? phone || undefined : whatsapp || undefined,
        preferred_language: language,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error?.message ?? 'Registration failed');
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setState('pending');
    setLoading(false);
  }

  if (state === 'loading') {
    return <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">{t('loadingInvite')}</div>;
  }

  if (state === 'invalid') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
        <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{t('invalidInvite')}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('invalidInviteDesc')}</p>
        </div>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
        <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">{t('pendingReview')}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t('pendingReviewDesc')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => router.push('/login')}>{auth('login')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-10">
      <div className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('joinTitle')}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {t('invitedBySentence', { sponsorName: invite?.sponsorName ?? '', tenantName: invite?.tenantName ?? '' })}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label={auth('name')} required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={auth('email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label={auth('password')}
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input label={t('phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={whatsappSameAsPhone}
                onChange={(e) => setWhatsappSameAsPhone(e.target.checked)}
              />
              {t('sameAsPhone')}
            </label>
            {!whatsappSameAsPhone && <Input label={t('whatsapp')} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text)]">{t('preferredLanguage')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'zh' | 'en' | 'ms')}
              className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ms">Bahasa Malaysia</option>
            </select>
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <Button loading={loading} type="submit" className="w-full">
            {t('registerInvite')}
          </Button>
        </form>
      </div>
    </div>
  );
}
