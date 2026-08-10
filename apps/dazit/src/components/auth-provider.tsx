'use client';

import { useMemo } from 'react';
import { AuthUIProvider } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';

const germanAuth = {
  EMAIL: 'E-Mail-Adresse',
  EMAIL_OTP: 'E-Mail-Code',
  EMAIL_OTP_DESCRIPTION: 'Geben Sie Ihre E-Mail-Adresse ein, um einen Anmeldecode zu erhalten.',
  EMAIL_OTP_SEND_ACTION: 'Code senden',
  EMAIL_OTP_VERIFICATION_SENT: 'Der Code wurde gesendet.',
  FORGOT_PASSWORD_LINK: 'Passwort vergessen?',
  OR_CONTINUE_WITH: 'oder mit E-Mail',
  PASSWORD: 'Passwort',
  SIGN_IN: 'Anmelden',
  SIGN_IN_ACTION: 'Anmelden',
  SIGN_IN_DESCRIPTION: 'Melden Sie sich mit Ihrem DaZit-Konto an.',
  SIGN_IN_WITH: 'Mit',
  SIGN_UP: 'Registrieren',
  SIGN_UP_ACTION: 'Konto erstellen',
  SIGN_UP_DESCRIPTION: 'Erstellen Sie Ihr kostenloses DaZit-Konto.',
  INVALID_EMAIL: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  INVALID_EMAIL_OR_PASSWORD: 'E-Mail-Adresse oder Passwort ist nicht korrekt.',
  PASSWORD_TOO_SHORT: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  USER_ALREADY_EXISTS: 'Für diese E-Mail-Adresse besteht bereits ein Konto.',
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const baseURL = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return '';
  }, []);

  return (
    <div className="neon-auth-ui">
      <AuthUIProvider
        apiKey={false}
        authClient={authClient}
        basePath="/auth"
        baseURL={baseURL}
        emailOTP
        localization={germanAuth}
        localizeErrors
        magicLink={false}
        multiSession={false}
        oneTap={false}
        passkey={false}
        redirectTo="/auth/continue"
        social={{
          providers: ['google'],
          signIn: (params) => authClient.signIn.social({
            ...params,
            errorCallbackURL: `${window.location.origin}/auth/oauth-error`,
          }),
        }}
      >
        {children}
      </AuthUIProvider>
    </div>
  );
}
