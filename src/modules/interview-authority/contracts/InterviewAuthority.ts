import type { AudienceSnapshot } from './AudienceSnapshot';
import type { BusinessContextSnapshot } from './BusinessContextSnapshot';
import type { InterviewProfileSnapshot } from './InterviewProfileSnapshot';

export interface InterviewAuthority {
  profile: InterviewProfileSnapshot;
  audience: AudienceSnapshot;
  businessContext: BusinessContextSnapshot;
}
