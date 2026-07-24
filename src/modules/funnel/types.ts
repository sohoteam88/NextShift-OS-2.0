export type FunnelPageType = 'landing' | 'quiz' | 'lead_magnet';

export interface FunnelTheme {
  primary_color: string;
  bg_color: string;
  font: 'system' | 'inter' | 'noto-sans-sc';
}

export interface HeroSection {
  type: 'hero';
  headline: string;
  subheadline: string;
  image_url?: string;
  cta_text: string;
  cta_type: 'whatsapp' | 'form' | 'link';
  cta_target: string;
}

export interface BenefitsSection {
  type: 'benefits';
  title: string;
  items: { icon: string; title: string; description: string }[];
}

export interface TestimonialSection {
  type: 'testimonial';
  title?: string;
  items: { name: string; text: string; avatar_url?: string }[];
}

export interface FormSection {
  type: 'form';
  title?: string;
  fields: ('name' | 'phone' | 'email' | 'whatsapp')[];
  submit_text: string;
  success_message: string;
  whatsapp_redirect?: string;
}

export interface PainSection {
  type: 'pain';
  title: string;
  items: { text: string }[];
}

export interface MechanismSection {
  type: 'mechanism';
  title: string;
  description: string;
  image_url?: string;
}

export interface FAQSection {
  type: 'faq';
  title: string;
  items: { question: string; answer: string }[];
}

export interface CTASection {
  type: 'cta';
  headline: string;
  subheadline?: string;
  button_text: string;
  button_type: 'whatsapp' | 'form' | 'link';
  button_target: string;
}

export type FunnelSection =
  | HeroSection
  | BenefitsSection
  | TestimonialSection
  | FormSection
  | PainSection
  | MechanismSection
  | FAQSection
  | CTASection;

export interface QuizOption {
  text: string;
  score: number;
}

export interface QuizQuestion {
  text: string;
  options: QuizOption[];
}

export interface QuizResult {
  min_score: number;
  max_score: number;
  title: string;
  description: string;
  cta_text?: string;
  cta_target?: string;
}

export interface QuizConfig {
  questions: QuizQuestion[];
  results: QuizResult[];
  capture_before_results?: boolean;
}

export interface FunnelConfig {
  type: FunnelPageType;
  theme: FunnelTheme;
  sections: FunnelSection[];
  /** Brand DNA version used when this generated/published config was created. */
  brandDnaVersion?: number;
  quiz?: QuizConfig;
  tracking?: {
    facebook_pixel?: string;
    google_analytics?: string;
  };
}
