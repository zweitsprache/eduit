import type { Metadata } from 'next';
import Link from 'next/link';
import { Download01, Plus } from '@untitledui/icons';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { WorksheetCard } from '@/components/worksheet-card';
import { DocumentGallery } from '@/components/document-gallery';
import { getFamilyWorksheetCards, getRelatedWorksheetCards, getWorksheetCards, worksheetBySlug } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';
import { InlineMetadataEditor } from '@/components/inline-metadata-editor';
import { InlineHtmlEditor } from '@/components/inline-html-editor';
import { DownloadAuthGate } from '@/components/download-auth-gate';
import { AdminOnly } from '@/components/admin-only';
import { GRAMMAR_TAG_LABEL_BY_ID } from '@/lib/grammar-tags';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 86400;

export async function generateStaticParams() {
  const worksheets = await getWorksheetCards();
  return worksheets.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const worksheet = await worksheetBySlug((await params).slug);
  if (!worksheet) return {};
  const pathname = `/documents/${worksheet.slug}`;
  const image = worksheet.thumbnailUrls?.[0];
  const snippet = (worksheet.searchSnippet || worksheet.description || '').trim();
  const detailTitle = `${worksheet.title} | ${worksheet.documentType}${worksheet.level ? ` ${worksheet.level}` : ''}`;
  const detailDescription = snippet
    || `${worksheet.documentType}${worksheet.level ? ` für ${worksheet.level}` : ''} zum direkten Einsatz im DaZ-Unterricht.`;
  return {
    title: detailTitle,
    description: detailDescription,
    alternates: { canonical: pathname },
    openGraph: {
      type: 'article',
      locale: 'de_CH',
      siteName: 'DaZit',
      title: detailTitle,
      description: detailDescription,
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
      title: detailTitle,
      description: detailDescription,
      images: image ? [image] : [],
    },
    robots: { index: true, follow: true },
  };
}

function translateLanguage(value?: string) {
  if (!value) return '';
  if (value === 'German') return 'Deutsch';
  if (value === 'French') return 'Französisch';
  if (value === 'Italian') return 'Italienisch';
  if (value === 'English') return 'Englisch';
  return value;
}

function translateAgeGroup(value?: string) {
  if (!value) return '';
  if (value === 'children') return 'Kinder';
  if (value === 'youth') return 'Jugendliche';
  if (value === 'adults') return 'Erwachsene';
  if (value === 'seniors') return 'Senioren';
  return value;
}

function translateLearnerStage(value?: string) {
  if (!value) return '';
  const translations: Record<string, string> = {
    'early-childhood': 'Frühförderung',
    primary: 'Primarschule',
    'lower-secondary': 'Sekundarstufe I',
    'upper-secondary': 'Sekundarstufe II',
    vocational: 'Berufsbildung',
    'higher-education': 'Hochschule',
    'adult-education': 'Erwachsenenbildung',
    'professional-training': 'Weiterbildung',
    mixed: 'Gemischte Altersgruppen',
    'not-education-specific': 'Nicht bildungsspezifisch',
  };
  return translations[value] || value;
}

function grammarTagLabel(id: string) {
  return GRAMMAR_TAG_LABEL_BY_ID.get(id) || id;
}

