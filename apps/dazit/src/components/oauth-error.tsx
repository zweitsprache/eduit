import Link from 'next/link';

const errorMessages: Record<string, string> = {
  access_denied: 'Die Anmeldung mit Google wurde abgebrochen.',
  account_not_linked: 'Diese E-Mail-Adresse ist bereits mit einer anderen Anmeldemethode verknüpft.',
  signup_disabled: 'Die Registrierung mit Google ist derzeit nicht verfügbar.',
};

export function OAuthError({ errorCode }: { errorCode?: string }) {
  const message = errorMessages[errorCode?.toLowerCase() ?? '']
    ?? 'Die Anmeldung mit Google konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.';

  return (
    <section className="oauth-status" role="alert">
      <img alt="DaZit" src="/dazit_icon_orange.svg" />
      <div>
        <h1>Anmeldung nicht abgeschlossen</h1>
        <p>{message}</p>
      </div>
      <Link className="oauth-status-primary" href="/auth/sign-in">Erneut anmelden</Link>
      <Link className="oauth-status-secondary" href="/auth/email-otp">
        Stattdessen Code per E-Mail verwenden
      </Link>
    </section>
  );
}