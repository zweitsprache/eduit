'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Der Link konnte nicht gesendet werden. Bitte versuchen Sie es erneut.';
}

export function ForgotPasswordForm({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || busy) return;

    setBusy(true);
    setError(null);
    try {
      await authClient.requestPasswordReset({
        email: normalizedEmail,
        redirectTo: `${window.location.origin}/auth/reset-password`,
        fetchOptions: { throw: true },
      });
      setEmail(normalizedEmail);
      setSent(true);
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="forgot-password-surface">
      {onBack ? (
        <button className="forgot-password-back" onClick={onBack} type="button">
          <ChevronLeft aria-hidden="true" />
          Zurück zum Anmelden
        </button>
      ) : (
        <Link className="forgot-password-back" href="/auth/sign-in">
          <ChevronLeft aria-hidden="true" />
          Zurück zum Anmelden
        </Link>
      )}
      <div>
        <h1>Passwort zurücksetzen</h1>
        <p>
          Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link, mit dem Sie ein neues
          Passwort setzen können.
        </p>
      </div>
      {sent ? (
        <div className="forgot-password-success" role="status">
          <strong>Prüfen Sie Ihr Postfach.</strong>
          <p>
            Falls ein Konto für <strong>{email}</strong> besteht, erhalten Sie in Kürze einen Link
            zum Zurücksetzen Ihres Passworts.
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label className="registration-field">
            <input
              autoComplete="email"
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder=" "
              required
              type="email"
              value={email}
            />
            <span>E-Mail-Adresse</span>
          </label>
          {error && <p className="registration-error" role="alert">{error}</p>}
          <button className="registration-submit" disabled={busy} type="submit">
            {busy ? 'Link wird gesendet...' : 'Link senden'}
          </button>
        </form>
      )}
    </section>
  );
}