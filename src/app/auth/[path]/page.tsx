import { AuthPage } from '@/components/auth/auth-page';

const AUTH_PATHS = new Set([
  'sign-in',
  'sign-up',
  'forgot-password',
  'reset-password',
  'verify-email',
  'callback',
]);

export default async function AuthenticationPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return <AuthPage path={AUTH_PATHS.has(path) ? path : 'sign-in'} />;
}
