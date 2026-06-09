import { redirect } from 'next/navigation';

// Brand-builder wizard replaced this onboarding step.
// Redirect to the unified wizard entry point.
export default function OnboardingBrandPage() {
  redirect('/brand-builder');
}
