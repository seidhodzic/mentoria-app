import './globals.css';
import type { Metadata } from 'next';
import AppToaster from '@/components/AppToaster';

export const metadata: Metadata = {
  title: 'Mentoria — Members Platform',
  description: 'Mentoria advisory platform',
  icons: { icon: '/mentoria-logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800;900&family=Saira+Condensed:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
