import type { Metadata } from 'next';
import Link from 'next/link';
import { LibraryBrowser } from '@/components/library-browser';
import { SiteHeader } from '@/components/site-header';
import { getWorksheetCards } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';
import { getCurrentDazitUser } from '@/lib/auth/authorization';

const clusterLinks = [
  { href: '/documents?level=A1.1', label: 'DaZ Arbeitsblätter A1.1' },
  { href: '/documents?level=A1.2', label: 'DaZ Arbeitsblätter A1.2' },
  { href: '/documents?level=A2.1', label: 'DaZ Arbeitsblätter A2.1' },
  { href: '/documents?level=A2.2', label: 'DaZ Arbeitsblätter A2.2' },
  { href: '/documents?level=B1.1', label: 'DaZ Arbeitsblätter B1.1' },
  { href: '/documents?level=B1.2', label: 'DaZ Arbeitsblätter B1.2' },
  { href: '/documents?type=Arbeitsblatt', label: 'DaZ Arbeitsblätter druckfertig' },
  { href: '/documents?type=Dialog', label: 'DaZ Dialoge zum Ausdrucken' },
  { href: '/documents?type=Lernkarten', label: 'DaZ Lernkarten PDF' },
  { href: '/documents?type=Verbtabelle', label: 'DaZ Verbtabellen PDF' },
  { href: '/documents?type=Deklinationstabelle', label: 'DaZ Deklinationstabellen PDF' },
];

export const revalidate = 300;

function decodeValue(value?: string) {
  if (!value) return '';
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function buildCanonicalPath(level: string, type: string, searchText: string) {
  const hasSearchText = Boolean(searchText);
  const filtersCount = [level, type, searchText].filter(Boolean).length;
  const singleLevel = Boolean(level) && filtersCount === 1;
  const singleType = Boolean(type) && filtersCount === 1;

  if (hasSearchText) return '/documents';
  if (singleLevel) return `/documents?level=${encodeURIComponent(level)}`;
  if (singleType) return `/documents?type=${encodeURIComponent(type)}`;
  return '/documents';
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string; type?: string }>;
}): Promise<Metadata> {
  const query = await searchParams;
  const level = decodeValue(query.level);
  const type = decodeValue(query.type);
  const searchText = decodeValue(query.q);

  const filtersCount = [level, type, searchText].filter(Boolean).length;
  const singleLevel = Boolean(level) && filtersCount === 1;
  const singleType = Boolean(type) && filtersCount === 1;
  const hasSearchText = Boolean(searchText);
  const hasAnyQueryFilter = filtersCount > 0;
  const canonicalPath = buildCanonicalPath(level, type, searchText);
  const isIndexable = !hasAnyQueryFilter || (!hasSearchText && (singleLevel || singleType));

  const title = singleLevel
    ? `DaZ Arbeitsblätter ${level}`
    : singleType
      ? `DaZ ${type} zum Ausdrucken`
      : 'DaZ Arbeitsblätter & Unterrichtsmaterial';

  const description = singleLevel
    ? `Druckfertige DaZ Arbeitsblätter auf Niveau ${level} für Erwachsene. Sofort im Unterricht einsetzbar.`
    : singleType
      ? `Druckfertige ${type} für DaZ-Kurse mit Erwachsenen. Direkt herunterladen und einsetzen.`
      : 'Druckfertige Arbeitsblätter, Dialoge, Lernkarten und Tabellen für DaZ-Kurse mit Erwachsenen.';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      // Index the core page plus single-facet landing pages; keep search or mixed filters out of the index.
      index: isIndexable,
      follow: true,
      googleBot: {
        index: isIndexable,
        follow: true,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'website',
      locale: 'de_CH',
      siteName: 'dazit',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string; type?: string }>;
}) {
  const [worksheets, currentUser, query] = await Promise.all([
    getWorksheetCards(),
    getCurrentDazitUser(),
    searchParams,
  ]);
  const level = decodeValue(query.level);
  const type = decodeValue(query.type);
  const searchText = decodeValue(query.q);
  const canonicalPath = buildCanonicalPath(level, type, searchText);
  const isAuthenticated = Boolean(currentUser);
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': absoluteDazitUrl('/documents#collection-page'),
      url: absoluteDazitUrl(canonicalPath),
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
      name: 'dazit Bibliothek',
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
      <SiteHeader active="library" canAdminister={Boolean(currentUser?.isAdmin)} search />
      <div className="subject-bar" aria-label="Themen">
        <strong>Themen</strong>
        {clusterLinks.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </div>
      <LibraryBrowser
        canAdminister={Boolean(currentUser?.isAdmin)}
        isAuthenticated={isAuthenticated}
        initialLevels={query.level ? [query.level] : []}
        initialQuery={query.q || ''}
        initialTypes={query.type ? [query.type] : []}
        worksheets={worksheets}
      />
    </>
  );
}
