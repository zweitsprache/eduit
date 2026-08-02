import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Lizenz- und Nutzungsrecht',
  description: 'Lizenz- und Nutzungsbedingungen für Materialien auf dazit.',
  alternates: { canonical: '/lizenz-und-nutzungsrecht' },
};

export default function LizenzPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <div className="legal-shell">
          <h1>Lizenz- und Nutzungsrecht</h1>
          <section>
            <h2><span className="legal-number">01</span>Geltungsbereich</h2>
            <p>
              Diese Bestimmungen regeln die Nutzung der auf dazit bereitgestellten Materialien, insbesondere
              Arbeitsblätter, Merkblätter, Lernkarten, Tabellen, Vorschauen und ergänzenden Inhalte.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">02</span>Urheberrecht und Eigentum</h2>
            <p>
              Sämtliche auf dazit veröffentlichten Inhalte bleiben geistiges Eigentum von DaZit | Marcel Allenspach
              beziehungsweise der jeweils bezeichneten Rechteinhaber. Mit dem Download oder der Nutzung wird kein
              Eigentumsrecht übertragen.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">03</span>Zulässige Nutzung</h2>
            <p>Die bereitgestellten Materialien dürfen im vereinbarten oder üblichen Rahmen insbesondere wie folgt genutzt werden:</p>
            <ul>
              <li>für den eigenen Unterricht und die persönliche Vorbereitung,</li>
              <li>für den Einsatz in DaZ-Kursen, Klassen und Lerngruppen,</li>
              <li>für Ausdrucke und Kopien innerhalb der eigenen Unterrichtsorganisation.</li>
            </ul>
          </section>
          <section>
            <h2><span className="legal-number">04</span>Nicht zulässige Nutzung</h2>
            <p>Ohne vorgängige schriftliche Zustimmung unzulässig sind insbesondere:</p>
            <ul>
              <li>die öffentliche Weiterverbreitung, der Weiterverkauf oder die Unterlizenzierung der Materialien,</li>
              <li>das Hochladen auf fremde Plattformen, Downloadportale oder geteilte Materialsammlungen,</li>
              <li>die Entfernung von Urhebervermerken oder Herkunftshinweisen,</li>
              <li>die Nutzung der Inhalte als Grundlage für ein eigenes kommerzielles Materialangebot.</li>
            </ul>
          </section>
          <section>
            <h2><span className="legal-number">05</span>Bearbeitungen</h2>
            <p>
              Inhaltliche oder gestalterische Anpassungen für den eigenen Unterricht sind nur im internen Gebrauch
              zulässig, sofern dadurch keine Rechte Dritter verletzt werden und keine erneute Veröffentlichung erfolgt.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">06</span>Verstösse</h2>
            <p>
              Bei Verstössen gegen diese Nutzungsbedingungen behalten wir uns vor, Zugänge einzuschränken, Inhalte zu
              sperren sowie rechtliche Schritte einzuleiten.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">07</span>Kontakt</h2>
            <p>
              Bei Fragen zu Lizenzen, erweiterten Nutzungsrechten oder institutionellen Freigaben erreichen Sie uns
              unter <a href="mailto:daz@dazit.io">daz@dazit.io</a>.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
