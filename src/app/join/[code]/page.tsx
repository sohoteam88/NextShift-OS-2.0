import { JoinInviteForm } from '@/modules/member/components/JoinInviteForm';

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }> | { code: string };
}) {
  const resolvedParams = await params;

  return <JoinInviteForm code={resolvedParams.code} />;
}
