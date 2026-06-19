import { interviewAuthorityService } from './InterviewAuthorityService';
import type { InterviewAuthorityProjection } from '../contracts/InterviewAuthorityProjection';
import { projectInterviewAuthority } from './interview-projection';

export const interviewAuthorityProjectionService = {
  async getInterviewAuthorityProjection(userId: string): Promise<InterviewAuthorityProjection> {
    const authority = await interviewAuthorityService.getInterviewAuthority(userId);
    return projectInterviewAuthority(authority);
  },
};

export async function getInterviewAuthorityProjection(userId: string): Promise<InterviewAuthorityProjection> {
  return interviewAuthorityProjectionService.getInterviewAuthorityProjection(userId);
}
