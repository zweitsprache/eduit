import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/site-shell';
import { content, isLocale, locales } from '@/lib/content';
import '@eduit/brand/tokens.css';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = content[locale];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://domain.com';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: locale === 'de'
        ? 'Eduit – Arbeitsblätter einfach erstellen'
        : 'Eduit – Create better worksheets',
      template: '%s | Eduit',
    },
    description: copy.hero.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { de: '/de', en: '/en' },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'de' ? 'de_CH' : 'en_GB',
      title: copy.hero.title,
      description: copy.hero.description,
      siteName: 'Eduit',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: copy.hero.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.hero.title,
      description: copy.hero.description,
      images: ['/og.png'],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body>
        <div className="site-frame">
          <Header locale={locale} />
          <main>{children}</main>
          <Footer locale={locale} />
        </div>
      </body>
    </html>
  );
}
