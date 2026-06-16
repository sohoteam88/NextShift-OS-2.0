import { ContentCommandCenter } from '@/modules/content-engine/components/ContentCommandCenter';
import { ContentEngineDashboard } from '@/modules/content-engine/components/ContentEngineDashboard';

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ContentEnginePage({ searchParams }: { searchParams?: SearchParams }) {
  const mode = pickParam(searchParams?.mode);
  const generate = pickParam(searchParams?.generate);
  const platform = pickParam(searchParams?.platform);
  const showGenerator = mode === 'generator' || generate === 'smart' || Boolean(platform);
  const initialPlatform = platform === 'facebook' || platform === 'instagram' || platform === 'tiktok' || platform === 'xhs'
    ? platform
    : undefined;

  return (
    <div className="py-6">
      {showGenerator ? (
        <ContentEngineDashboard
          initialPlatform={initialPlatform}
          autoGenerate={generate === 'smart'}
        />
      ) : (
        <ContentCommandCenter />
      )}
    </div>
  );
}
