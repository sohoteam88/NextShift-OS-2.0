import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { OperatorDashboard } from '@/modules/admin/components/OperatorDashboard';
import { DashboardV4 } from '@/modules/dashboard/components/DashboardV4';
import { missionService } from '@/modules/mission/services/mission-service';
import { onboardingService } from '@/modules/member/services/onboarding-service';
import { LeaderDashboard } from '@/modules/team/components/LeaderDashboard';

function DashboardPlaceholder({
  title,
  description,
  primaryHref,
  primaryLabel,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <p className="text-sm text-[var(--color-text-muted)]">
          This role-specific dashboard is being introduced in the next phase.
        </p>
        <Link
          href={primaryHref}
          className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
        >
          {primaryLabel}
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'member') {
    const onboarding = await onboardingService.getState(user.id);
    if (!onboarding.completed) {
      redirect('/onboarding');
    }

    return <DashboardV4 />;
  }

  if (user.role === 'leader') {
    return <LeaderDashboard user={user} />;
  }

  if (user.role === 'operator') {
    const mission = await missionService.getState(user);
    if (!mission.isJourneyComplete) {
      return <DashboardV4 />;
    }

    return <OperatorDashboard user={user} />;
  }

  if (user.role === 'platform_admin') {
    redirect('/admin');
  }

  return (
    <DashboardPlaceholder
      title="Platform Admin"
      description="Platform-wide metrics will appear here in a later phase."
      primaryHref="/admin"
      primaryLabel="Open Admin"
    />
  );
}
