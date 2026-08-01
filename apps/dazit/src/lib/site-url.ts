function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function dazitSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_DAZIT_URL
    || process.env.DAZIT_SITE_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || process.env.VERCEL_URL;
  return new URL(configured ? withProtocol(configured) : 'http://localhost:3001');
}

export function absoluteDazitUrl(pathname: string) {
  return new URL(pathname, dazitSiteUrl()).toString();
}
