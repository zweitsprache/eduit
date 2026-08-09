import { AuthView } from '@neondatabase/auth/react/ui';
import { AuthSurface } from '@/components/auth-surface';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { ResetPasswordForm } from '@/components/reset-password-form';

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="standalone-auth-card">
      <div className="standalone-auth-card-view">{children}</div>
    </section>
  );
}

export function AuthPage({ path }: { path: string }) {
  if (path === 'reset-password') {
    return (
      <main className="auth-page">
        <ResetPasswordForm />
      </main>
    );
  }

  if (path === 'forgot-password') {
    return (
      <main className="auth-page">
        <AuthCard><ForgotPasswordForm /></AuthCard>
      </main>
    );
  }

  if (path === 'sign-in' || path === 'sign-up' || path === 'email-otp') {
    return (
      <main className="auth-page">
        <AuthCard><AuthSurface initialMode={path} /></AuthCard>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <AuthView pathname={path} />
    </main>
  );
}
