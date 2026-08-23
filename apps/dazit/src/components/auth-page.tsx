import { AuthView } from '@neondatabase/auth/react/ui';
import { AuthSurface } from '@/components/auth-surface';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { OAuthError } from '@/components/oauth-error';
import { ResetPasswordForm } from '@/components/reset-password-form';

function AuthCard({ children, showLogo = false }: { children: React.ReactNode; showLogo?: boolean }) {
  return (
    <section className="standalone-auth-card">
      {showLogo && (
        <header className="standalone-auth-card-header">
          <img alt="DaZit" src="/dazit_icon_orange.svg" />
        </header>
      )}
      <div className="standalone-auth-card-view">{children}</div>
    </section>
  );
}

export function AuthPage({ errorCode, path }: { errorCode?: string; path: string }) {
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
        <AuthCard showLogo><AuthSurface initialMode={path} showLogo={false} /></AuthCard>
      </main>
    );
  }

  if (path === 'oauth-error') {
    return (
      <main className="auth-page">
        <AuthCard><OAuthError errorCode={errorCode} /></AuthCard>
      </main>
    );
  }

  if (path === 'callback') {
    return (
      <main className="auth-page">
        <AuthCard>
          <section className="oauth-status" role="status">
            <img alt="DaZit" src="/dazit_icon_orange.svg" />
            <div>
              <h1>Anmeldung wird abgeschlossen</h1>
              <p>Einen Moment bitte.</p>
            </div>
            <AuthView pathname="callback" />
          </section>
        </AuthCard>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <AuthView pathname={path} />
    </main>
  );
}
