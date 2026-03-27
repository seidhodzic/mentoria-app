import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentoria MVP',
  description: 'Mentoria athlete career management platform MVP scaffold'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="brand">Mentoria</Link>
            <nav>
              <Link href="/login">Member Login</Link>
              <Link href="/register" className="button button-small">Get Started</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
