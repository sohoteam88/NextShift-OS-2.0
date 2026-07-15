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
import {
  isDivergentRecommendation,
  mergeMissionReason,
} from '../lib/mission-recommendation';

describe('AICommandCardView', () => {
  it('merges a consistent recommendation rationale into Why this without an alternative strip', () => {
    const missionReason = mergeMissionReason('Mission reason.', 'Engine rationale.');
    const html = renderToStaticMarkup(createElement(AICommandCardView, baseProps({
      missionReason,
    })));

    expect(html).toContain('data-testid="today-mission-card"');
    expect(html).toContain('Mission reason.');
    expect(html).toContain('Engine rationale.');
    expect(html).not.toContain('mission-alternative-suggestion');
  });

  it('renders an expanded alternative suggestion inside the mission card', () => {
    const recommendation = {
      recommendation: {
        id: 'engine-1',
        title: 'Contact the warmest lead',
        summary: 'Focus on the strongest sales signal.',
        rationale: 'The decision engine detected a stronger sales signal.',
      },
      confidence: 0.8,
      explain: 'The decision engine detected a stronger sales signal.',
      source: 'engine' as const,
    };
    expect(isDivergentRecommendation(recommendation, 'Prepare your offer')).toBe(true);
    const html = renderToStaticMarkup(createElement(AICommandCardView, baseProps({
      alternativeSuggestion: {
        title: recommendation.recommendation.title,
        rationale: recommendation.explain,
        open: true,
        onToggle: vi.fn(),
      },
    })));

    expect(html).toContain('data-testid="mission-alternative-suggestion"');
    expect(html).toContain('AI has another suggestion');
    expect(html).toContain('Contact the warmest lead');
    expect(html).toContain('The decision engine detected a stronger sales signal.');
  });

  it('does not treat rule recommendations as divergent', () => {
    expect(isDivergentRecommendation({
      recommendation: {
        id: 'rule-1',
        title: 'Complete the AI Interview',
        summary: 'Finish your onboarding signal.',
        rationale: 'The mission-derived rule needs this first.',
      },
      confidence: 1,
      explain: 'The mission-derived rule needs this first.',
      source: 'rule',
    }, 'Prepare your offer')).toBe(false);
  });

  it('keeps all mission content available without a recommendation or discussion entry', () => {
    const html = renderToStaticMarkup(createElement(AICommandCardView, baseProps()));

    expect(html).toContain('Prepare your offer');
    expect(html).toContain('Define the outcome');
    expect(html).toContain('Start mission');
    expect(html).not.toContain('mission-alternative-suggestion');
    expect(html).not.toContain('Discuss with AI');
  });
});

function baseProps(overrides: Partial<AICommandCardProps> = {}): AICommandCardProps {
  return {
    completedItems: ['Business goal saved'],
    currentGap: 'No validated offer yet',
    todayMission: 'Prepare your offer',
    missionDescription: 'Turn your customer insight into one clear offer.',
    steps: [{
      id: 'step-1',
      title: 'Define the outcome',
      description: 'Write the outcome your buyer wants.',
      estimatedMinutes: 15,
      required: true,
    }],
    currentStep: {
      id: 'step-1',
      title: 'Define the outcome',
      description: 'Write the outcome your buyer wants.',
      estimatedMinutes: 15,
      required: true,
    },
    progress: 35,
    passedChecks: ['Business goal saved'],
    remainingChecks: 2,
    nextRequiredCheck: 'Offer outcome is defined',
    verificationStatus: 'VERIFIED',
    missionReason: 'Mission reason.',
    whyNow: 'This unlocks your next customer action.',
    decisionReason: 'Other tasks depend on the offer.',
    nextMilestone: 'Publish the offer',
    priorityLevel: 'High',
    estimatedTime: '15 minutes',
    expectedOutcome: 'A clear offer outcome',
    executeRoute: '/offers',
    ...overrides,
  };
}
