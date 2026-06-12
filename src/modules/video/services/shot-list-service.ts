import { getRouterForTenant } from '@/modules/ai/router';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MasterScript, ShotListItem } from '../types';
import { parseJsonFromAI } from './json';

function secondsFromRange(range: string): number {
  const match = range.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return 5;
  return Math.max(1, Number(match[2]) - Number(match[1]));
}

function fallbackShotList(script: MasterScript): ShotListItem[] {
  return script.scenes.map((scene) => ({
    scene_number: scene.scene_number,
    shot_type: scene.scene_number === 1 ? '特写' : '中景',
    subject: scene.visual,
    camera_movement: scene.scene_number === 1 ? '缓慢推近' : '静止',
    duration_seconds: secondsFromRange(scene.time_range),
    lighting_note: '自然光，靠近窗边，避免背光。',
    props_needed: ['手机', '稳定支架或靠墙固定'],
    difficulty: 'easy',
  }));
}

export const shotListService = {
  async generate(user: AuthUser, script: MasterScript, style: string): Promise<ShotListItem[]> {
    const router = await getRouterForTenant(user.tenantId);
    const systemPrompt = `Convert this video script into a filmable shot list for a BEGINNER creator using only a smartphone.

For EACH scene, specify:
- shot_type: 特写 / 中景 / 全景 / 俯拍 / 跟拍 / 手持
- subject: what exactly is in frame
- camera_movement: 静止 / 缓慢推近 / 横移 / 手持晃动
- duration_seconds: matching scene time_range
- lighting_note: natural light or simple home lighting advice
- props_needed: minimal props
- difficulty: easy/medium/hard, most should be easy

Style context: ${style}
Return ONLY JSON array of ShotListItem, one per scene including CTA.`;

    const result = await router.generate(
      { systemPrompt, userMessage: JSON.stringify(script), temperature: 0.4, maxTokens: 1500 },
      'video_script',
    );

    await logAIUsage({ tenantId: user.tenantId, userId: user.id, feature: 'shot_list', result, routing: result.routing });

    const fallback = fallbackShotList(script);
    const parsed = parseJsonFromAI<{ items?: ShotListItem[] } | ShotListItem[]>(result.text, fallback);
    return Array.isArray(parsed) ? parsed : parsed.items ?? fallback;
  },
};
