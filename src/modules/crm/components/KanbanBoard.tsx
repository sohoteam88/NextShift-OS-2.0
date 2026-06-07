'use client';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { PipelineCard } from './PipelineCard';
import { type PipelineStage } from '../hooks/use-pipeline';
import { type LeadRow } from '../hooks/use-leads';
import { cn } from '@/lib/cn';

type Props = {
  stages: PipelineStage[];
  leadsByStage: Record<string, LeadRow[]>;
  loading?: boolean;
  onMoveCard: (leadId: string, toStage: string) => void;
};

function KanbanColumn({
  stage,
  leads,
  isOver,
}: {
  stage: PipelineStage;
  leads: LeadRow[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: stage.name });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div
        className="mb-2 flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2"
        style={{ backgroundColor: stage.color + '20', borderLeft: `3px solid ${stage.color}` }}
      >
        <span className="text-sm font-semibold text-[var(--color-text)]">{stage.name}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-col gap-2 rounded-[var(--radius-md)] border-2 border-dashed p-2 transition-colors',
          isOver
            ? 'border-[var(--color-primary)] bg-blue-50'
            : leads.length === 0
              ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
              : 'border-transparent',
        )}
      >
        {leads.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">拖拽客户到这里</p>
        ) : (
          leads.map((lead) => <PipelineCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ stages, leadsByStage, loading, onMoveCard }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const activeLead = activeId
    ? Object.values(leadsByStage).flat().find((l) => l.id === activeId)
    : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragOver({ over }: { over: DragEndEvent['over'] }) {
    setOverId(over ? (over.id as string) : null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    if (!over) return;
    const toStage = over.id as string;
    const lead = Object.values(leadsByStage).flat().find((l) => l.id === (active.id as string));
    if (lead && lead.pipelineStage !== toStage) {
      onMoveCard(lead.id, toStage);
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-64 shrink-0 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage[stage.name] ?? []}
            isOver={overId === stage.name}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="w-64 rotate-2 opacity-90">
            <PipelineCard lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
