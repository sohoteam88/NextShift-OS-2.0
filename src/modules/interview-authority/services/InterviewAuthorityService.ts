import prisma from '@/lib/prisma';
import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import { assembleInterviewAuthority } from '../adapters/InterviewAuthorityAssembler';

export const interviewAuthorityService = {
  async getInterviewAuthority(userId: string): Promise<InterviewAuthority> {
    const [user, brandProfile, brandInterview] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          metadata: true,
        },
      }),
      prisma.brandProfile.findUnique({
        where: { userId },
      }),
      prisma.brandInterview.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return assembleInterviewAuthority({
      brandProfile,
      brandInterview,
      metadata: user?.metadata,
    });
  },
};

export async function getInterviewAuthority(userId: string): Promise<InterviewAuthority> {
  return interviewAuthorityService.getInterviewAuthority(userId);
}
