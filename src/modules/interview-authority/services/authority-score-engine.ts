import type { InterviewAuthority } from '../contracts/InterviewAuthority';

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateAuthorityScore(authority: InterviewAuthority) {
  const experience = authority.profile.experienceLevel === 'advanced'
    ? 25
    : authority.profile.experienceLevel === 'intermediate'
      ? 15
      : 5;
  const skills = Math.min(authority.profile.primarySkills.length * 8, 25);
  const story = authority.profile.personalStory ? 20 : 0;
  const mission = authority.profile.missionStatement ? 15 : 0;
  const audienceProblems = Math.min(authority.audience.audienceProblems.length * 5, 15);

  return clamp(experience + skills + story + mission + audienceProblems);
}
