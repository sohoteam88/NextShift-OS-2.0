'use client';

import { useSearchParams } from 'next/navigation';
import { VideoScriptGenerator } from './VideoScriptGenerator';

type Platform = 'facebook_reel' | 'instagram_reel' | 'tiktok' | 'story';

const VALID_PLATFORMS: Platform[] = ['facebook_reel', 'instagram_reel', 'tiktok', 'story'];

export function VideoScriptGeneratorWrapper() {
  const sp = useSearchParams();
  const topic = sp.get('topic') ?? '';
  const rawPlatform = sp.get('platform') ?? '';
  const calendarId = sp.get('calendarId') ?? undefined;

  // Map calendar platform values (facebook, instagram) to script platform values
  const platformMap: Record<string, Platform> = {
    facebook: 'facebook_reel',
    instagram: 'instagram_reel',
    tiktok: 'tiktok',
    facebook_reel: 'facebook_reel',
    instagram_reel: 'instagram_reel',
    story: 'story',
  };
  const platform: Platform =
    (platformMap[rawPlatform] as Platform | undefined) ??
    (VALID_PLATFORMS.includes(rawPlatform as Platform) ? (rawPlatform as Platform) : 'facebook_reel');

  return (
    <VideoScriptGenerator
      defaultTopic={topic}
      defaultPlatform={platform}
      calendarId={calendarId}
    />
  );
}
