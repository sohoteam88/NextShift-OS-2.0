import { redirect } from 'next/navigation';
import { Clock, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

const ROLE_LABEL: Record<string, string> = {
  platform_admin: '平台管理员',
  admin: '管理员',
  leader: '队长',
  operator: '运营',
  member: '成员',
};

const STATUS_LABEL: Record<string, string> = {
  active: '正常',
  pending: '待启用',
  suspended: '已暂停',
};

function getRoleTone(role: string) {
  if (role === 'platform_admin') return 'bg-violet-50 text-violet-700 border-violet-200';
  if (role === 'operator') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (role === 'leader') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
}

function getStatusTone(status: string) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'suspended') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function SuperadminUsersPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const { data: users, meta } = await platformAdminService.listAllUsers({ limit: 50 });

  const activeCount = users.filter((item) => item.status === 'active').length;
  const pendingCount = users.filter((item) => item.status === 'pending').length;
  const platformAdminCount = users.filter((item) => item.role === 'platform_admin').length;
  const tenantCount = new Set(users.map((item) => item.tenantSlug).filter(Boolean)).size;

  const summaryCards = [
    { label: '总用户', value: meta.total, helper: '所有租户累计', icon: Users },
    { label: '正常账号', value: activeCount, helper: '当前页可登录用户', icon: UserCheck },
    { label: '待处理', value: pendingCount, helper: '待启用或待确认', icon: Clock },
    { label: '平台管理员', value: platformAdminCount, helper: `${tenantCount} 个租户`, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">平台管理</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">用户总览</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            查看所有租户的用户、角色与账号状态。
          </p>
        </div>
        {meta.total > 50 && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
            显示前 50 / {meta.total} 个用户
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, helper, icon: Icon }) => (
          <div key={label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
              <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
          </div>
        ))}
      </section>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">用户列表</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">按最新加入排序，方便快速排查账号问题。</p>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
            还没有用户记录。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-[var(--color-text-muted)]">
                  {['用户', '租户', '计划', '角色', '状态', '加入时间'].map((heading) => (
                    <th key={heading} className="border-b border-[var(--color-border)] px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--color-surface)]">
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <p className="font-medium text-[var(--color-text)]">{item.name || '未命名用户'}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{item.email}</p>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                      {item.tenantName ?? '未分配'}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                      <span className="capitalize">{item.tenantPlan}</span>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleTone(item.role)}`}>
                        {ROLE_LABEL[item.role] ?? item.role}
                      </span>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusTone(item.status)}`}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
