'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clapperboard, Loader2, Plus } from 'lucide-react';

type Project = {
  id: string;
  topic: string;
  platform: string;
  duration: string;
  status: string;
  strategy: { recommended_angle?: string };
  createdAt: string;
};

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'scripted', label: '已编写' },
  { value: 'shot_planned', label: '拍摄计划' },
  { value: 'published', label: '已发布' },
];

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿（策略+Hook）',
  scripted: '已编写脚本',
  shot_planned: '拍摄计划',
  ready: '可制作',
  published: '已发布',
};

export function VideoProjectsList() {
  const [status, setStatus] = React.useState('');
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const params = status ? `?status=${status}` : '';
    fetch(`/api/v1/video/projects${params}`)
      .then((res) => res.json())
      .then((json: { data?: Project[] }) => setProjects(json.data ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">视频项目</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">管理短视频策略、Hook 和主脚本。</p>
        </div>
        <Link href="/video/new" className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white">
          <Plus className="h-4 w-4" />
          新建视频
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatus(item.value)}
            className={`rounded-full border px-3 py-1.5 text-sm ${status === item.value ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          读取视频项目中...
        </div>
      ) : null}

      <div className="grid gap-3">
        {projects.map((project) => (
          <div key={project.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clapperboard className="h-5 w-5 text-[var(--color-primary)]" />
                  <h2 className="font-semibold text-[var(--color-text)]">{project.topic}</h2>
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {project.platform} · {project.duration} · {project.strategy?.recommended_angle ?? '未定策略'}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">状态：{STATUS_LABELS[project.status] ?? project.status}</p>
              </div>
              <Link href={`/video/${project.id}`} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                继续编辑 →
              </Link>
            </div>
          </div>
        ))}
        {!loading && projects.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-text-muted)]">
            还没有视频项目。
          </div>
        ) : null}
      </div>
    </div>
  );
}
