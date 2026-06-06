import type { ReactNode } from 'react';
import { AppShell } from '@/components/layouts/AppShell';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
