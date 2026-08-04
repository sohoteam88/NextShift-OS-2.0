import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default function RetiredMissionWorkspaceLayout({ children: _children }: { children: ReactNode }) {
  redirect('/');
}
