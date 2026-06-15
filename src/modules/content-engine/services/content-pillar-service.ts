// Content Pillar Engine — auto-generates 5 pillars from Brand DNA

import type { ContentPillar } from '../types/content.types';

const DEFAULT_PILLARS: ContentPillar[] = [
  {
    id: 'personal_story', title: 'Personal Story', emoji: '📖',
    topics: ['My Journey', 'My Struggles', 'My Lessons', 'Behind the Scenes'],
    percentage: 25,
  },
  {
    id: 'education', title: 'Education', emoji: '🎓',
    topics: ['Work From Home', 'Personal Branding', 'AI Tools', 'Business Systems'],
    percentage: 30,
  },
  {
    id: 'social_proof', title: 'Social Proof', emoji: '⭐',
    topics: ['Case Study', 'Success Story', 'Transformation', 'Testimonial'],
    percentage: 20,
  },
  {
    id: 'lifestyle', title: 'Lifestyle', emoji: '🌿',
    topics: ['Family', 'Freedom', 'Daily Routine', 'Work-Life Balance'],
    percentage: 15,
  },
  {
    id: 'offer', title: 'Offer', emoji: '🚀',
    topics: ['Invitation', 'Webinar', 'Lead Magnet', 'Consultation'],
    percentage: 10,
  },
];

export function generateContentPillars(brandContext?: { audience?: string; industry?: string }): ContentPillar[] {
  // In V2, pillars are personalized from Brand DNA. Defaults used as base.
  const pillars = [...DEFAULT_PILLARS];

  if (brandContext?.industry === 'health') {
    pillars[1].topics = ['Nutrition Tips', 'Workout Routines', 'Health Science', 'Meal Planning'];
  } else if (brandContext?.industry === 'recruitment') {
    pillars[1].topics = ['Side Income Ideas', 'Time Management', 'Skill Building', 'Opportunity Spotting'];
  }

  return pillars;
}

export function getPillarById(id: string): ContentPillar | undefined {
  return DEFAULT_PILLARS.find(p => p.id === id);
}
