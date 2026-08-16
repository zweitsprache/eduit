import type { Metadata } from 'next';
import Link from 'next/link';
import { Copy01, File02 } from '@untitledui/icons';
import { Baby, BookOpen, Brain, CloudSunRain, Cpu, HandHelping, HardHat, HeartPulse, House, ListCheck, MessagesSquare, Salad, Share2, ShoppingBasket, SquareSplitHorizontal, Stamp, TableCellsSplit, TramFront, UserSearch, UsersRound } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { WorksheetCard } from '@/components/worksheet-card';
import { CountUp } from '@/components/count-up';
import { getCurrentDazitUser } from '@/lib/auth/authorization';

function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12.268 2a2 2 0 003.465 2" />
      <path d="M14 5 L14 8" />
      <path d="M16 22v-3a2 2 0 00-4 0v3" />
      <path d="M21 13c-.662-1.497-1.666-2.753-2.9-3.63C16.825 8.47 15.422 8 14 8s-2.826.47-4.1 1.37C8.668 10.248 7.663 11.504 7 13z" />
      <path d="M3 9h4" />
      <path d="M7 22V6a5 5 0 00-2-4 5 5 0 00-2 4v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    </svg>
  );
}
import { getHomepageStats, getWorksheetCards } from '@/lib/worksheets';
import { SearchTrackingForm } from '@/components/search-tracking-form';
import { absoluteDazitUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DaZ Arbeitsblätter, Dialoge und Lernkarten',
  description: 'Arbeitsblätter, Merkblätter, Dialoge, Lernkarten sowie Verb- und Deklinationstabellen für DaZ-Kurse mit Erwachsenen.',
  alternates: { canonical: '/' },
};

const levels = [
  ['A1.1', 'home-level-blue-light'],
  ['A1.2', 'home-level-blue'],
  ['A2.1', 'home-level-green-light'],
  ['A2.2', 'home-level-green'],
  ['B1.1', 'home-level-orange-light'],
  ['B1.2', 'home-level-orange'],
] as const;

const topics = [
  'Deutschkurs',
  'Gesundheit',
  'Sicherheit und Notfälle',
  'Familie und Partnerschaft',
  'Kinder und Schule',
  'Soziales Netzwerk',
  'Beratung und Unterstützung',
  'Einkaufen',
  'Ernährung',
  'Wohnen',
  'Mobilität',
  'Finanzen und Versicherungen',
  'Behörden',
  'Freizeit und Hobbys',
  'Kultur und Identität',
  'Arbeit',
  'Arbeitssuche',
  'Umwelt und Klima',
  'Technologie',
  'Weiterbildung',
] as const;

