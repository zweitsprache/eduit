import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <nav aria-label="Dokumenttypen">
          <Link href="/documents">Arbeits- und Merkblätter</Link>
          <Link href="/documents?type=Verbtabelle">Verbtabellen</Link>
          <Link href="/documents?type=Deklinationstabelle">Deklinationstabellen</Link>
          <Link href="/documents?type=Lernkarten">Lernkarten</Link>
          <Link href="/documents?type=Dialog">Dialoge</Link>
          <Link href="/documents?type=Leseverstehen">Leseverstehen</Link>
        </nav>
        <nav aria-label="Sprachniveaus">
          {['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'].map((level) => (
            <Link href={`/documents?level=${encodeURIComponent(level)}`} key={level}>{level}</Link>
          ))}
        </nav>
        <nav aria-label="Rechtliches">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutzerklaerung">Datenschutzerklärung</Link>
          <Link href="/lizenz-und-nutzungsrecht">Lizenz- und Nutzungsrecht</Link>
        </nav>
        <address>
          <strong>DaZit | Marcel Allenspach</strong>
          <span>Albisstrasse 32a</span>
          <span>CH-8134 Adliswil</span>
          <a href="tel:+41447092000">+41 44 709 20 00</a>
          <a href="mailto:daz@dazit.io">daz@dazit.io</a>
        </address>
      </div>
    </footer>
  );
}
