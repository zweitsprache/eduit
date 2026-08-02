import { AuthPage } from '@/components/auth-page';

const authPaths = new Set([
  'sign-in',
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
  return <AuthPage path={authPaths.has(path) ? path : 'sign-in'} />;
}
