import { AuthPage } from '@/components/auth-page';

const authPaths = new Set([
  'sign-in',
  'sign-up',
  'email-otp',
  'forgot-password',
  'reset-password',
  'oauth-error',
  'callback',
  'sign-out',
]);

export default async function AuthenticationPage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { path } = await params;
  const { error } = await searchParams;
  return (
    <AuthPage
      errorCode={typeof error === 'string' ? error : undefined}
      path={authPaths.has(path) ? path : 'sign-in'}
    />
  );
}
