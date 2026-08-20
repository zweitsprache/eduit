import { jwtVerify, type JWTPayload } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { auth, authCookieSecret } from '@/lib/auth/server';

const SESSION_DATA_COOKIE_NAME = '__Secure-neon-auth.local.session_data';
const encodedAuthCookieSecret = new TextEncoder().encode(authCookieSecret);
const authMiddleware = auth.middleware({ loginUrl: '/auth/sign-in' });

type SessionCookiePayload = JWTPayload & {
  user?: {
    id?: string;
    role?: string | null;
  };
};

function isAdminRole(role: string | null | undefined): boolean {
  return (role ?? '')
    .split(',')
    .map((value) => value.trim())
    .includes('admin');
}

async function readSessionPayload(
  request: NextRequest,
  response: NextResponse,
): Promise<SessionCookiePayload | null> {
  const sessionCookie = response.cookies.get(SESSION_DATA_COOKIE_NAME)?.value
    ?? request.cookies.get(SESSION_DATA_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, encodedAuthCookieSecret, {
      algorithms: ['HS256'],
    });
    return payload as SessionCookiePayload;
  } catch {
    return null;
  }
}

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

export default async function proxy(request: NextRequest) {
  const response = await authMiddleware(request);

  if (response.headers.has('location')) {
    return response;
  }

  const sessionPayload = await readSessionPayload(request, response);
  if (sessionPayload?.user?.id && isAdminRole(sessionPayload.user.role)) {
    return response;
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const forbiddenResponse = NextResponse.json(
      { error: 'Forbidden.' },
      { status: 403 },
    );
    copyCookies(response, forbiddenResponse);
    return forbiddenResponse;
  }

  const redirectUrl = new URL('/auth/sign-in', request.url);
  redirectUrl.searchParams.set('error', 'admin-required');

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyCookies(response, redirectResponse);
  return redirectResponse;
}

export const config = {
  matcher: [
    '/((?!auth|listen|api/auth|api/polar/webhook|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[^/]+$).*)',
  ],
};
