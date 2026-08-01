import type { MetadataRoute } from 'next';
import { absoluteDazitUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/download/', '/api/thumbnail/'],
      disallow: ['/api/publications/'],
    },
    sitemap: absoluteDazitUrl('/sitemap.xml'),
    host: absoluteDazitUrl('/'),
  };
}
