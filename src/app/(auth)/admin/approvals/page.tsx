import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { MemberApprovalQueue } from '@/modules/member/components/MemberApprovalQueue';

const APPROVAL_ROLES = ['leader', 'operator', 'platform_admin'];

export default async function ApprovalsPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (!APPROVAL_ROLES.includes(user.role)) {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('pendingApprovals')}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('pendingApprovalsHelp')}</p>
      </div>

      <MemberApprovalQueue role={user.role as 'leader' | 'operator' | 'platform_admin'} />
    </div>
  );
}
