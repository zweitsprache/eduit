import { ButtonLink } from '@eduit/ui';
import { content, isLocale } from '@/lib/content';
import { notFound } from 'next/navigation';
import { HeroSlideshow } from '@/components/hero-slideshow';
import { FileCheck02, LayoutAlt01, Palette } from '@untitledui/icons';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.domain.com';
const proofIcons = [LayoutAlt01, Palette, FileCheck02];

function StorySkeleton({ variant }: { variant: number }) {
  return (
    <div className={`why-placeholder why-placeholder--${variant}`} aria-hidden="true">
      <div className="why-placeholder-bar">
        <span /><span /><span />
        <i />
      </div>
      <div className="why-placeholder-body">
        <aside>
          <span className="active" /><span /><span /><span />
        </aside>
        <div className="why-placeholder-page">
          <span className="wide" />
          <span className="medium" />
          <div className="why-placeholder-block">
            <i /><i /><i />
          </div>
          <span className="short" />
        </div>
      </div>
    </div>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = content[locale];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1>{copy.hero.title}</h1>
          <p className="hero-description">{copy.hero.description}</p>
          <div className="hero-actions">
            <ButtonLink href={`${appUrl}/auth/sign-up`}>{copy.hero.primary}</ButtonLink>
            <ButtonLink tone="secondary" href={`/${locale}/features`}>{copy.hero.secondary}</ButtonLink>
          </div>
          <p className="hero-note">{copy.hero.note}</p>
        </div>

        <div className="worksheet-stage">
          <div className="editor-chrome">
            <span className="dot" /><span className="dot" /><span className="dot" />
            <span className="toolbar-skeleton" />
            <span className="toolbar-skeleton toolbar-skeleton--short" />
          </div>
          <div className="worksheet">
            <HeroSlideshow />
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Benefits">
        {copy.proof.map(([title, description], index) => {
          const Icon = proofIcons[index];
          return (
            <article key={title}>
              <Icon className="proof-icon" aria-hidden="true" />
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </article>
          );
        })}
      </section>

      {[copy.problem, ...copy.stories].map((story, index) => (
        <section
          className={`why-section ${index === 1 ? 'why-section--reversed' : ''}`}
          id={index === 0 ? 'why' : undefined}
          key={story.title}
        >
          <div className="why-copy">
            <p className="eyebrow">{story.kicker}</p>
            <h2>{story.title}</h2>
            <p>{story.description}</p>
          </div>
          <StorySkeleton variant={index + 1} />
        </section>
      ))}

      <section className="final-cta">
        <div>
          <h2>{copy.final.title}</h2>
          <p>{copy.final.description}</p>
        </div>
        <ButtonLink href={`${appUrl}/auth/sign-up`}>{copy.final.cta}</ButtonLink>
      </section>
    </>
  );
}
