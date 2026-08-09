import { createNeonAuth } from '@neondatabase/auth/next/server';

const isProduction = process.env.NODE_ENV === 'production';
const configuredBaseUrl = process.env.NEON_AUTH_BASE_URL || process.env.AUTH_URL;
const configuredCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET || process.env.AUTH_SECRET;

const resolvedBaseUrl = (
  configuredBaseUrl
  || 'http://127.0.0.1:3000'
).replace(/\/$/, '');

const resolvedCookieSecret = configuredCookieSecret
  || 'development-only-neon-auth-cookie-secret';

if (isProduction && (!configuredBaseUrl || !configuredCookieSecret)) {
  throw new Error(
    'Neon Auth is not configured. Set NEON_AUTH_BASE_URL to the Neon Auth endpoint and NEON_AUTH_COOKIE_SECRET to a secure secret.',
  );
}

export const authCookieSecret = resolvedCookieSecret;

export const isNeonAuthConfigured = Boolean(
  configuredBaseUrl && configuredCookieSecret,
);

export const auth = createNeonAuth({
  baseUrl: resolvedBaseUrl,
  cookies: {
    secret: resolvedCookieSecret,
    sameSite: 'lax',
  },
});
