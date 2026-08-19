import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LibraryBrowser } from '@/components/library-browser';
import { SiteHeader } from '@/components/site-header';
import { absoluteDazitUrl } from '@/lib/site-url';
import { LEVELS } from '@/lib/seo-taxonomy';
import { getWorksheetCards } from '@/lib/worksheets';

type Props = {
  params: Promise<{ level: string }>;
};

export const revalidate = 1800;

export function generateStaticParams() {
  return LEVELS.map((level) => ({ level }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level } = await params;
  if (!LEVELS.includes(level as (typeof LEVELS)[number])) return {};

  const canonicalPath = `/niveau/${encodeURIComponent(level)}`;
  const title = `DaZ Arbeitsblaetter ${level}`;
  const description = `Druckfertige DaZ Arbeitsblaetter auf Niveau ${level} fuer Erwachsene. Direkt einsetzbar im Unterricht.`;

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

export default async function LevelLandingPage({ params }: Props) {
  const { level } = await params;
  if (!LEVELS.includes(level as (typeof LEVELS)[number])) notFound();

  const worksheets = await getWorksheetCards();
  const filtered = worksheets.filter((worksheet) => worksheet.level === level);
  const canonicalPath = `/niveau/${encodeURIComponent(level)}`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': absoluteDazitUrl(`${canonicalPath}#collection-page`),
      url: absoluteDazitUrl(canonicalPath),
      name: `DaZ Arbeitsblaetter ${level}`,
      description: `Druckfertige DaZ Arbeitsblaetter auf Niveau ${level} fuer Erwachsene.`,
      inLanguage: 'de-CH',
      mainEntity: { '@id': absoluteDazitUrl(`${canonicalPath}#itemlist`) },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': absoluteDazitUrl(`${canonicalPath}#itemlist`),
      name: `DaZit Bibliothek Niveau ${level}`,
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
      <div className="subject-bar" aria-label="Sprachniveaus">
        <strong>Niveaus</strong>
        {LEVELS.map((item) => (
          <Link href={`/niveau/${encodeURIComponent(item)}`} key={item}>{item}</Link>
        ))}
      </div>
      <LibraryBrowser
        initialLevels={[level]}
        worksheets={worksheets}
      />
    </>
  );
}
