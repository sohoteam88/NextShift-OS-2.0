import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default function RetiredRevenueDriversLayout({ children: _children }: { children: ReactNode }) {
  redirect('/');
}
