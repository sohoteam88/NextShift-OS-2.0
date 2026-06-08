import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { MemberApprovalQueue } from '@/modules/member/components/MemberApprovalQueue';

export default async function ApprovalsPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'member') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Pending approvals</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Review and approve members waiting for access.</p>
      </div>

      <MemberApprovalQueue role={user.role as 'leader' | 'operator' | 'platform_admin'} />
    </div>
  );
}
