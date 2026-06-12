import type { AuthUser } from '@/modules/auth/services/auth-service';
import { missionService } from '../services/mission-service';

export async function notifyMissionProgress(user: AuthUser, checkKey: string) {
  try {
    return await missionService.completeCheck(user, checkKey);
  } catch (error) {
    console.error('Mission progress tracking failed:', error);
    return { newlyCompleted: null, isNewMilestone: false, newAchievements: [] };
  }
}
