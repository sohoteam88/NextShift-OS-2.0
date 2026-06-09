'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { FacebookGuide } from './guides/FacebookGuide';
import { InstagramGuide } from './guides/InstagramGuide';

type BrandProfile = Record<string, unknown>;

type StepProgress = {
  steps_done: number[];
  completed: boolean;
  completed_at?: string;
};

type SetupProgress = {
  facebook?: StepProgress;
  instagram?: StepProgress;
};

type Props = {
  brandProfile: BrandProfile;
  platforms: string[];
  phone?: string;
  funnelUrl?: string;
  onComplete?: () => void;
};

const FB_TOTAL_STEPS = 7;
const IG_TOTAL_STEPS = 6;

async function saveProgress(platform: string, step: number, completed: boolean) {
  await fetch('/api/v1/brand-builder/guide-progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, step, completed }),
  });
}

function isGuideComplete(steps_done: number[], total: number): boolean {
  return steps_done.length >= total;
}

export function PlatformGuideStep({
  brandProfile,
  platforms,
  phone = '',
  funnelUrl = '',
  onComplete,
}: Props) {
  const t = useTranslations('brandBuilder');
  const activePlatforms = platforms.filter((p) => p === 'facebook' || p === 'instagram');
  const [activePlatform, setActivePlatform] = React.useState(activePlatforms[0] ?? 'facebook');
  const [progress, setProgress] = React.useState<SetupProgress>({});
  const [loadingProgress, setLoadingProgress] = React.useState(true);

  React.useEffect(() => {
    void fetch('/api/v1/brand-builder/guide-progress')
      .then((r) => r.json())
      .then((json: { data: SetupProgress | null }) => {
        if (json.data) setProgress(json.data);
      })
      .catch(() => {})
      .finally(() => setLoadingProgress(false));
  }, []);

  async function handleStepComplete(platform: string, step: number) {
    setProgress((prev) => {
      const current = prev[platform as keyof SetupProgress] ?? { steps_done: [], completed: false };
      const steps_done = current.steps_done.includes(step)
        ? current.steps_done
        : [...current.steps_done, step];
      const total = platform === 'facebook' ? FB_TOTAL_STEPS : IG_TOTAL_STEPS;
      const completed = isGuideComplete(steps_done, total);
      return {
        ...prev,
        [platform]: {
          steps_done,
          completed,
          completed_at: completed ? new Date().toISOString() : current.completed_at,
        },
      };
    });
    await saveProgress(platform, step, true);
  }

  const fbDone = progress.facebook?.steps_done ?? [];
  const igDone = progress.instagram?.steps_done ?? [];

  const fbComplete = isGuideComplete(fbDone, FB_TOTAL_STEPS);
  const igComplete = isGuideComplete(igDone, IG_TOTAL_STEPS);

  const allSelectedComplete = activePlatforms.every((p) =>
    p === 'facebook' ? fbComplete : igComplete,
  );

  if (loadingProgress) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-[var(--color-text-muted)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        加载进度...
      </div>
    );
  }

  if (allSelectedComplete) {
    return (
      <div className="space-y-6 py-4 text-center">
        <div className="text-4xl">🎉</div>
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{t('allDoneTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('allDoneSubtitle')}</p>
        </div>

        <div className="mx-auto max-w-xs space-y-2">
          {activePlatforms.includes('facebook') && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              {t('allDoneFacebook')}
            </div>
          )}
          {activePlatforms.includes('instagram') && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              {t('allDoneInstagram')}
            </div>
          )}
        </div>

        {onComplete && (
          <Button onClick={onComplete}>{t('continueBtn')}</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">{t('guideTitle')}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('guideSubtitle')}</p>
      </div>

      {activePlatforms.length > 1 && (
        <div className="flex gap-2">
          {activePlatforms.map((p) => {
            const label = p === 'facebook' ? t('platformFacebook') : t('platformInstagram');
            const done = p === 'facebook' ? fbComplete : igComplete;
            const stepsDone = (p === 'facebook' ? fbDone : igDone).length;
            const total = p === 'facebook' ? FB_TOTAL_STEPS : IG_TOTAL_STEPS;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActivePlatform(p)}
                className={cn(
                  'flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium transition-colors',
                  activePlatform === p
                    ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : null}
                {label}
                {!done && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {stepsDone}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {activePlatform === 'facebook' && (
        <FacebookGuide
          brandProfile={brandProfile}
          phone={phone}
          stepsDone={fbDone}
          onStepComplete={(step) => void handleStepComplete('facebook', step)}
        />
      )}

      {activePlatform === 'instagram' && (
        <InstagramGuide
          brandProfile={brandProfile}
          funnelUrl={funnelUrl}
          stepsDone={igDone}
          onStepComplete={(step) => void handleStepComplete('instagram', step)}
        />
      )}
    </div>
  );
}
