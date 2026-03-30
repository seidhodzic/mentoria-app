import './marketing.css';
import type { Metadata } from 'next';
import { MarketingHome } from '@/components/marketing/MarketingHome';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Mentoria — Sports, Investment & Education Advisory',
  description:
    'Boutique advisory platform for sport, investment and executive education across the Balkans.',
  openGraph: {
    title: 'Mentoria — Sports, Investment & Education Advisory',
    description:
      'Boutique advisory platform for sport, investment and executive education across the Balkans.',
    type: 'website',
    siteName: 'Mentoria',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentoria — Sports, Investment & Education Advisory',
    description:
      'Boutique advisory platform for sport, investment and executive education across the Balkans.',
  },
};

export default function HomePage() {
  return <MarketingHome />;
}
