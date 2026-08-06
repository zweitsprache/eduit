import { AuthPage } from '@/components/auth-page';

const authPaths = new Set([
  'sign-in',
  'sign-up',
  'email-otp',
  'magic-link',
  'forgot-password',
  'recover-account',
  'reset-password',
  'two-factor',
  'callback',
  'sign-out',
]);

export default async function AuthenticationPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return <AuthPage path={authPaths.has(path) ? path : 'sign-in'} />;
}
