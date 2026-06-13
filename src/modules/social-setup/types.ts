// ============================================================
// Social Setup — Type Definitions
// ============================================================

export type SocialPlatform = 'facebook' | 'instagram';

export interface FacebookSetup {
  pageName: string;
  about: string;
  cta: string;
  ctaType: 'whatsapp' | 'learn_more' | 'sign_up' | 'book' | 'shop';
  firstPostDirection: string;
}

export interface InstagramSetup {
  username: string;
  displayName: string;
  bio: string;
  highlights: string[];
  linkInBio: string;
  linkCta: string;
  whatsappPrefilled: string;
}

export interface VisualBrandSetup {
  profilePicturePrompt: string;
  coverBannerPrompt: string;
  brandColors: string[];
}

export interface SocialSetup {
  facebook: FacebookSetup;
  instagram: InstagramSetup;
  visual: VisualBrandSetup;
  linkStrategy: string;
  status: 'draft' | 'generated' | 'saved';
  createdAt: string;
  updatedAt: string;
}

export interface SocialReadinessResult {
  score: number;
  facebookCompleteness: number;
  instagramCompleteness: number;
  bioClarity: number;
  ctaClarity: number;
  visualConsistency: number;
  linkStrategy: number;
  missingItems: string[];
  recommendations: string[];
}

export const EMPTY_FACEBOOK: FacebookSetup = {
  pageName: '',
  about: '',
  cta: '',
  ctaType: 'learn_more',
  firstPostDirection: '',
};

export const EMPTY_INSTAGRAM: InstagramSetup = {
  username: '',
  displayName: '',
  bio: '',
  highlights: [],
  linkInBio: '',
  linkCta: '',
  whatsappPrefilled: '',
};

export const EMPTY_VISUAL: VisualBrandSetup = {
  profilePicturePrompt: '',
  coverBannerPrompt: '',
  brandColors: [],
};

export const EMPTY_SOCIAL_SETUP: SocialSetup = {
  facebook: EMPTY_FACEBOOK,
  instagram: EMPTY_INSTAGRAM,
  visual: EMPTY_VISUAL,
  linkStrategy: '',
  status: 'draft',
  createdAt: '',
  updatedAt: '',
};
