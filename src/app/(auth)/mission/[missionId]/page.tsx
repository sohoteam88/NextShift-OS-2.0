import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { MissionExecutionWorkspaceClient } from '@/modules/mission-workspace/components/MissionExecutionWorkspaceClient';

export default async function MissionExecutionWorkspacePage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  const { missionId } = await params;

  return <MissionExecutionWorkspaceClient missionId={decodeURIComponent(missionId)} />;
}
