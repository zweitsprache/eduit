import type { Metadata } from 'next';
import Link from 'next/link';
import { Copy01, File02, Grid01 } from '@untitledui/icons';
import { SiteHeader } from '@/components/site-header';
import { WorksheetCard } from '@/components/worksheet-card';
import { getWorksheets } from '@/lib/worksheets';

export const dynamic = 'force-dynamic';

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
  const worksheets = await getWorksheets();
  const levelCounts = worksheets.reduce<Record<string, number>>((counts, worksheet) => {
    if (worksheet.level) counts[worksheet.level] = (counts[worksheet.level] || 0) + 1;
    return counts;
  }, {});
  const typeCounts = worksheets.reduce<Record<string, number>>((counts, worksheet) => {
    counts[worksheet.documentType] = (counts[worksheet.documentType] || 0) + 1;
    return counts;
  }, {});
  const newest = worksheets.slice(0, 4);
  const previewWorksheets = worksheets.filter(
    ({ thumbnailUrls }) => Boolean(thumbnailUrls?.[0]),
  );
  const heroWorksheets = [...previewWorksheets]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const languageCount = new Set(worksheets.map(({ language }) => language)).size;

  return (
    <>
      <SiteHeader active="home" />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-content">
            <h1>
              Arbeits- und Merkblätter,<br />
              Spiele und Kartensets für<br />
              <em>DaZ-Kurse</em>
            </h1>
            <form action="/documents" className="home-search" method="get">
              <label className="sr-only" htmlFor="home-search">Bibliothek durchsuchen</label>
              <input id="home-search" name="q" type="search" />
              <button type="submit">Suchen</button>
            </form>
            <p>{worksheets.length} druckfertige PDFs · 6 Niveaus · {languageCount} {languageCount === 1 ? 'Sprache' : 'Sprachen'}</p>
          </div>
          <div aria-hidden="true" className="home-hero-preview">
            <span className="home-preview-sheet home-preview-sheet--back">
              {heroWorksheets[2]?.thumbnailUrls?.[0] && (
                <img alt="" src={heroWorksheets[2].thumbnailUrls[0]} />
              )}
            </span>
            <span className="home-preview-sheet home-preview-sheet--middle">
              {heroWorksheets[1]?.thumbnailUrls?.[0] && (
                <img alt="" src={heroWorksheets[1].thumbnailUrls[0]} />
              )}
            </span>
            <div className="home-preview-sheet home-preview-sheet--front">
              {heroWorksheets[0]?.thumbnailUrls?.[0]
                ? <img alt="" src={heroWorksheets[0].thumbnailUrls[0]} />
                : (
                  <span className="home-preview-placeholder">
                    <File02 />
                    <small>16:9 Vorschau</small>
                  </span>
                )}
            </div>
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
          <section className="home-section">
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
              <h2>Neu diese Woche</h2>
              <Link href="/documents">Alle neuen Dokumente ›</Link>
            </div>
            <div className="home-new-grid">
              {newest.map((worksheet) => (
                <WorksheetCard compact key={worksheet.slug} worksheet={worksheet} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
