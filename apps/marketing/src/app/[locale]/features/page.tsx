import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/site-shell';
import { content, isLocale } from '@/lib/content';

export const metadata: Metadata = { title: 'Features' };

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = content[locale];
  const intro = locale === 'de'
    ? ['Werkzeuge für guten Unterricht', 'Alles, was ein Arbeitsblatt braucht.', 'Von der ersten Aufgabe bis zum fertigen PDF bleibt der Arbeitsablauf klar, konsistent und schnell.']
    : ['Tools for better teaching', 'Everything a worksheet needs.', 'From the first activity to the finished PDF, the workflow stays clear, consistent, and fast.'];

  return (
    <>
      <PageIntro eyebrow={intro[0]} title={intro[1]} description={intro[2]} />
      <section className="feature-grid feature-grid--page">
        {copy.features.map(([title, description], index) => (
          <article className="feature-card feature-card--large" key={title}>
            <span className="feature-number">0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
            <div className={`feature-demo feature-demo--${index + 1}`} aria-hidden="true">
              <span /><span /><span />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