export default async function WorksheetDetailPage({ params }: Props) {
  const worksheet = await worksheetBySlug((await params).slug);
  if (!worksheet) notFound();
  const snippet = (worksheet.searchSnippet || worksheet.description || '').trim();
  const detailTitle = `${worksheet.title} | ${worksheet.documentType}${worksheet.level ? ` ${worksheet.level}` : ''}`;
  const detailDescription = snippet
    || `${worksheet.documentType}${worksheet.level ? ` für ${worksheet.level}` : ''} zum direkten Einsatz im DaZ-Unterricht.`;
  const [familyMaterials, relatedMaterials] = await Promise.all([
    worksheet.worksheetId ? getFamilyWorksheetCards(worksheet.worksheetId) : Promise.resolve([]),
    getRelatedWorksheetCards(worksheet.slug, worksheet.level, worksheet.documentType, 4),
  ]);
  const worksheetUrl = absoluteDazitUrl(`/documents/${worksheet.slug}`);
  const snippetUrl = worksheetUrl.replace(/^https?:\/\//, '');
  const webpageId = `${worksheetUrl}#webpage`;
  const resourceId = `${worksheetUrl}#learning-resource`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': webpageId,
      url: worksheetUrl,
      name: worksheet.title,
      description: detailDescription,
      inLanguage: 'de-CH',
      breadcrumb: { '@id': `${worksheetUrl}#breadcrumb` },
      primaryImageOfPage: worksheet.thumbnailUrls?.[0]
        ? {
          '@type': 'ImageObject',
          url: absoluteDazitUrl(worksheet.thumbnailUrls[0]),
        }
        : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': ['LearningResource', 'CreativeWork'],
      '@id': resourceId,
      url: worksheetUrl,
      name: worksheet.title,
      description: detailDescription,
      inLanguage: 'de-CH',
      learningResourceType: worksheet.documentType,
      educationalLevel: worksheet.level || undefined,
      isAccessibleForFree: true,
      mainEntityOfPage: { '@id': webpageId },
      datePublished: worksheet.publishedAt,
      dateModified: worksheet.publishedAt,
      keywords: worksheet.tags,
      thumbnailUrl: worksheet.thumbnailUrls?.[0]
        ? absoluteDazitUrl(worksheet.thumbnailUrls[0])
        : undefined,
      provider: {
        '@type': 'Organization',
        name: 'DaZit',
        url: absoluteDazitUrl('/'),
      },
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
      },
      isPartOf: familyMaterials.length > 0
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
      '@id': `${worksheetUrl}#breadcrumb`,
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
              editable
              field="descriptionHtml"
              heading="Beschreibung"
              html={worksheet.descriptionHtml || ''}
              worksheet={worksheet}
            />
          </div>
          <div className="detail-column detail-info-column">
            <div className="detail-copy">
              <InlineMetadataEditor worksheet={worksheet} />
              <AdminOnly>
                <section className="snippet-preview" aria-label="Snippet-Vorschau">
                  <span className="snippet-preview-url">{snippetUrl}</span>
                  <strong>{detailTitle}</strong>
                  <p>{detailDescription}</p>
                </section>
              </AdminOnly>
              <div className="detail-flags">
                <span className={`subject subject-${worksheet.color}`}>{worksheet.documentType.toUpperCase()}</span>
                {worksheet.hasAnswerKey && <span className="answer-key">✓ Lösungsblatt enthalten</span>}
              </div>
              <h1>{worksheet.title}</h1>
              <p className="lead">{worksheet.description}</p>
              <div className="detail-actions">
                <DownloadAuthGate
                  className="download-primary"
                  downloadUrl={worksheet.pdfUrl}
                >
                  <Download01 /> {worksheet.documentType}
                </DownloadAuthGate>
                {worksheet.hasAnswerKey && (
                  <DownloadAuthGate
                    className="download-primary"
                    dataVariant="answer-key"
                    downloadUrl={worksheet.answerKeyPdfUrl}
                  >
                    <Download01 /> Lösungsblatt
                  </DownloadAuthGate>
                )}
                <AdminOnly>
                  <button><Plus /> Zur Sammlung</button>
                </AdminOnly>
              </div>
              <dl className="metadata-grid">
                <div><dt>Dokumenttyp</dt><dd>{worksheet.documentType}</dd></div>
                {worksheet.level && <div><dt>Niveau</dt><dd>{worksheet.level}</dd></div>}
                {worksheet.language && <div><dt>Inhaltssprache</dt><dd>{translateLanguage(worksheet.language)}</dd></div>}
                {worksheet.learnerStage && <div><dt>Bildungsstufe</dt><dd>{translateLearnerStage(worksheet.learnerStage)}</dd></div>}
                {Boolean(worksheet.ageGroups?.length) && (
                  <div>
                    <dt>Altersgruppe</dt>
                    <dd>{worksheet.ageGroups?.map((ageGroup) => translateAgeGroup(ageGroup)).join(', ')}</dd>
                  </div>
                )}
                <div><dt>Seiten</dt><dd>{worksheet.pages}</dd></div>
                <div><dt>Lösungsblatt</dt><dd>{worksheet.hasAnswerKey ? 'enthalten' : 'nicht enthalten'}</dd></div>
                <div><dt>Dateigrösse</dt><dd>{worksheet.size}</dd></div>
                <div><dt>Hinzugefügt</dt><dd>{worksheet.added}</dd></div>
                <div><dt>Downloads</dt><dd>{worksheet.downloads}</dd></div>
                {worksheet.format && <div><dt>Format</dt><dd>{worksheet.format}</dd></div>}
                {Boolean(worksheet.actionCompetencies?.length) && (
                  <div className="metadata-grid-wide">
                    <dt>Sprachhandlungskompetenz</dt>
                    <dd>{worksheet.actionCompetencies?.join(', ')}</dd>
                  </div>
                )}
                {Boolean(worksheet.languageCompetencies?.length) && (
                  <div className="metadata-grid-wide">
                    <dt>Sprachkompetenz</dt>
                    <dd>{worksheet.languageCompetencies?.join(', ')}</dd>
                  </div>
                )}
                {Boolean(worksheet.grammarTags?.length) && (
                  <div className="metadata-grid-wide">
                    <dt>Grammatik</dt>
                    <dd className="grammar-tags-list">
                      {worksheet.grammarTags?.map((grammarTag) => (
                        <span
                          className="grammar-tag-chip"
                          key={grammarTag}
                          title={grammarTag}
                        >
                          {grammarTagLabel(grammarTag)}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {worksheet.actionField && (
                  <div className="metadata-grid-wide">
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
              editable
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
            {relatedMaterials.map((item) => <WorksheetCard key={item.slug} worksheet={item} />)}
          </div>
        </section>
      </main>
    </>
  );
}
