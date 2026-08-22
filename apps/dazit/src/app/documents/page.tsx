import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DocumentsClientPage } from '@/components/documents-client-page';
import { SiteHeader } from '@/components/site-header';
import { getWorksheetCards } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';

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
      <Suspense fallback={<main className="library-layout" />}>
        <DocumentsClientPage worksheets={worksheets} />
      </Suspense>
    </>
  );
}
