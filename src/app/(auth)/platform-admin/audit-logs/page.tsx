import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

const ACTION_TONE: Record<string, string> = {
  create:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  update:  'bg-blue-50 text-blue-700 border-blue-200',
  delete:  'bg-rose-50 text-rose-700 border-rose-200',
  suspend: 'bg-amber-50 text-amber-700 border-amber-200',
  login:   'bg-gray-50 text-gray-600 border-gray-200',
};

function actionTone(action: string) {
  const key = Object.keys(ACTION_TONE).find((k) => action.toLowerCase().includes(k));
  return key ? ACTION_TONE[key] : 'bg-gray-50 text-gray-600 border-gray-200';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function AuditLogsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const logs = await platformAdminService.getRecentAuditLogs(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Audit Logs</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Last 100 actions across all tenants
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
            No audit logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {['Time', 'Action', 'Actor', 'Tenant', 'Target'].map((h) => (
                    <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-surface)]">
                    <td className="border-b border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                      <span title={new Date(log.createdAt).toLocaleString()}>
                        {timeAgo(log.createdAt)}
                      </span>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${actionTone(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <p className="font-medium text-[var(--color-text)]">{log.actorName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{log.actorEmail}</p>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                      {log.tenantName}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                      {log.targetType ? (
                        <span className="text-xs">
                          {log.targetType}{log.targetId ? ` · ${log.targetId.slice(0, 8)}…` : ''}
                        </span>
                      ) : '—'}
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
