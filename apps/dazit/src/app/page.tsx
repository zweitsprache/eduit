import type { Metadata } from 'next';
import Link from 'next/link';
import { Copy01, File02, Grid01 } from '@untitledui/icons';
import { SiteHeader } from '@/components/site-header';
import { WorksheetCard } from '@/components/worksheet-card';
import { CountUp } from '@/components/count-up';
import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { getHomepageStats, getWorksheetCards } from '@/lib/worksheets';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Materialien für DaZ-Kurse',
  description: 'Arbeits- und Merkblätter, Verbtabellen und weitere druckfertige Materialien für DaZ-Kurse mit Erwachsenen.',
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

export default async function HomePage() {
  const [homepageStats, newest, currentUser] = await Promise.all([
    getHomepageStats(),
    getWorksheetCards().then((worksheets) => worksheets.slice(0, 4)),
    getCurrentDazitUser(),
  ]);
  const { total, levelCounts, typeCounts } = homepageStats;
  return (
    <>
      <SiteHeader active="home" canAdminister={Boolean(currentUser?.isAdmin)} />
      <main className="home-page">
        <section className="home-hero">
          <span className="hero-beta-ribbon">Public Beta</span>
          <div className="home-hero-content">
            <span className="home-hero-badge">Deutsch als Zweitsprache noch einfacher machen</span>
            <h1>
              <CountUp value={total} /> Arbeits- und Merkblätter,<br />
              Spiele und Kartensets für<br />
              <em>DaZ-Kurse</em> mit Erwachsenen
            </h1>
            <form action="/documents" className="home-search" method="get">
              <label className="sr-only" htmlFor="home-search">Bibliothek durchsuchen</label>
              <input id="home-search" name="q" type="search" />
              <button type="submit">Suchen</button>
            </form>
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
              <Link className="home-type-card" href="/documents">
                <File02 aria-hidden="true" />
                <span><strong>Arbeits- und Merkblätter</strong><small>Übungsseiten und Übersichten für den DaZ-Kurs</small><b>{(typeCounts.Arbeitsblatt || 0) + (typeCounts.Merkblatt || 0)} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents">
                <Grid01 aria-hidden="true" />
                <span><strong>Verbtabellen</strong><small>Konjugationen kompakt und übersichtlich darstellen</small><b>{typeCounts.Verbtabelle || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents">
                <Copy01 aria-hidden="true" />
                <span><strong>Deklinationstabellen</strong><small>Formen und Strukturen zum Nachschlagen und Üben</small><b>{typeCounts.Deklinationstabelle || 0} Dokumente ›</b></span>
              </Link>
              <Link className="home-type-card" href="/documents?type=Lernkarten">
                <Copy01 aria-hidden="true" />
                <span><strong>Lernkarten</strong><small>Karten zum Ausschneiden und beidseitigen Drucken</small><b>{typeCounts.Lernkarten || 0} Dokumente ›</b></span>
              </Link>
            </div>
          </section>

          <section className="home-section home-new">
            <div className="home-section-heading">
              <h2>Diese Woche neu</h2>
              <Link href="/documents">Alle neuen Dokumente ›</Link>
            </div>
            <div className="home-new-grid">
              {newest.map((worksheet) => (
                <WorksheetCard key={worksheet.slug} worksheet={worksheet} />
              ))}
            </div>
            <Link className="home-new-mobile-link" href="/documents">Alle neuen Dokumente</Link>
          </section>
        </div>
      </main>
    </>
  );
}
