import { SearchLg } from '@untitledui/icons';
import { LibraryBrowser } from '@/components/library-browser';
import { SiteHeader } from '@/components/site-header';
import { getWorksheetCards } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';
import { getCurrentDazitUser } from '@/lib/auth/authorization';

const topics = [
  'Zahlen',
  'Uhrzeiten',
  'Trennbare Verben',
  'weil-Satz',
  'dass-Satz',
  'Relativsatz',
  'Adjektivdeklination',
  'zweiteilige Konjunktionen',
];

export const revalidate = 300;

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
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'dazit Bibliothek',
    numberOfItems: worksheets.length,
    itemListElement: worksheets.slice(0, 24).map((worksheet, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteDazitUrl(`/documents/${worksheet.slug}`),
      name: worksheet.title,
    })),
  };
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
        }}
        type="application/ld+json"
      />
      <SiteHeader active="library" canAdminister={Boolean(currentUser?.isAdmin)} search />
      <div className="mobile-search">
        <SearchLg aria-hidden="true" />
        <input placeholder="Titel oder Stichwort suchen …" aria-label="Bibliothek durchsuchen" />
      </div>
      <div className="subject-bar" aria-label="Themen">
        {topics.map((topic) => <button key={topic}>{topic}</button>)}
      </div>
      <LibraryBrowser
        canAdminister={Boolean(currentUser?.isAdmin)}
        initialLevels={query.level ? [query.level] : []}
        initialQuery={query.q || ''}
        initialTypes={query.type ? [query.type] : []}
        worksheets={worksheets}
      />
    </>
  );
}
