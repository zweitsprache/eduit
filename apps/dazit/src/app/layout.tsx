import type { Metadata } from 'next';
import './globals.css';
import '@neondatabase/auth-ui/css';
import { dazitSiteUrl } from '@/lib/site-url';
import { SiteFooter } from '@/components/site-footer';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  metadataBase: dazitSiteUrl(),
  icons: {
    icon: [
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/dazit_icon_orange.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon-48x48.png'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: 'DaZ Arbeitsblätter zum Ausdrucken',
    template: '%s · DaZit',
  },
  description: 'Druckfertige DaZ Arbeitsblätter, Dialoge, Lernkarten und Tabellen für A1 bis B1. Sofort einsetzbar im Unterricht.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'de_CH',
    siteName: 'DaZit',
    title: 'DaZ Arbeitsblätter zum Ausdrucken',
    description: 'Druckfertige DaZ Arbeitsblätter, Dialoge, Lernkarten und Tabellen für A1 bis B1. Sofort einsetzbar im Unterricht.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DaZ Arbeitsblätter zum Ausdrucken',
    description: 'Druckfertige DaZ Arbeitsblätter, Dialoge, Lernkarten und Tabellen für A1 bis B1. Sofort einsetzbar im Unterricht.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de-CH">
      <body><AuthProvider>{children}<SiteFooter /></AuthProvider></body>
    </html>
  );
}
