import type { MetadataRoute } from 'next';
import { getWorksheets } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';
import { LEVELS, TYPES } from '@/lib/seo-taxonomy';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const worksheets = await getWorksheets();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteDazitUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteDazitUrl('/documents'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    ...LEVELS.map((level) => ({
      url: absoluteDazitUrl(`/niveau/${encodeURIComponent(level)}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    ...TYPES.map((type) => ({
      url: absoluteDazitUrl(`/typ/${encodeURIComponent(type.slug)}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    {
      url: absoluteDazitUrl('/impressum'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: absoluteDazitUrl('/datenschutzerklaerung'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: absoluteDazitUrl('/lizenz-und-nutzungsrecht'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  return [
    ...staticPages,
    ...worksheets.map((worksheet) => ({
      url: absoluteDazitUrl(`/documents/${encodeURIComponent(worksheet.slug)}`),
      lastModified: worksheet.publishedAt
        ? new Date(worksheet.publishedAt)
        : now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      images: worksheet.thumbnailUrls?.[0]
        ? [absoluteDazitUrl(worksheet.thumbnailUrls[0]).replaceAll('&', '&amp;')]
        : undefined,
    })),
  ];
}
