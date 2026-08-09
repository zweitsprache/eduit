'use client';

import { useMemo } from 'react';
import { AuthUIProvider } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';

const germanAuth = {
  EMAIL: 'E-Mail-Adresse',
  EMAIL_OTP: 'E-Mail-Code',
  EMAIL_OTP_DESCRIPTION: 'Gib deine E-Mail-Adresse ein, um einen Anmeldecode zu erhalten.',
  EMAIL_OTP_SEND_ACTION: 'Code senden',
  EMAIL_OTP_VERIFICATION_SENT: 'Der Code wurde gesendet.',
  FORGOT_PASSWORD_LINK: 'Passwort vergessen?',
  OR_CONTINUE_WITH: 'oder mit E-Mail',
  PASSWORD: 'Passwort',
  SIGN_IN: 'Anmelden',
  SIGN_IN_ACTION: 'Anmelden',
  SIGN_IN_DESCRIPTION: 'Melde dich mit deinem DaZit-Konto an.',
  SIGN_IN_WITH: 'Mit',
  SIGN_UP: 'Registrieren',
  SIGN_UP_ACTION: 'Konto erstellen',
  SIGN_UP_DESCRIPTION: 'Erstelle dein kostenloses DaZit-Konto.',
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
        magicLink={false}
        multiSession={false}
        oneTap={false}
        passkey={false}
        redirectTo="/auth/continue"
        social={{ providers: ['google'] }}
      >
        {children}
      </AuthUIProvider>
    </div>
  );
}
