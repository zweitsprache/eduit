import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/site-shell';
import { isLocale } from '@/lib/content';

export const metadata: Metadata = { title: 'Imprint' };

export default async function ImprintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const de = locale === 'de';
  return (
    <>
      <PageIntro
        eyebrow={de ? 'Rechtliches' : 'Legal'}
        title={de ? 'Impressum' : 'Imprint'}
        description={de ? 'Angaben zum Anbieter dieser Website.' : 'Information about the provider of this website.'}
      />
      <article className="legal-copy">
        <h2>Eduit</h2>
        <p>{de ? 'Unternehmensname, Rechtsform und Anschrift werden vor dem öffentlichen Launch ergänzt.' : 'Company name, legal form, and address will be added before public launch.'}</p>
        <h2>{de ? 'Kontakt' : 'Contact'}</h2>
        <p>hello@domain.com</p>
      </article>
    </>
  );
}
