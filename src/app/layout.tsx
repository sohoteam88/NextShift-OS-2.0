import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NextShift OS',
  description: 'AI-guided personal brand, funnel, content, CRM, data, and automation system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
