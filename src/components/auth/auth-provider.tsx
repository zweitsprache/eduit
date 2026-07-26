'use client';

import { NeonAuthUIProvider } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';
import { useI18n } from '@/components/i18n/locale-provider';

const germanAuth = {
  ALREADY_HAVE_AN_ACCOUNT: 'Du hast bereits ein Konto?',
  CONFIRM_PASSWORD: 'Passwort bestätigen',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Passwort bestätigen',
  CONFIRM_PASSWORD_REQUIRED: 'Die Passwortbestätigung ist erforderlich',
  DONT_HAVE_AN_ACCOUNT: 'Du hast noch kein Konto?',
  EMAIL: 'E-Mail',
  EMAIL_PLACEHOLDER: 'name@beispiel.ch',
  FORGOT_PASSWORD_ACTION: 'Link zum Zurücksetzen senden',
  FORGOT_PASSWORD_EMAIL: 'Prüfe deine E-Mails, um dein Passwort zurückzusetzen.',
  FORGOT_PASSWORD_LINK: 'Passwort vergessen?',
  GO_BACK: 'Zurück',
  INVALID_PASSWORD: 'Ungültiges Passwort',
  INVALID_TOKEN: 'Ungültiger oder abgelaufener Link',
  IS_INVALID: 'ist ungültig',
  IS_REQUIRED: 'ist erforderlich',
  NAME: 'Name',
  NAME_PLACEHOLDER: 'Name',
  NEW_PASSWORD: 'Neues Passwort',
  NEW_PASSWORD_PLACEHOLDER: 'Neues Passwort',
  NEW_PASSWORD_REQUIRED: 'Ein neues Passwort ist erforderlich',
  OPTIONAL_BRACKETS: '(optional)',
  OR_CONTINUE_WITH: 'Oder fortfahren mit',
  PASSWORD: 'Passwort',
  PASSWORDS_DO_NOT_MATCH: 'Die Passwörter stimmen nicht überein',
  PASSWORD_PLACEHOLDER: 'Passwort',
  PASSWORD_TOO_LONG: 'Das Passwort ist zu lang',
  PASSWORD_TOO_SHORT: 'Das Passwort ist zu kurz',
  REMEMBER_ME: 'Angemeldet bleiben',
  RESET_PASSWORD_ACTION: 'Passwort zurücksetzen',
  RESET_PASSWORD_SUCCESS: 'Dein Passwort wurde zurückgesetzt.',
  SIGN_IN: 'Anmelden',
  SIGN_IN_ACTION: 'Anmelden',
  SIGN_IN_WITH: 'Anmelden mit',
  SIGN_UP: 'Registrieren',
  SIGN_UP_ACTION: 'Konto erstellen',
  SIGN_UP_EMAIL: 'Prüfe deine E-Mails, um dein Konto zu bestätigen.',
  UPLOAD: 'Hochladen',
  USERNAME: 'Benutzername',
  USERNAME_PLACEHOLDER: 'Benutzername',
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo="/documents"
      defaultTheme="light"
      localization={locale === 'de' ? germanAuth : undefined}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
