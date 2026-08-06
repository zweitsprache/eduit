import type { MetadataRoute } from 'next';
import { absoluteDazitUrl, dazitSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: [
        '/auth/',
        '/api/',
        '/*?*q=*',
      ],
    },
    sitemap: absoluteDazitUrl('/sitemap.xml'),
    host: dazitSiteUrl().origin,
  };
}