export default async function HomePage() {
  const [homepageStats, newest, currentUser] = await Promise.all([
    getHomepageStats(),
    getWorksheetCards().then((worksheets) => worksheets.slice(0, 4)),
    getCurrentDazitUser(),
  ]);
  const isAuthenticated = Boolean(currentUser);
  const { total, levelCounts, typeCounts } = homepageStats;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': absoluteDazitUrl('/#website'),
      url: absoluteDazitUrl('/'),
      name: 'DaZit',
      inLanguage: 'de-CH',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteDazitUrl('/documents')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': absoluteDazitUrl('/#organization'),
      name: 'DaZit',
      url: absoluteDazitUrl('/'),
      email: 'daz@dazit.io',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': absoluteDazitUrl('/#collection-page'),
      url: absoluteDazitUrl('/'),
      name: 'DaZ Arbeitsblätter, Dialoge und Lernkarten',
      description: 'Druckfertige Materialien für DaZ-Kurse mit Erwachsenen.',
      inLanguage: 'de-CH',
      isPartOf: { '@id': absoluteDazitUrl('/#website') },
      about: ['DaZ', 'Arbeitsblätter', 'Lernkarten', 'Dialoge'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': absoluteDazitUrl('/#new-materials'),
      name: 'Diese Woche neu',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: newest.length,
      itemListElement: newest.map((worksheet, index) => ({
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
      <SiteHeader active="home" />
      <main className="home-page">
        <section className="home-hero">
          <span className="hero-beta-ribbon">Public Beta</span>
          <div className="home-hero-content">
            <span className="home-hero-badge">DaZ-Ressourcen von zweitsprache.ch</span>
            <h1>
              <CountUp value={total} /> Arbeits- und Merkblätter,<br />
              Spiele und Kartensets für<br />
              <em>DaZ-Kurse</em> mit Erwachsenen
            </h1>
            <SearchTrackingForm className="home-search">
              <label className="sr-only" htmlFor="home-search">Bibliothek durchsuchen</label>
              <input id="home-search" name="q" type="search" />
              <button type="submit">Suchen</button>
            </SearchTrackingForm>
          </div>
          <div aria-hidden="true" className="home-hero-preview">
            <span className="home-preview-sheet home-preview-sheet--back">
              <img alt="" src="/eduit-document%20(75).svg" />
            </span>
            <span className="home-preview-sheet home-preview-sheet--middle">
              <img alt="" src="/eduit-document%20-%202026-08-02T090904.120.svg" />
            </span>
            <span className="home-preview-sheet home-preview-sheet--front">
              <img alt="" src="/eduit-document%20-%202026-08-01T071645.177.svg" />
            </span>
          </div>
          <div className="home-hero-levels">
            {levels.map(([level, className]) => (
              <Link
                className={`home-level-card ${className}`}
                href={`/documents?level=${encodeURIComponent(level)}`}
                key={level}
              >
                <strong>{level}</strong>
                <small>{levelCounts[level] || 0} Dokumente</small>
              </Link>
            ))}
          </div>
        </section>

        <div className="home-content">
          <section className="home-section home-types">
            <div className="home-section-heading"><h2>Nach Typ</h2></div>
            <div className="home-type-grid">
              <Link className="home-type-card" href="/documents?type=Arbeitsblatt">
                <File02 aria-hidden="true" />
                <span><strong>Arbeits- und Merkblätter</strong><small>Grammatik und Wortschatz üben und nachschlagen</small><b>{typeCounts.Arbeitsblatt || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents?type=Verbtabelle">
                <TableCellsSplit aria-hidden="true" />
                <span><strong>Verbtabellen</strong><small>Konjugationen kompakt nachschlagen und trainieren</small><b>{typeCounts.Verbtabelle || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents?type=Domino">
                <SquareSplitHorizontal aria-hidden="true" />
                <span><strong>Dominos</strong><small>Wortschatz und Grammatik spielerisch festigen</small><b>{typeCounts.Domino || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents?type=Lernkarten">
                <Copy01 aria-hidden="true" />
                <span><strong>Lernkarten</strong><small>Wortschatz selbstständig und in Partnerarbeit trainieren</small><b>{typeCounts.Lernkarten || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents?type=Wechselspiel">
                <MessagesSquare aria-hidden="true" />
                <span><strong>Wechselspiele</strong><small>Informationen in Partnerarbeit erfragen und ergänzen</small><b>{typeCounts.Wechselspiel || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents?type=Dialog">
                <MessagesSquare aria-hidden="true" />
                <span><strong>Dialoge</strong><small>Gespräche lesen und nachspielen</small><b>{typeCounts.Dialog || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents?type=Leseverstehen">
                <ListCheck aria-hidden="true" />
                <span><strong>Leseverstehen</strong><small>Texte lesen und Verständnis überprüfen</small><b>{typeCounts.Leseverstehen || 0} Dokumente ›</b></span>
              </Link>
            </div>
          </section>

          <section className="home-section home-new">
            <div className="home-new-grid">
              {newest.map((worksheet) => (
                <WorksheetCard canDownload={isAuthenticated} key={worksheet.slug} worksheet={worksheet} />
              ))}
            </div>
            <Link className="home-new-mobile-link" href="/documents">Alle neuen Dokumente</Link>
          </section>

          <section className="home-section home-topics">
            <div className="home-topic-grid">
              {topics.map((topic, index) => (
                <div className="home-topic-card" key={topic}>
                  {topic === 'Deutschkurs'
                    ? <BookOpen aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                    : topic === 'Gesundheit'
                      ? <HeartPulse aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                      : topic === 'Sicherheit und Notfälle'
                        ? <HardHat aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                        : topic === 'Familie und Partnerschaft'
                          ? <UsersRound aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                          : topic === 'Kinder und Schule'
                            ? <Baby aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                            : topic === 'Soziales Netzwerk'
                              ? <Share2 aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                              : topic === 'Beratung und Unterstützung'
                                ? <HandHelping aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                : topic === 'Einkaufen'
                                  ? <ShoppingBasket aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                  : topic === 'Ernährung'
                                    ? <Salad aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                    : topic === 'Wohnen'
                                      ? <House aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                      : topic === 'Mobilität'
                                        ? <TramFront aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                        : topic === 'Behörden'
                                          ? <Stamp aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                          : topic === 'Arbeitssuche'
                                            ? <UserSearch aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                            : topic === 'Kultur und Identität'
                                              ? <MosqueIcon className="home-topic-icon" />
                                              : topic === 'Umwelt und Klima'
                                                ? <CloudSunRain aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                                : topic === 'Technologie'
                                                  ? <Cpu aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                                  : topic === 'Weiterbildung'
                                                    ? <Brain aria-hidden="true" className="home-topic-icon" strokeWidth={2} />
                                                    : <span aria-hidden="true" className="home-topic-icon-placeholder" />}
                  <strong>{topic}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
