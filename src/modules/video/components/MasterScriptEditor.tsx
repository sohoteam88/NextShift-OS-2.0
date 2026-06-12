'use client';

import * as React from 'react';
import { Loader2, Pencil } from 'lucide-react';
import type { MasterScript, ScriptScene } from '../types';

type Props = {
  projectId: string;
  script: MasterScript;
  onSceneUpdated: (scene: ScriptScene) => void;
};

function SceneCard({
  projectId,
  scene,
  onSceneUpdated,
}: {
  projectId: string;
  scene: ScriptScene;
  onSceneUpdated: (scene: ScriptScene) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [instruction, setInstruction] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function regenerate() {
    if (!instruction.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/v1/video/projects/${projectId}/scenes/${scene.scene_number}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });
    const json = await res.json() as { data?: ScriptScene };
    if (res.ok && json.data) {
      onSceneUpdated(json.data);
      setEditing(false);
      setInstruction('');
    }
    setLoading(false);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-[var(--color-text)]">Scene {scene.scene_number} ({scene.time_range}) · {scene.purpose}</h3>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]"
        >
          <Pencil className="h-4 w-4" />
          调整这个场景
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <p><span className="font-medium text-[var(--color-text)]">画面：</span>{scene.visual}</p>
        <p><span className="font-medium text-[var(--color-text)]">字幕：</span>{scene.text_overlay}</p>
        <p><span className="font-medium text-[var(--color-text)]">旁白：</span>{scene.voiceover}</p>
        <p><span className="font-medium text-[var(--color-text)]">情绪：</span>{scene.emotion}</p>
      </div>
      {editing ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={3}
            placeholder="告诉 AI 你想怎么改这个场景"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            type="button"
            onClick={() => void regenerate()}
            disabled={loading || !instruction.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            重新生成这个场景
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MasterScriptEditor({ projectId, script, onSceneUpdated }: Props) {
  return (
    <section className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">主脚本：{script.title}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">总时长：{script.total_duration} · 节奏：{script.pacing_notes}</p>
      </div>
      {script.scenes.map((scene) => (
        <SceneCard key={scene.scene_number} projectId={projectId} scene={scene} onSceneUpdated={onSceneUpdated} />
      ))}
      <div className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-[var(--color-text)]">下一步：生成分镜与素材清单</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Task 02 会接上 Shot List、B-Roll 和 AI 视频提示词。</p>
      </div>
    </section>
  );
}
