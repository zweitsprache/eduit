import { EduitLogo, ButtonLink } from '@eduit/ui';
import { content, type Locale } from '@/lib/content';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.domain.com';

export function Header({ locale }: { locale: Locale }) {
  const copy = content[locale];
  const alternate = locale === 'de' ? 'en' : 'de';

  return (
    <header className="site-header">
      <a href={`/${locale}`} aria-label="Eduit home">
        <EduitLogo className="logo" />
      </a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href={`/${locale}/features`}>{copy.nav.features}</a>
        <a href={`/${locale}/pricing`}>{copy.nav.pricing}</a>
        <a href={`/${locale}#why`}>{copy.nav.story}</a>
      </nav>
      <div className="header-actions">
        <a className="language-link" href={`/${alternate}`} hrefLang={alternate}>
          {copy.otherLocale}
        </a>
        <a className="login-link" href={`${appUrl}/auth/sign-in`}>{copy.nav.login}</a>
        <ButtonLink href={`${appUrl}/auth/sign-up`}>{copy.nav.cta}</ButtonLink>
      </div>
    </header>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const copy = content[locale];
  return (
    <footer className="site-footer">
      <div>
        <EduitLogo className="footer-logo" />
        <p>© {new Date().getFullYear()} Eduit. {copy.footer.rights}</p>
      </div>
      <div className="footer-links">
        <a href={`/${locale}/features`}>{copy.footer.product}</a>
        <a href={`/${locale}#why`}>{copy.footer.company}</a>
        <a href={`/${locale}/privacy`}>{copy.footer.privacy}</a>
        <a href={`/${locale}/imprint`}>{copy.footer.imprint}</a>
      </div>
    </footer>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
