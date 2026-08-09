'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { PasswordStrengthMeter } from '@/components/password-strength-meter';

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Das Passwort konnte nicht geändert werden. Bitte fordern Sie einen neuen Link an.';
}

export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get('token');
    setToken(resetToken && resetToken !== 'INVALID_TOKEN' ? resetToken : '');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy) return;
    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await authClient.resetPassword({
        newPassword,
        token,
        fetchOptions: { throw: true },
      });
      setSuccess(true);
    } catch (submitError) {
      setError(errorMessage(submitError));
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setBusy(false);
    }
  }

  if (token === null) return null;

  return (
    <section className="reset-password-card">
      <header className="reset-password-card-header">
        <img alt="DaZit" src="/dazit_icon_orange.svg" />
      </header>
      <div className="reset-password-card-view">
        <div className="reset-password-surface">
          {success ? (
            <div className="reset-password-success" role="status">
              <h1>Passwort geändert</h1>
              <p>Ihr neues Passwort wurde gespeichert. Sie können sich jetzt damit anmelden.</p>
              <Link className="registration-submit" href="/auth/sign-in">Zum Anmelden</Link>
            </div>
          ) : (
            <>
              <div>
                <h1>Neues Passwort setzen</h1>
                <p>Wählen Sie ein neues Passwort mit mindestens 8 Zeichen und bestätigen Sie es.</p>
              </div>
              {!token ? (
                <div className="reset-password-invalid" role="alert">
                  <p>Dieser Link ist ungültig oder abgelaufen.</p>
                  <Link href="/auth/forgot-password">Neuen Link anfordern</Link>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <label className="registration-field">
                    <input
                      autoComplete="new-password"
                      disabled={busy}
                      maxLength={128}
                      minLength={8}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder=" "
                      required
                      type="password"
                      value={newPassword}
                    />
                    <span>Neues Passwort</span>
                  </label>
                  <PasswordStrengthMeter password={newPassword} />
                  <label className="registration-field">
                    <input
                      autoComplete="new-password"
                      disabled={busy}
                      maxLength={128}
                      minLength={8}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder=" "
                      required
                      type="password"
                      value={confirmPassword}
                    />
                    <span>Passwort wiederholen</span>
                  </label>
                  {error && <p className="registration-error" role="alert">{error}</p>}
                  <button className="registration-submit" disabled={busy} type="submit">
                    {busy ? 'Passwort wird gespeichert...' : 'Passwort speichern'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}