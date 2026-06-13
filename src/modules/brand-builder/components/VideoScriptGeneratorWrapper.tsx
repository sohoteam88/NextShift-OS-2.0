'use client';

import { useSearchParams } from 'next/navigation';
import { VideoProductionFlow } from '@/modules/video/components/VideoProductionFlow';

type Platform = 'facebook_reel' | 'instagram_reel' | 'tiktok' | 'instagram_story';

const VALID_PLATFORMS: Platform[] = ['facebook_reel', 'instagram_reel', 'tiktok', 'instagram_story'];

export function VideoScriptGeneratorWrapper() {
  const sp = useSearchParams();
  const topic = sp.get('topic') ?? '';
  const rawPlatform = sp.get('platform') ?? '';
  const pillar = sp.get('pillar') ?? '';
  const calendarId = sp.get('calendar_id') ?? sp.get('calendarId') ?? undefined;

  // Map calendar platform values (facebook, instagram) to script platform values
  const platformMap: Record<string, Platform> = {
    facebook: 'facebook_reel',
    instagram: 'instagram_reel',
    tiktok: 'tiktok',
    facebook_reel: 'facebook_reel',
    instagram_reel: 'instagram_reel',
    story: 'instagram_story',
    instagram_story: 'instagram_story',
  };
  const platform: Platform =
    (platformMap[rawPlatform] as Platform | undefined) ??
    (VALID_PLATFORMS.includes(rawPlatform as Platform) ? (rawPlatform as Platform) : 'facebook_reel');

  return (
    <VideoProductionFlow
      initialInput={{
        topic,
        content_pillar: pillar,
        platform,
        calendar_id: calendarId,
      }}
    />
  );
}
