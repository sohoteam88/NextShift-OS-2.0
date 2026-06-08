'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { List, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KanbanBoard } from '@/modules/crm/components/KanbanBoard';
import { StageManagerDialog } from '@/modules/crm/components/StageManagerDialog';
import { usePipelineStages, useLeadsByStage, useMoveLeadStage } from '@/modules/crm/hooks/use-pipeline';
import { useToast } from '@/stores/toast-store';

export default function PipelinePage() {
  const router = useRouter();
  const t = useTranslations('crm');
  const { toast } = useToast();
  const [managerOpen, setManagerOpen] = useState(false);

  const { data: stagesData, isLoading: stagesLoading } = usePipelineStages();
  const { data: leadsByStage, isLoading: leadsLoading } = useLeadsByStage();
  const moveCard = useMoveLeadStage();

  const stages = stagesData?.data ?? [];

  async function handleMoveCard(leadId: string, toStage: string) {
    try {
      await moveCard.mutateAsync({ id: leadId, pipelineStage: toStage });
    } catch {
      toast('error', t('pipeline.moveFailed'));
    }
  }

  return (
    <div className="flex min-w-0 flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('pipeline.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<List className="h-4 w-4" />}
            onClick={() => router.push('/crm')}
          >
            {t('pipeline.listView')}
          </Button>
          {stages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings2 className="h-4 w-4" />}
              onClick={() => setManagerOpen(true)}
            >
              {t('pipeline.manageStages')}
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard
          stages={stages}
          leadsByStage={leadsByStage ?? {}}
          loading={stagesLoading || leadsLoading}
          onMoveCard={handleMoveCard}
        />
      </div>

      {managerOpen && stages.length > 0 && (
        <StageManagerDialog
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
          stages={stages}
        />
      )}
    </div>
  );
}
