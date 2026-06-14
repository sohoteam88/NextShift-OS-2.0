import dynamic from 'next/dynamic';

const WorkforceDashboard = dynamic(
  () => import('@/modules/ai/components/WorkforceDashboard').then(m => ({ default: m.WorkforceDashboard })),
  { loading: () => <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div> },
);

export default function WorkforcePage() {
  return <div className="py-6 px-4"><WorkforceDashboard /></div>;
}
