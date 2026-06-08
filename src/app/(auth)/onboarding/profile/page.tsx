'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { uploadMemberAvatar } from '@/modules/member/services/upload-service';

type OnboardingOverview = {
  user: {
    id: string;
    tenantId: string;
    name: string;
    phone: string | null;
    bio: string | null;
    avatarUrl: string | null;
    languagePreference: string;
  };
  profile: {
    phone: string;
    whatsapp: string;
    bio: string;
    avatar_url: string;
  };
  state: { completed: boolean };
};

export default function OnboardingProfilePage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [phone, setPhone] = React.useState('');
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = React.useState(true);
  const [whatsapp, setWhatsapp] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState('');

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
      const overview = overviewQuery.data?.data;
      if (!overview) throw new Error('Missing onboarding data');

      let avatarUrl = overview.profile.avatar_url || '';
      if (avatarFile) {
        avatarUrl = await uploadMemberAvatar(avatarFile, overview.user.tenantId, overview.user.id);
      }

      const res = await fetch('/api/v1/member/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone || undefined,
          whatsapp: whatsappSameAsPhone ? phone || undefined : whatsapp || undefined,
          bio: bio || undefined,
          avatar_url: avatarUrl || undefined,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to save profile');
      }
      return res.json() as Promise<{ data: unknown }>;
    },
    onSuccess: () => router.push('/onboarding/goals'),
  });

  React.useEffect(() => {
    const overview = overviewQuery.data?.data;
    if (!overview) return;

    setPhone(overview.profile.phone || '');
    setWhatsapp(overview.profile.whatsapp || overview.profile.phone || '');
    setWhatsappSameAsPhone((overview.profile.whatsapp || overview.profile.phone || '') === (overview.profile.phone || ''));
    setBio(overview.profile.bio || '');
    setAvatarPreview(overview.profile.avatar_url || '');
  }, [overviewQuery.data?.data]);

  React.useEffect(() => {
    if (!avatarFile) return;
    const preview = URL.createObjectURL(avatarFile);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  if (overviewQuery.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  const overview = overviewQuery.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('profileTitle')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('profileHelp')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[160px_1fr]">
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatarPreview || overview?.profile.avatar_url || undefined} name={overview?.user.name} size="lg" className="h-24 w-24" />
          <label className="inline-flex cursor-pointer items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]">
            {t('uploadAvatar')}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <Input label={t('phone')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60..." />

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={whatsappSameAsPhone}
                onChange={(e) => setWhatsappSameAsPhone(e.target.checked)}
              />
              {t('whatsappSameAsPhone')}
            </label>
            {!whatsappSameAsPhone && (
              <Input label={t('whatsapp')} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+60..." />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text)]">{t('bio')}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
              placeholder={t('bioPlaceholder')}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saveMutation.isPending}>
              {t('next')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
