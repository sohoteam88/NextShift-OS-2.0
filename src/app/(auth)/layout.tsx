import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AppShell from '@/components/layouts/AppShell';
import { QueryProvider } from '@/lib/query-client';
import { ToastContainer } from '@/components/ui/Toast';
import { FeedbackProvider } from '@/components/ui/FeedbackProvider';
import { Spinner } from '@/components/ui/Spinner';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { resolveAuthRedirect } from '@/modules/auth/services/auth-routing';
import { onboardingService } from '@/modules/member/services/onboarding-service';
import { getTenantById } from '@/modules/tenant/services/tenant-resolution';

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  const authRedirect = resolveAuthRedirect(user);
  if (authRedirect) {
    redirect(authRedirect);
  }

  const onboarding = await onboardingService.getState(user.id);
  const tenant = await getTenantById(user.tenantId);

  if (!tenant) {
    redirect('/login');
  }

  return (
    <QueryProvider>
      <AppShell user={user} onboarding={onboarding} tenant={tenant}>
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
          {children}
        </Suspense>
      </AppShell>
      <ToastContainer />
      <FeedbackProvider />
    </QueryProvider>
  );
}
