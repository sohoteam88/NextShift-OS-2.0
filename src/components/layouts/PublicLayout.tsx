import type { ReactNode } from 'react';

type PublicLayoutProps = {
  children: ReactNode;
};

export function PublicLayout({ children }: PublicLayoutProps) {
  return <main className="min-h-screen bg-white text-slate-950">{children}</main>;
}
