'use client';

import { useTranslations } from 'next-intl';
import { AIPromptPanel } from './AIPromptPanel';

type Props = {
  leadId?: string;
  defaultValues?: Record<string, string>;
  onGenerated?: (result: unknown) => void;
};

export function LeadAnalysisPanel(props: Props) {
  const t = useTranslations('ai');
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text)]">{t('leadAnalysis')}</h3>
        <p className="text-sm text-[var(--color-text-muted)]">{t('analysisHelp')}</p>
      </div>
      <AIPromptPanel feature="lead_analysis" {...props} />
    </section>
  );
}
