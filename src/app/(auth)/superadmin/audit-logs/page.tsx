import { redirect } from 'next/navigation';
import { Activity, Building2, Clock, UserRound } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

const ACTION_TONE: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-rose-50 text-rose-700 border-rose-200',
  suspend: 'bg-amber-50 text-amber-700 border-amber-200',
  login: 'bg-gray-50 text-gray-600 border-gray-200',
};

const ACTION_LABEL: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  suspend: '暂停',
  login: '登录',
};

function actionKey(action: string) {
  return Object.keys(ACTION_TONE).find((key) => action.toLowerCase().includes(key));
}

function actionTone(action: string) {
  const key = actionKey(action);
  return key ? ACTION_TONE[key] : 'bg-gray-50 text-gray-600 border-gray-200';
}

function actionLabel(action: string) {
  const key = actionKey(action);
  return key ? ACTION_LABEL[key] : action;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function SuperadminAuditLogsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const logs = await platformAdminService.getRecentAuditLogs(100);

  const actorCount = new Set(logs.map((log) => log.actorEmail).filter(Boolean)).size;
  const tenantCount = new Set(logs.map((log) => log.tenantSlug).filter(Boolean)).size;
  const lastLog = logs[0];

  const summaryCards = [
    { label: '最近事件', value: logs.length, helper: '最多显示 100 条', icon: Activity },
    { label: '操作人员', value: actorCount, helper: '去重账号数', icon: UserRound },
    { label: '涉及租户', value: tenantCount, helper: '去重租户数', icon: Building2 },
    { label: '最后事件', value: lastLog ? timeAgo(lastLog.createdAt) : '无记录', helper: lastLog ? actionLabel(lastLog.action) : '等待系统记录', icon: Clock },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-muted)]">平台管理</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">审计日志</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          查看跨租户的关键操作，帮助排查账号、权限和数据变更问题。
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, helper, icon: Icon }) => (
          <div key={label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
              <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
          </div>
        ))}
      </section>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">最近 100 条记录</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">按发生时间从新到旧排序。</p>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
            还没有审计日志。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-[var(--color-text-muted)]">
                  {['时间', '动作', '操作人', '租户', '对象'].map((heading) => (
                    <th key={heading} className="border-b border-[var(--color-border)] px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-surface)]">
                    <td className="whitespace-nowrap border-b border-[var(--color-border)] px-4 py-3">
                      <p className="text-sm text-[var(--color-text)]">{timeAgo(log.createdAt)}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{formatDateTime(log.createdAt)}</p>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${actionTone(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-[var(--color-text-muted)]">{log.action}</p>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <p className="font-medium text-[var(--color-text)]">{log.actorName}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{log.actorEmail}</p>
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <p className="text-sm text-[var(--color-text)]">{log.tenantName ?? '平台'}</p>
                      {log.tenantSlug && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{log.tenantSlug}</p>}
                    </td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">
                      {log.targetType ? (
                        <span className="text-xs">
                          {log.targetType}
                          {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ''}
                        </span>
                      ) : (
                        '无'
                      )}
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
