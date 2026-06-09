import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { getWizardState, WIZARD_STEPS } from '@/modules/brand-builder/services/wizard-state-service';

export default async function WizardLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const state = await getWizardState(user.id);
  const currentStepNum = state.current_step;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
          ← 返回控制台
        </Link>
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          步骤 {currentStepNum} / {WIZARD_STEPS.length}
        </span>
      </header>

      {/* Step progress bar */}
      <div className="border-b border-[var(--color-border)] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* Step dots */}
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, idx) => {
              const stepNum = idx + 1;
              const isDone = state.completed_steps.includes(step.id);
              const isActive = stepNum === currentStepNum;
              return (
                <div key={step.id} className="flex flex-1 flex-col items-center">
                  {idx > 0 && (
                    <div
                      className={`-mx-1 mb-3 h-0.5 w-full ${isDone ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                      style={{ marginTop: '11px', position: 'absolute' }}
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isDone
                        ? 'bg-[var(--color-primary)] text-white'
                        : isActive
                          ? 'border-2 border-[var(--color-primary)] bg-white text-[var(--color-primary)]'
                          : 'border-2 border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                    }`}
                  >
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span
                    className={`mt-1.5 hidden text-[10px] font-medium sm:block ${
                      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar track */}
          <div className="relative mt-2 h-1 w-full rounded-full bg-[var(--color-border)]">
            <div
              className="h-1 rounded-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${((currentStepNum - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
