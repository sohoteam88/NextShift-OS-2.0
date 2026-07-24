import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (key === 'progressComplete') return `${values?.progress}% complete`;
    if (key === 'verifiedCount') return `${values?.count} verified`;
    if (key === 'remainingCount') return `${values?.count} remaining`;
    if (key === 'minutes') return `${values?.minutes} minutes`;
    return {
      nextStepBadge: 'Next action',
      todayFocus: 'Do this one thing today.',
      whyThis: 'Why this',
      whyNow: 'Why now',
      whyNotOthers: 'Why not another task',
      currentStep: 'Current step',
      missionVerifying: 'Mission completion is being verified',
      VERIFIED: 'Verified',
      completed: 'Completed',
      confirmingFoundation: 'The system is confirming your business foundation.',
      executionSteps: 'Execution steps',
      priority: 'Priority',
      Critical: 'Critical',
      High: 'High',
      Normal: 'Normal',
      currentGap: 'Current gap',
      expectedOutcome: 'Expected outcome',
      nextMilestone: 'Next milestone',
      nextMilestoneHelp: 'Finish this step first.',
      startMission: 'Start mission',
      alternativeSuggestion: 'AI has another suggestion',
      viewAlternativeSuggestion: 'View suggestion',
      hideAlternativeSuggestion: 'Hide suggestion',
    }[key] ?? key;
  },
}));

vi.mock('lucide-react', () => ({
  ArrowRight: () => createElement('svg'),
  Check: () => createElement('svg'),
  Clock3: () => createElement('svg'),
  Route: () => createElement('svg'),
  Sparkles: () => createElement('svg'),
  Target: () => createElement('svg'),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => createElement('a', { href }, children),
}));

import { AICommandCardView, type AICommandCardProps } from './AICommandCard';
describe('AICommandCardView', () => {
  it('renders only the mission, reason, action, and estimated time', () => {
    const html = renderToStaticMarkup(createElement(AICommandCardView, baseProps()));

    expect(html).toContain('Prepare your offer');
    expect(html).toContain('Start mission');
    expect(html).toContain('15 minutes');
    expect(html).not.toContain('Execution steps');
    expect(html).not.toContain('Current gap');
  });
});

function baseProps(overrides: Partial<AICommandCardProps> = {}): AICommandCardProps {
  return {
    todayMission: 'Prepare your offer',
    missionDescription: 'Turn your customer insight into one clear offer.',
    missionReason: 'Mission reason.',
    estimatedTime: '15 minutes',
    executeRoute: '/offers',
    ...overrides,
  };
}
