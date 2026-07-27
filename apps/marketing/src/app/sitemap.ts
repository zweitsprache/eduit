import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://domain.com';
  const pages = ['', '/features', '/pricing', '/privacy', '/imprint'];

  return pages.flatMap((page) => ['de', 'en'].map((locale) => ({
    url: `${siteUrl}/${locale}${page}`,
    lastModified: new Date(),
    changeFrequency: page === '' ? 'weekly' as const : 'monthly' as const,
    priority: page === '' ? 1 : page === '/features' || page === '/pricing' ? 0.8 : 0.3,
    alternates: {
      languages: {
        de: `${siteUrl}/de${page}`,
        en: `${siteUrl}/en${page}`,
      },
    },
  })));
}
