import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

function getRoleTone(role: string) {
  if (role === 'platform_admin') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (role === 'operator') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (role === 'leader') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
}

function getStatusTone(status: string) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'suspended') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default async function AllUsersPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const { data: users, meta } = await platformAdminService.listAllUsers({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">All Users</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {meta.total} users across all tenants
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                {['Name', 'Email', 'Tenant', 'Plan', 'Role', 'Status', 'Joined'].map((h) => (
                  <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--color-surface)]">
                  <td className="border-b border-[var(--color-border)] px-4 py-3 font-medium text-[var(--color-text)]">
                    {u.name}
                  </td>
                  <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                    {u.email}
                  </td>
                  <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                    {u.tenantName}
                  </td>
                  <td className="border-b border-[var(--color-border)] px-4 py-3 capitalize text-[var(--color-text-muted)]">
                    {u.tenantPlan}
                  </td>
                  <td className="border-b border-[var(--color-border)] px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleTone(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="border-b border-[var(--color-border)] px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusTone(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.total > 50 && (
          <div className="border-t border-[var(--color-border)] px-4 py-3 text-center text-xs text-[var(--color-text-muted)]">
            Showing first 50 of {meta.total} users
          </div>
        )}
      </div>
    </div>
  );
}
