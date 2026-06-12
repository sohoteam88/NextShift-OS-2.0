import { VideoProjectDetail } from '@/modules/video/components/VideoProjectDetail';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VideoProjectPage({ params }: Props) {
  const { id } = await params;
  return <VideoProjectDetail projectId={id} />;
}
