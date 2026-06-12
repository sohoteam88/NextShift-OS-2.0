import { VideoProductionFlow } from '@/modules/video/components/VideoProductionFlow';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewVideoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const platform = first(sp.platform);
  const mappedPlatform = platform === 'instagram'
    ? 'instagram_reel'
    : platform === 'facebook'
      ? 'facebook_reel'
      : platform === 'story'
        ? 'instagram_story'
        : platform;

  return (
    <VideoProductionFlow
      initialInput={{
        topic: first(sp.topic) ?? '',
        content_pillar: first(sp.pillar) ?? '',
        platform: mappedPlatform as never,
        calendar_id: first(sp.calendar_id) ?? first(sp.calendarId),
      }}
    />
  );
}
