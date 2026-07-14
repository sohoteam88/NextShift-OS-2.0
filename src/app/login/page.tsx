'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { homeRouteForRole } from '@/modules/auth/services/auth-routing';

type AuthMeResponse = {
  data?: {
    user?: {
      role?: string;
      status?: string;
    } | null;
  };
};

export default function LoginPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const meResponse = await fetch('/api/v1/auth/me').catch(() => null);
    const me = meResponse?.ok
      ? ((await meResponse.json().catch(() => null)) as AuthMeResponse | null)
      : null;
    const user = me?.data?.user;

    if (meResponse?.status === 401) {
      router.push('/setup-workspace');
    } else if (!user) {
      setError(t('accountLoadFailed'));
      setLoading(false);
      return;
    } else if (user.status === 'pending') {
      router.push('/pending');
    } else if (user.status === 'suspended') {
      router.push('/login');
    } else {
      router.push(homeRouteForRole(user.role ?? 'member'));
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-8 text-center text-2xl font-semibold text-gray-900">NextShift OS</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
