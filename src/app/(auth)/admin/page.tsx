import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

const cards = [
  { href: '/admin/users', title: 'User management', description: 'Search, filter, and update member roles or status.' },
  { href: '/admin/approvals', title: 'Pending approvals', description: 'Review members waiting for access.' },
  { href: '/admin/templates', title: 'Template management', description: 'Manage funnel and AI templates together.' },
  { href: '/admin/daily-actions', title: 'Daily actions', description: 'Edit the default checklist for new members.' },
  { href: '/admin/training', title: 'Training modules', description: 'Maintain the onboarding course list.' },
  { href: '/admin/plan', title: 'Plan & upgrade', description: 'View plan limits and upgrade options.' },
  { href: '/admin/settings', title: 'System settings', description: 'Adjust tenant info, plan usage, and defaults.' },
];

export default async function AdminPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Admin</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Manage users, templates, defaults, and tenant settings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm transition-colors hover:bg-[var(--color-surface)]"
          >
            <h2 className="text-base font-semibold text-[var(--color-text)]">{card.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
