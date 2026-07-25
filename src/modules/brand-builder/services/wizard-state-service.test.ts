import { beforeEach, describe, expect, it, vi } from 'vitest';

let metadata: Record<string, unknown> = {};

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';
import {
  WIZARD_STEPS,
  completeWizardStep,
  getCurrentStepPath,
  restartInterviewStep,
} from './wizard-state-service';

const prismaMock = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe('wizard state without the Review Room step', () => {
  beforeEach(() => {
    metadata = {};
    prismaMock.user.findUnique.mockImplementation(async () => ({ metadata }));
    prismaMock.user.update.mockImplementation(async ({ data }: { data: { metadata: Record<string, unknown> } }) => {
      metadata = data.metadata as Record<string, unknown>;
      return {};
    });
  });

  it('keeps the main path continuous from interview to accounts', async () => {
    expect(WIZARD_STEPS.map((step) => step.id)).toEqual([
      'interview',
      'accounts',
      'platform_guide',
      'complete',
    ]);
    expect(getCurrentStepPath({ current_step: 2, completed_steps: ['interview'], started_at: '2026-01-01' }))
      .toBe('/brand-builder/step/accounts');

    const afterInterview = await completeWizardStep('user-1', 'interview');
    expect(afterInterview.current_step).toBe(2);
    expect(afterInterview.completed_steps).toEqual(['interview']);

    const afterAccounts = await completeWizardStep('user-1', 'accounts');
    expect(afterAccounts.current_step).toBe(3);
    expect(afterAccounts.completed_steps).toEqual(['interview', 'accounts']);
  });

  it('restarts only the interview while retaining later completed work', async () => {
    metadata = {
      brand_builder_state: {
        current_step: 4,
        completed_steps: ['interview', 'accounts', 'platform_guide'],
        started_at: '2026-01-01',
      },
    };

    const restarted = await restartInterviewStep('user-1');

    expect(restarted.current_step).toBe(1);
    expect(restarted.completed_steps).toEqual(['accounts', 'platform_guide']);
  });
});
