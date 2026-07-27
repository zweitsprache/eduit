import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/site-shell';
import { isLocale } from '@/lib/content';

export const metadata: Metadata = { title: 'Privacy' };

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const de = locale === 'de';
  return (
    <>
      <PageIntro
        eyebrow={de ? 'Rechtliches' : 'Legal'}
        title={de ? 'Datenschutz' : 'Privacy'}
        description={de ? 'Wie Eduit mit personenbezogenen Daten umgeht.' : 'How Eduit handles personal data.'}
      />
      <article className="legal-copy">
        <h2>{de ? 'Verantwortliche Stelle' : 'Data controller'}</h2>
        <p>{de ? 'Die vollständigen Unternehmens- und Kontaktdaten werden vor dem öffentlichen Launch ergänzt.' : 'Complete company and contact details will be added before public launch.'}</p>
        <h2>{de ? 'Verarbeitete Daten' : 'Data we process'}</h2>
        <p>{de ? 'Wir verarbeiten nur Daten, die für Anmeldung, Betrieb, Abrechnung und Verbesserung des Dienstes erforderlich sind.' : 'We only process data required for authentication, service operation, billing, and product improvement.'}</p>
        <h2>{de ? 'Deine Rechte' : 'Your rights'}</h2>
        <p>{de ? 'Du kannst Auskunft, Berichtigung oder Löschung deiner personenbezogenen Daten verlangen.' : 'You may request access, correction, or deletion of your personal data.'}</p>
      </article>
    </>
  );
}
