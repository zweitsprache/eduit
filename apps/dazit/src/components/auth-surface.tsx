'use client';

import { useState } from 'react';
import { AuthView } from '@neondatabase/auth/react/ui';
import { RegistrationForm } from '@/components/registration-form';
import { EmailOtpForm } from '@/components/email-otp-form';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

type AuthMode = 'sign-in' | 'sign-up' | 'email-otp' | 'forgot-password';

const authViews = {
  'email-otp': 'EMAIL_OTP',
  'sign-in': 'SIGN_IN',
  'sign-up': 'SIGN_UP',
} as const;

export function AuthSurface({
  initialMode = 'sign-in',
  showLogo = true,
}: {
  initialMode?: AuthMode;
  showLogo?: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const accountMode = mode === 'sign-up' ? 'sign-up' : 'sign-in';

  return (
    <div
      className="auth-surface"
      onClickCapture={(event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const forgotPasswordLink = target.closest('a[href="/auth/forgot-password"]');
        if (!forgotPasswordLink) return;
        event.preventDefault();
        setMode('forgot-password');
      }}
    >
      {showLogo && <img alt="DaZit" className="auth-surface-logo" src="/dazit_icon_orange.svg" />}
      <div aria-label="Anmeldemethode" className="auth-surface-tabs" role="tablist">
        <button
          aria-selected={accountMode === 'sign-in'}
          className={accountMode === 'sign-in' ? 'is-active' : ''}
          onClick={() => setMode('sign-in')}
          role="tab"
          type="button"
        >
          Anmelden
        </button>
        <button
          aria-selected={mode === 'sign-up'}
          className={mode === 'sign-up' ? 'is-active' : ''}
          onClick={() => setMode('sign-up')}
          role="tab"
          type="button"
        >
          Registrieren
        </button>
      </div>
      {mode === 'sign-up' ? (
        <RegistrationForm />
      ) : mode === 'email-otp' ? (
        <EmailOtpForm />
      ) : mode === 'forgot-password' ? (
        <ForgotPasswordForm onBack={() => setMode('sign-in')} />
      ) : (
        <AuthView
          className="auth-card"
          classNames={{
            footer: 'auth-surface-footer',
            form: {
              providerButton: 'auth-surface-provider-button',
              secondaryButton: 'auth-surface-internal-switch',
            },
          }}
          localization={{ SIGN_IN_WITH: 'mit' }}
          view={authViews[mode]}
        />
      )}
      {accountMode === 'sign-in' && mode !== 'forgot-password' && (
        <p className="auth-surface-code-switch">
          {mode === 'email-otp' ? 'Lieber mit Passwort?' : 'Lieber ohne Passwort?'}{' '}
          <button
            onClick={() => setMode(mode === 'email-otp' ? 'sign-in' : 'email-otp')}
            type="button"
          >
            {mode === 'email-otp' ? 'Mit Passwort anmelden' : 'Code per E-Mail erhalten'}
          </button>
        </p>
      )}
    </div>
  );
}