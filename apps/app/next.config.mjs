import path from 'node:path';

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  outputFileTracingIncludes: {
    '/api/worksheets/preview': [
      '../../node_modules/@sparticuz/chromium/bin/**',
      '../../node_modules/playwright-core/**',
    ],
    '/api/export/pdf': [
      '../../node_modules/@sparticuz/chromium/bin/**',
      '../../node_modules/playwright-core/**',
    ],
    '/api/export/png': [
      '../../node_modules/@sparticuz/chromium/bin/**',
      '../../node_modules/playwright-core/**',
    ],
    '/api/export/thumbnails': [
      '../../node_modules/@sparticuz/chromium/bin/**',
      '../../node_modules/playwright-core/**',
    ],
  },
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium'],
  transpilePackages: ['@eduit/ui'],
};

export default nextConfig;
