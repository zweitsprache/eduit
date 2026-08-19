import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { DocumentsClientPage } from '@/components/documents-client-page';
import { SiteHeader } from '@/components/site-header';
import { getWorksheetCards } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';

const clusterLinks = [
  { href: '/niveau/A1.1', label: 'DaZ Arbeitsblätter A1.1' },
  { href: '/niveau/A1.2', label: 'DaZ Arbeitsblätter A1.2' },
  { href: '/niveau/A2.1', label: 'DaZ Arbeitsblätter A2.1' },
  { href: '/niveau/A2.2', label: 'DaZ Arbeitsblätter A2.2' },
  { href: '/niveau/B1.1', label: 'DaZ Arbeitsblätter B1.1' },
  { href: '/niveau/B1.2', label: 'DaZ Arbeitsblätter B1.2' },
  { href: '/typ/arbeitsblatt', label: 'DaZ Arbeitsblätter druckfertig' },
  { href: '/typ/dialog', label: 'DaZ Dialoge zum Ausdrucken' },
  { href: '/typ/lernkarten', label: 'DaZ Lernkarten PDF' },
  { href: '/typ/verbtabelle', label: 'DaZ Verbtabellen PDF' },
  { href: '/typ/deklinationstabelle', label: 'DaZ Deklinationstabellen PDF' },
];

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'DaZ Arbeitsblätter & Unterrichtsmaterial',
  description: 'Druckfertige Arbeitsblätter, Dialoge, Lernkarten und Tabellen für DaZ-Kurse mit Erwachsenen.',
  alternates: {
    canonical: '/documents',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'DaZ Arbeitsblätter & Unterrichtsmaterial',
    description: 'Druckfertige Arbeitsblätter, Dialoge, Lernkarten und Tabellen für DaZ-Kurse mit Erwachsenen.',
    url: '/documents',
    type: 'website',
    locale: 'de_CH',
    siteName: 'DaZit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DaZ Arbeitsblätter & Unterrichtsmaterial',
    description: 'Druckfertige Arbeitsblätter, Dialoge, Lernkarten und Tabellen für DaZ-Kurse mit Erwachsenen.',
  },
};

export default async function LibraryPage() {
  const worksheets = await getWorksheetCards();
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': absoluteDazitUrl('/documents#collection-page'),
      url: absoluteDazitUrl('/documents'),
      name: 'DaZ Arbeitsblätter & Unterrichtsmaterial',
      description: 'Druckfertige Arbeitsblätter, Dialoge, Lernkarten und Tabellen für DaZ-Kurse mit Erwachsenen.',
      inLanguage: 'de-CH',
      breadcrumb: { '@id': absoluteDazitUrl('/documents#breadcrumb') },
      mainEntity: { '@id': absoluteDazitUrl('/documents#itemlist') },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': absoluteDazitUrl('/documents#breadcrumb'),
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Bibliothek',
          item: absoluteDazitUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Dokumente',
          item: absoluteDazitUrl('/documents'),
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': absoluteDazitUrl('/documents#itemlist'),
      name: 'DaZit Bibliothek',
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: worksheets.length,
      itemListElement: worksheets.slice(0, 100).map((worksheet, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteDazitUrl(`/documents/${worksheet.slug}`),
        name: worksheet.title,
      })),
    },
  ];
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
        }}
        type="application/ld+json"
      />
      <SiteHeader active="library" search />
      <div className="subject-bar" aria-label="Themen">
        <strong>Themen</strong>
        {clusterLinks.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </div>
      <Suspense fallback={<main className="library-layout" />}>
        <DocumentsClientPage worksheets={worksheets} />
      </Suspense>
    </>
  );
}
