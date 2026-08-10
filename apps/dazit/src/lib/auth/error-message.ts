const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CREDENTIAL_ACCOUNT_NOT_FOUND: 'Für dieses Konto ist keine Passwort-Anmeldung eingerichtet.',
  INVALID_EMAIL: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  INVALID_EMAIL_OR_PASSWORD: 'E-Mail-Adresse oder Passwort ist nicht korrekt.',
  INVALID_OTP: 'Der Code ist ungültig. Bitte prüfen Sie Ihre Eingabe.',
  OTP_EXPIRED: 'Der Code ist abgelaufen. Bitte fordern Sie einen neuen Code an.',
  PASSWORD_TOO_SHORT: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  TOO_MANY_ATTEMPTS: 'Zu viele Versuche. Bitte fordern Sie einen neuen Code an.',
  USER_ALREADY_EXISTS: 'Für diese E-Mail-Adresse besteht bereits ein Konto.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Für diese E-Mail-Adresse besteht bereits ein Konto. Bitte verwenden Sie eine andere Adresse.',
};

const MESSAGE_TO_CODE: Record<string, string> = {
  'credential account not found': 'CREDENTIAL_ACCOUNT_NOT_FOUND',
  'invalid email': 'INVALID_EMAIL',
  'invalid email or password': 'INVALID_EMAIL_OR_PASSWORD',
  'invalid otp': 'INVALID_OTP',
  'otp expired': 'OTP_EXPIRED',
  'password too short': 'PASSWORD_TOO_SHORT',
  'too many attempts': 'TOO_MANY_ATTEMPTS',
  'user already exists': 'USER_ALREADY_EXISTS',
  'user already exists.': 'USER_ALREADY_EXISTS',
  'user already exists. use another email.': 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
};

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code.toUpperCase() : '';
  if (AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];

  const message = typeof candidate.message === 'string' ? candidate.message.trim().toLowerCase() : '';
  const messageCode = MESSAGE_TO_CODE[message];
  return messageCode ? AUTH_ERROR_MESSAGES[messageCode] : fallback;
}