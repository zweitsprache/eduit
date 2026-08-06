function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalizeDazitHost(url: URL) {
  if (url.hostname === 'dazit.io') {
    url.hostname = 'www.dazit.io';
  }
  return url;
}

export function dazitSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_DAZIT_URL
    || process.env.DAZIT_SITE_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || process.env.VERCEL_URL;
  const base = new URL(configured ? withProtocol(configured) : 'http://localhost:3001');
  return normalizeDazitHost(base);
}

export function absoluteDazitUrl(pathname: string) {
  return new URL(pathname, dazitSiteUrl()).toString();
}
