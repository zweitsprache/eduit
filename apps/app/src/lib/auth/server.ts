import { createNeonAuth } from '@neondatabase/auth/next/server';

const fallbackBaseUrl = 'http://127.0.0.1:3000';
const fallbackCookieSecret = 'development-only-neon-auth-cookie-secret';

const resolvedBaseUrl = (
  process.env.NEON_AUTH_BASE_URL
  || process.env.AUTH_URL
  || process.env.NEXT_PUBLIC_APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || fallbackBaseUrl
).replace(/\/$/, '');

const resolvedCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
  || process.env.AUTH_SECRET
  || fallbackCookieSecret;

export const authCookieSecret = resolvedCookieSecret;

export const isNeonAuthConfigured = Boolean(
  resolvedBaseUrl && resolvedCookieSecret,
);

export const auth = createNeonAuth({
  baseUrl: resolvedBaseUrl,
  cookies: {
    secret: resolvedCookieSecret,
    sameSite: 'lax',
  },
});
