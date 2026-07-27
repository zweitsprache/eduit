import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') return NextResponse.next();

  const accepted = request.headers.get('accept-language')?.toLowerCase() ?? '';
  const locale = accepted.startsWith('en') ? 'en' : 'de';
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = {
  matcher: ['/'],
};
