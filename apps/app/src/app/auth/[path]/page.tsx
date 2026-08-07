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
  searchParams,
}: {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { path } = await params;
  const { error } = await searchParams;

  return (
    <AuthPage
      path={AUTH_PATHS.has(path) ? path : 'sign-in'}
      errorMessage={error === 'admin-required'
        ? 'Dieses Konto hat keinen Admin-Zugriff auf diese App.'
        : null}
    />
  );
}
