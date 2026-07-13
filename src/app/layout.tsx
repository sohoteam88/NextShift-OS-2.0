import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import localFont from 'next/font/local';
import { AnalyticsInit } from '@/components/AnalyticsInit';
import './globals.css';

export const metadata: Metadata = {
  title: 'NextShift OS',
  description: 'AI-guided personal brand, funnel, content, CRM, data, and automation system.',
};

const inter = localFont({
  src: [
    {
      path: '../../public/fonts/Inter-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Semibold.woff',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSC = localFont({
  src: [
    {
      path: '../../public/fonts/ArialUnicode.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/ArialUnicode.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <AnalyticsInit />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
