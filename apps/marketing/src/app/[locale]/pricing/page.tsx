import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@eduit/ui';
import { PageIntro } from '@/components/site-shell';
import { content, isLocale } from '@/lib/content';

export const metadata: Metadata = { title: 'Pricing' };
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.domain.com';

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = content[locale];

  return (
    <>
      <PageIntro
        eyebrow={copy.pricing.kicker}
        title={copy.pricing.title}
        description={locale === 'de' ? 'Transparent, flexibel und jederzeit erweiterbar.' : 'Transparent, flexible, and ready to grow.'}
      />
      <section className="pricing-grid">
        {copy.pricing.plans.map(([name, description, price, features, cta], index) => (
          <article className={`price-card ${index === 1 ? 'price-card--featured' : ''}`} key={name}>
            {index === 1 && <span className="popular">{locale === 'de' ? 'Am beliebtesten' : 'Most popular'}</span>}
            <p className="plan-name">{name}</p>
            <h2>{price}</h2>
            <p>{description}</p>
            <ul>{features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <ButtonLink tone={index === 1 ? 'primary' : 'secondary'} href={`${appUrl}/auth/sign-up`}>{cta}</ButtonLink>
          </article>
        ))}
      </section>
    </>
  );
}
