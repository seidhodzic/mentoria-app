import './globals.css';
import type { Metadata } from 'next';
import { Saira, Saira_Condensed } from 'next/font/google';
import AppToaster from '@/components/AppToaster';
import { getSiteUrl } from '@/lib/env';

const saira = Saira({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-saira',
  display: 'swap',
});

const sairaCondensed = Saira_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-saira-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Mentoria — Members Platform',
  description: 'Premium advisory platform for sports, investment and education professionals',
  icons: { icon: '/mentoria-logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${saira.variable} ${sairaCondensed.variable}`}>
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
