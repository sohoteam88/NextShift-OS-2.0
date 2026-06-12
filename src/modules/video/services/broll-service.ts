import { getRouterForTenant } from '@/modules/ai/router';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { BRollItem, MasterScript } from '../types';
import { parseJsonFromAI } from './json';

function fallbackBRoll(script: MasterScript, style: string): BRollItem[] {
  return script.scenes.slice(1, Math.min(4, script.scenes.length)).map((scene) => ({
    scene_number: scene.scene_number,
    description: scene.visual,
    source_suggestion: style === 'faceless' ? 'ai_generated' : 'film_yourself',
    stock_search_terms: style === 'faceless' ? ['productive workspace', 'daily routine'] : undefined,
    duration_seconds: 3,
  }));
}

export const brollService = {
  async generate(user: AuthUser, script: MasterScript, style: string): Promise<BRollItem[]> {
    const router = await getRouterForTenant(user.tenantId);
    const sourceGuidance = style === 'faceless'
      ? 'Prioritize ai_generated and stock_footage since the creator does not appear on camera.'
      : 'Mix film_yourself for personal moments with stock_footage/ai_generated for supporting visuals.';

    const systemPrompt = `Identify which scenes need supplementary B-roll footage and where to source it.

${sourceGuidance}

For each B-roll need:
- description: what footage should show
- source_suggestion: film_yourself | stock_footage | ai_generated | screen_recording
- stock_search_terms: if stock_footage, give 2-3 English search terms usable on Pexels/Mixkit
- duration_seconds: how long this B-roll segment should be

Not every scene needs B-roll. Return ONLY JSON array of BRollItem.`;

    const result = await router.generate(
      { systemPrompt, userMessage: JSON.stringify(script), temperature: 0.5, maxTokens: 1000 },
      'video_script',
    );

    await logAIUsage({ tenantId: user.tenantId, userId: user.id, feature: 'broll_list', result, routing: result.routing });

    const fallback = fallbackBRoll(script, style);
    const parsed = parseJsonFromAI<{ items?: BRollItem[] } | BRollItem[]>(result.text, fallback);
    return Array.isArray(parsed) ? parsed : parsed.items ?? fallback;
  },
};
