// Team Onboarding Engine — guides new members through the business system

const ONBOARDING_STEPS = [
  { step: 1, title: 'Brand Foundation', milestone: 'brand_foundation' },
  { step: 2, title: 'Content Engine', milestone: 'content_creation' },
  { step: 3, title: 'Lead Engine', milestone: 'lead_generation' },
  { step: 4, title: 'CRM Engine', milestone: 'customer_acquisition' },
  { step: 5, title: 'Sales Engine', milestone: 'system_building' },
];

const TOTAL = ONBOARDING_STEPS.length;

interface MemberProgress {
  memberId: string;
  completedSteps: number;
  currentStep: number;
  percentage: number;
  currentTitle: string;
}

export function getOnboardingProgress(completedMilestones: string[]): MemberProgress {
  const count = ONBOARDING_STEPS.filter(s => completedMilestones.includes(s.milestone)).length;
  const currentIdx = Math.min(count, TOTAL - 1);
  return {
    memberId: '',
    completedSteps: count,
    currentStep: count + 1,
    percentage: Math.round((count / TOTAL) * 100),
    currentTitle: count < TOTAL ? ONBOARDING_STEPS[currentIdx].title : 'Complete',
  };
}

export function getOnboardingSteps(): typeof ONBOARDING_STEPS {
  return ONBOARDING_STEPS;
}
