import { createNeonAuth } from '@neondatabase/auth/next/server';

const fallbackBaseUrl = 'http://127.0.0.1:3000/__neon-auth-not-configured';
const fallbackCookieSecret = 'development-only-neon-auth-cookie-secret';

export const isNeonAuthConfigured = Boolean(
  process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET,
);

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? fallbackBaseUrl,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? fallbackCookieSecret,
    sameSite: 'lax',
  },
});
