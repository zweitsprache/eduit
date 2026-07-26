import { auth } from '@/lib/auth/server';

export default auth.middleware({ loginUrl: '/auth/sign-in' });

export const config = {
  matcher: [
    '/editor/:path*',
    '/documents/:path*',
    '/brands/:path*',
    '/account/:path*',
    '/billing/:path*',
    '/admin/:path*',
  ],
};
