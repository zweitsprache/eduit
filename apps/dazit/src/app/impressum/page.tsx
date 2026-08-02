import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum von dazit mit Anbieterangaben für die Schweiz.',
  alternates: { canonical: '/impressum' },
};

export default function ImpressumPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <div className="legal-shell">
          <h1>Impressum</h1>
          <section>
            <h2><span className="legal-number">01</span>Anbieter</h2>
            <p>
              DaZit
              <br />
              Marcel Allenspach
              <br />
              Albisstrasse 32a
              <br />
              CH-8134 Adliswil
              <br />
              Schweiz
            </p>
          </section>
          <section>
            <h2><span className="legal-number">02</span>Kontakt</h2>
            <p>
              Telefon: <a href="tel:+41447092000">+41 44 709 20 00</a>
              <br />
              E-Mail: <a href="mailto:daz@dazit.io">daz@dazit.io</a>
            </p>
          </section>
          <section>
            <h2><span className="legal-number">03</span>Verantwortlich für den Inhalt</h2>
            <p>
              Marcel Allenspach
              <br />
              Albisstrasse 32a
              <br />
              CH-8134 Adliswil
              <br />
              Schweiz
            </p>
          </section>
          <section>
            <h2><span className="legal-number">04</span>Haftungsausschluss</h2>
            <p>
              Die Inhalte dieser Website werden mit der gebotenen Sorgfalt erstellt und gepflegt. Dennoch wird keine
              Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte übernommen.
            </p>
            <p>
              Haftungsansprüche gegen den Anbieter wegen materieller oder immaterieller Schäden, die aus dem Zugriff
              oder der Nutzung beziehungsweise Nichtnutzung der veröffentlichten Informationen entstehen, sind im
              gesetzlich zulässigen Rahmen ausgeschlossen.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">05</span>Urheberrechte</h2>
            <p>
              Sämtliche Inhalte, Materialien, Texte, Gestaltungen, Bilder, Vorschauen und Dokumente auf dieser Website
              unterliegen, soweit nicht anders gekennzeichnet, dem Urheberrecht und anderen Schutzrechten des Anbieters
              oder der jeweils genannten Rechteinhaber.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
