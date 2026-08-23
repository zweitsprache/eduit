import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LibraryBrowser } from '@/components/library-browser';
import { SiteHeader } from '@/components/site-header';
import { absoluteDazitUrl } from '@/lib/site-url';
import { TYPES, typeLabelFromSlug } from '@/lib/seo-taxonomy';
import { getWorksheetCards } from '@/lib/worksheets';

type Props = {
  params: Promise<{ type: string }>;
};

export const revalidate = 30;

export function generateStaticParams() {
  return TYPES.map((item) => ({ type: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const typeLabel = typeLabelFromSlug(type);
  if (!typeLabel) return {};

  const canonicalPath = `/typ/${encodeURIComponent(type)}`;
  const title = `DaZ ${typeLabel} zum Ausdrucken`;
  const description = `Druckfertige ${typeLabel} fuer DaZ-Kurse mit Erwachsenen. Direkt herunterladen und im Unterricht einsetzen.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
      locale: 'de_CH',
      siteName: 'DaZit',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function TypeLandingPage({ params }: Props) {
  const { type } = await params;
  const typeLabel = typeLabelFromSlug(type);
  if (!typeLabel) notFound();

  const worksheets = await getWorksheetCards();
  const filtered = worksheets.filter((worksheet) => worksheet.documentType === typeLabel);
  const canonicalPath = `/typ/${encodeURIComponent(type)}`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': absoluteDazitUrl(`${canonicalPath}#collection-page`),
      url: absoluteDazitUrl(canonicalPath),
      name: `DaZ ${typeLabel} zum Ausdrucken`,
      description: `Druckfertige ${typeLabel} fuer DaZ-Kurse mit Erwachsenen.`,
      inLanguage: 'de-CH',
      mainEntity: { '@id': absoluteDazitUrl(`${canonicalPath}#itemlist`) },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': absoluteDazitUrl(`${canonicalPath}#itemlist`),
      name: `DaZit Bibliothek Typ ${typeLabel}`,
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: filtered.length,
      itemListElement: filtered.slice(0, 100).map((worksheet, index) => ({
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
      <div className="subject-bar" aria-label="Dokumenttypen">
        <strong>Typen</strong>
        {TYPES.map((item) => (
          <Link href={`/typ/${encodeURIComponent(item.slug)}`} key={item.slug}>{item.label}</Link>
        ))}
      </div>
      <LibraryBrowser
        initialTypes={[typeLabel]}
        worksheets={worksheets}
      />
    </>
  );
}
