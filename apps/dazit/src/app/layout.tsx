import type { Metadata } from 'next';
import './globals.css';
import { dazitSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  metadataBase: dazitSiteUrl(),
  title: {
    default: 'dazit Bibliothek',
    template: '%s · dazit',
  },
  description: 'Druckfertige Materialien für den DaZ-Kurs.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    siteName: 'dazit',
    title: 'dazit Bibliothek',
    description: 'Druckfertige Materialien für den DaZ-Kurs.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'dazit Bibliothek',
    description: 'Druckfertige Materialien für den DaZ-Kurs.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de-CH">
      <body>{children}</body>
    </html>
  );
}
