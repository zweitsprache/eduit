import type { MetadataRoute } from 'next';
import { getWorksheets } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const worksheets = await getWorksheets();
  return [
    {
      url: absoluteDazitUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...worksheets.map((worksheet) => ({
      url: absoluteDazitUrl(`/documents/${worksheet.slug}`),
      lastModified: worksheet.publishedAt
        ? new Date(worksheet.publishedAt)
        : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      images: worksheet.thumbnailUrls?.[0]
        ? [absoluteDazitUrl(worksheet.thumbnailUrls[0])]
        : undefined,
    })),
  ];
}
