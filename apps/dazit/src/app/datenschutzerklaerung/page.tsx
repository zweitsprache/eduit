import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung von dazit für Nutzerinnen und Nutzer in der Schweiz.',
  alternates: { canonical: '/datenschutzerklaerung' },
};

export default function DatenschutzPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <div className="legal-shell">
          <h1>Datenschutzerklärung</h1>
          <section>
            <h2><span className="legal-number">01</span>Allgemeines</h2>
            <p>
              Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. In dieser Datenschutzerklärung erläutern wir,
              welche Daten wir im Zusammenhang mit der Nutzung von dazit bearbeiten, zu welchen Zwecken dies geschieht
              und welche Rechte Sie nach anwendbarem Datenschutzrecht haben.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">02</span>Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenbearbeitung ist:
              <br />
              DaZit | Marcel Allenspach
              <br />
              Albisstrasse 32a
              <br />
              CH-8134 Adliswil
              <br />
              Schweiz
              <br />
              E-Mail: <a href="mailto:daz@dazit.io">daz@dazit.io</a>
              <br />
              Telefon: <a href="tel:+41447092000">+41 44 709 20 00</a>
            </p>
          </section>
          <section>
            <h2><span className="legal-number">03</span>Welche Daten wir bearbeiten</h2>
            <p>Beim Besuch und bei der Nutzung von dazit können insbesondere folgende Daten bearbeitet werden:</p>
            <ul>
              <li>technische Nutzungsdaten wie IP-Adresse, Datum, Uhrzeit, Gerätetyp, Browser und Zugriffe,</li>
              <li>Kontaktdaten, wenn Sie mit uns per E-Mail oder auf anderem Weg Kontakt aufnehmen,</li>
              <li>Kontodaten, sofern ein geschützter Administrationszugang genutzt wird,</li>
              <li>Nutzungsdaten im Zusammenhang mit Downloads, Seitenaufrufen und internen Analysezwecken.</li>
            </ul>
          </section>
          <section>
            <h2><span className="legal-number">04</span>Zwecke der Datenbearbeitung</h2>
            <p>Wir bearbeiten personenbezogene Daten insbesondere zu folgenden Zwecken:</p>
            <ul>
              <li>zur Bereitstellung, Sicherheit und technischen Optimierung der Website,</li>
              <li>zur Bearbeitung von Anfragen und zur Kommunikation mit Nutzerinnen und Nutzern,</li>
              <li>zur Verwaltung geschützter Bereiche und Administrationsfunktionen,</li>
              <li>zur internen Auswertung der Nutzung unseres Angebots und zur Weiterentwicklung der Plattform.</li>
            </ul>
          </section>
          <section>
            <h2><span className="legal-number">05</span>Weitergabe an Dritte</h2>
            <p>
              Wir können Daten an sorgfältig ausgewählte Dienstleister weitergeben, soweit dies für den Betrieb von
              dazit erforderlich ist, etwa für Hosting, Authentifizierung, Datenbankbetrieb, Dateispeicherung oder
              technische Zustellung. Diese Empfänger bearbeiten Daten nur im erforderlichen Umfang und nach unseren
              Vorgaben oder in eigener datenschutzrechtlicher Verantwortung.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">06</span>Speicherung und Aufbewahrung</h2>
            <p>
              Personenbezogene Daten werden nur so lange aufbewahrt, wie dies für die genannten Zwecke erforderlich ist
              oder gesetzliche Aufbewahrungspflichten bestehen.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">07</span>Ihre Rechte</h2>
            <p>
              Im Rahmen des anwendbaren Rechts haben Sie insbesondere das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Bearbeitung sowie auf Widerspruch gegen bestimmte Bearbeitungen. Sie können sich dafür
              jederzeit an <a href="mailto:daz@dazit.io">daz@dazit.io</a> wenden.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">08</span>Datensicherheit</h2>
            <p>
              Wir treffen angemessene technische und organisatorische Massnahmen, um personenbezogene Daten vor
              unberechtigtem Zugriff, Verlust, Missbrauch oder Veränderung zu schützen.
            </p>
          </section>
          <section>
            <h2><span className="legal-number">09</span>Änderungen</h2>
            <p>
              Diese Datenschutzerklärung kann bei Bedarf angepasst werden, insbesondere wenn sich unser Angebot,
              gesetzliche Vorgaben oder eingesetzte Dienste ändern.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
