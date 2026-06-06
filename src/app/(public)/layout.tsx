import type { ReactNode } from 'react';
import { PublicLayout } from '@/components/layouts/PublicLayout';

export default function FunnelPublicLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
