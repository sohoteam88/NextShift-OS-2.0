import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default function RetiredCrmLayout({ children: _children }: { children: ReactNode }) {
  redirect('/');
}
