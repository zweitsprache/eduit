import type { Metadata } from 'next';
import Link from 'next/link';
import { Download01, Plus } from '@untitledui/icons';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { WorksheetCard } from '@/components/worksheet-card';
import { DocumentGallery } from '@/components/document-gallery';
import { getWorksheets, worksheetBySlug } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';
import { InlineMetadataEditor } from '@/components/inline-metadata-editor';
import { InlineHtmlEditor } from '@/components/inline-html-editor';
import { getCurrentDazitUser } from '@/lib/auth/authorization';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const worksheet = await worksheetBySlug((await params).slug);
  if (!worksheet) return {};
  const pathname = `/documents/${worksheet.slug}`;
  const image = worksheet.thumbnailUrls?.[0];
  return {
    title: worksheet.title,
    description: worksheet.description,
    alternates: { canonical: pathname },
    openGraph: {
      type: 'article',
      locale: 'de_CH',
      siteName: 'dazit',
      title: worksheet.title,
      description: worksheet.description,
      url: pathname,
      publishedTime: worksheet.publishedAt,
      images: image ? [{
        url: image,
        width: 1200,
        height: 675,
        alt: `Vorschau von ${worksheet.title}`,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: worksheet.title,
      description: worksheet.description,
      images: image ? [image] : [],
    },
    robots: { index: true, follow: true },
  };
}

export default async function WorksheetDetailPage({ params }: Props) {
  const worksheet = await worksheetBySlug((await params).slug);
  if (!worksheet) notFound();
  const currentUser = await getCurrentDazitUser();
  const canAdminister = Boolean(currentUser?.isAdmin);
  const allWorksheets = await getWorksheets();
  const related = allWorksheets
    .filter(({ slug, subject }) => slug !== worksheet.slug && subject === worksheet.subject)
    .slice(0, 4);
  const fallbackRelated = related.length >= 4
    ? related
    : [...related, ...allWorksheets.filter(({ slug }) => slug !== worksheet.slug && !related.some((item) => item.slug === slug))]
      .slice(0, 4);
  const familyMaterials = (worksheet.relationships || [])
    .map((relationship) => allWorksheets.find(
      ({ worksheetId }) => worksheetId === relationship.worksheetId,
    ))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const worksheetUrl = absoluteDazitUrl(`/documents/${worksheet.slug}`);
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      '@id': worksheetUrl,
      url: worksheetUrl,
      name: worksheet.title,
      description: worksheet.description,
      inLanguage: 'de-CH',
      learningResourceType: worksheet.documentType,
      educationalLevel: worksheet.level || undefined,
      isAccessibleForFree: true,
      datePublished: worksheet.publishedAt,
      keywords: worksheet.tags,
      thumbnailUrl: worksheet.thumbnailUrls?.[0]
        ? absoluteDazitUrl(worksheet.thumbnailUrls[0])
        : undefined,
      provider: {
        '@type': 'Organization',
        name: 'dazit',
        url: absoluteDazitUrl('/'),
      },
      isPartOf: worksheet.relationships?.length
        ? {
          '@type': 'Collection',
          name: 'Arbeitsblatt-Reihe',
          hasPart: [worksheet, ...familyMaterials].map((item) => ({
            '@type': 'LearningResource',
            '@id': absoluteDazitUrl(`/documents/${item.slug}`),
            name: item.title,
          })),
        }
        : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Bibliothek',
          item: absoluteDazitUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: worksheet.title,
          item: worksheetUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
        }}
        type="application/ld+json"
      />
      <SiteHeader active="library" />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Bibliothek</Link><span>›</span>
        <Link href="/">{worksheet.subject}</Link><span>›</span>
        <strong>{worksheet.title}</strong>
      </nav>
      <main>
        <section className="detail-hero">
          <div className="mobile-detail-title">
            <span className={`subject subject-${worksheet.color}`}>{worksheet.documentType}</span>
            <h1>{worksheet.title}</h1>
          </div>
          <div className="detail-column detail-media-column">
            <DocumentGallery
              color={worksheet.color}
              pages={worksheet.pages}
              thumbnailUrls={worksheet.thumbnailUrls}
            />
            <InlineHtmlEditor
              editable={canAdminister}
              field="descriptionHtml"
              heading="Beschreibung"
              html={worksheet.descriptionHtml || ''}
              worksheet={worksheet}
            />
          </div>
          <div className="detail-column detail-info-column">
            <div className="detail-copy">
              {canAdminister && <InlineMetadataEditor worksheet={worksheet} />}
              <div className="detail-flags">
                <span className={`subject subject-${worksheet.color}`}>{worksheet.documentType.toUpperCase()}</span>
                {worksheet.hasAnswerKey && <span className="answer-key">✓ Lösungsblatt enthalten</span>}
              </div>
              <h1>{worksheet.title}</h1>
              <p className="lead">{worksheet.description}</p>
              <div className="detail-actions">
                {worksheet.pdfUrl
                  ? (
                    <a className="download-primary" href={worksheet.pdfUrl} target="_blank" rel="noreferrer">
                      <Download01 /> PDF herunterladen
                    </a>
                  )
                  : <button className="download-primary"><Download01 /> PDF herunterladen</button>}
                <button><Plus /> Zur Sammlung</button>
              </div>
              <dl className="metadata-grid">
                <div><dt>Dokumenttyp</dt><dd>{worksheet.documentType}</dd></div>
                <div><dt>Niveau</dt><dd>{worksheet.level || '—'}</dd></div>
                <div><dt>Seiten</dt><dd>{worksheet.pages}</dd></div>
                <div><dt>Lösungsblatt</dt><dd>{worksheet.hasAnswerKey ? 'enthalten' : 'nicht enthalten'}</dd></div>
                <div><dt>Dateigrösse</dt><dd>{worksheet.size}</dd></div>
                <div><dt>Hinzugefügt</dt><dd>{worksheet.added}</dd></div>
                <div><dt>Downloads</dt><dd>{worksheet.downloads}</dd></div>
                <div><dt>Format</dt><dd>PDF · A4 druckfertig</dd></div>
                {Boolean(worksheet.actionCompetencies?.length) && (
                  <div>
                    <dt>Sprachhandlungskompetenz</dt>
                    <dd>{worksheet.actionCompetencies?.join(', ')}</dd>
                  </div>
                )}
                <div>
                  <dt>Sprachkompetenz</dt>
                  <dd>{worksheet.languageCompetencies?.join(', ') || '—'}</dd>
                </div>
                {worksheet.actionField && (
                  <div>
                    <dt>Handlungsfeld</dt>
                    <dd>{worksheet.actionField}</dd>
                  </div>
                )}
              </dl>
              <div className="detail-tags">
                {worksheet.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </div>
            <InlineHtmlEditor
              editable={canAdminister}
              field="actionCompetencyContributionHtml"
              heading="Beitrag zur Sprachhandlungskompetenz"
              html={worksheet.actionCompetencyContributionHtml || ''}
              worksheet={worksheet}
            />
          </div>
        </section>
        {familyMaterials.length > 0 && (
          <section className="related worksheet-family">
            <h2>Zugehörige Arbeitsblätter</h2>
            <div className="related-grid">
              {familyMaterials.map((item) => (
                <WorksheetCard key={item.slug} worksheet={item} />
              ))}
            </div>
          </section>
        )}
        <section className="related">
          <h2>Ähnliche Dokumente</h2>
          <div className="related-grid">
            {fallbackRelated.map((item) => <WorksheetCard key={item.slug} worksheet={item} />)}
          </div>
        </section>
      </main>
    </>
  );
}
