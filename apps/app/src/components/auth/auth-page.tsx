'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AuthView } from '@neondatabase/auth/react/ui';

type SignInMode = 'password' | 'otp';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function SignInPanel({ errorMessage }: { errorMessage?: string | null }) {
  const [mode, setMode] = useState<SignInMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);

  const goToDocuments = () => {
    window.location.assign('/documents');
  };

  const signInWithPassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || 'Anmeldung fehlgeschlagen.');
      }
      goToDocuments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/auth/email-otp/send-verification-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          type: 'sign-in',
        }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || 'Code konnte nicht gesendet werden.');
      }
      setOtpSent(true);
      setSuccess('Code gesendet. Bitte E-Mail prüfen.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Code konnte nicht gesendet werden.');
    } finally {
      setBusy(false);
    }
  };

  const signInWithOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/auth/sign-in/email-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: otp.trim(),
        }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || 'Code ungültig oder abgelaufen.');
      }
      goToDocuments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Code ungültig oder abgelaufen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-6 py-16">
      <section className="w-full max-w-md rounded-xl border border-secondary bg-primary p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-primary">Anmelden</h1>
        <p className="mt-2 text-sm text-tertiary">Melde dich an, um auf deine Dokumente zuzugreifen.</p>

        {errorMessage && <p className="mt-4 text-sm text-error-primary">{errorMessage}</p>}

        <div className="mt-5 flex gap-2">
          <button
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${mode === 'password' ? 'border-brand bg-brand-secondary text-brand-primary' : 'border-secondary text-secondary'}`}
            onClick={() => {
              setMode('password');
              setError(null);
              setSuccess(null);
            }}
            type="button"
          >
            Passwort
          </button>
          <button
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${mode === 'otp' ? 'border-brand bg-brand-secondary text-brand-primary' : 'border-secondary text-secondary'}`}
            onClick={() => {
              setMode('otp');
              setError(null);
              setSuccess(null);
            }}
            type="button"
          >
            E-Mail-Code
          </button>
        </div>

        {mode === 'password' ? (
          <form className="mt-5 space-y-3" onSubmit={signInWithPassword}>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@beispiel.ch"
              type="email"
              value={email}
              required
            />
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Passwort"
              type="password"
              value={password}
              required
            />
            <button
              className="w-full rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {busy ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        ) : (
          <div className="mt-5 space-y-3">
            <form className="space-y-3" onSubmit={requestOtp}>
              <input
                autoComplete="email"
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@beispiel.ch"
                type="email"
                value={email}
                required
              />
              <button
                className="w-full rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                {busy ? 'Senden...' : 'Code senden'}
              </button>
            </form>

            {otpSent && (
              <form className="space-y-3" onSubmit={signInWithOtp}>
                <input
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                  inputMode="numeric"
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="6-stelliger Code"
                  value={otp}
                  required
                />
                <button
                  className="w-full rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? 'Prüfen...' : 'Mit Code anmelden'}
                </button>
              </form>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-error-primary">{error}</p>}
        {success && <p className="mt-4 text-sm text-success-primary">{success}</p>}
      </section>
    </main>
  );
}

export function AuthPage({
  path,
  errorMessage,
}: {
  path: string;
  errorMessage?: string | null;
}) {
  if (path === 'sign-in') {
    return <SignInPanel errorMessage={errorMessage} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-6 py-16">
      <AuthView pathname={path} />
    </main>
  );
}
