'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AuthView } from '@neondatabase/auth/react/ui';

type SignInMode = 'password' | 'otp';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function DazitSignInPanel() {
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
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Anmeldung fehlgeschlagen.');
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
        body: JSON.stringify({ email: normalizedEmail, type: 'sign-in' }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Code konnte nicht gesendet werden.');
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
        body: JSON.stringify({ email: normalizedEmail, otp: otp.trim() }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Code ungültig oder abgelaufen.');
      goToDocuments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Code ungültig oder abgelaufen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-inline-panel">
        <h1>Anmelden</h1>
        <p>Melde dich an, um auf deine Dokumente zuzugreifen.</p>

        <div className="auth-inline-tabs">
          <button
            className={mode === 'password' ? 'is-active' : ''}
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
            className={mode === 'otp' ? 'is-active' : ''}
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
          <form className="auth-inline-form" onSubmit={signInWithPassword}>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@beispiel.ch"
              required
              type="email"
              value={email}
            />
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Passwort"
              required
              type="password"
              value={password}
            />
            <button className="auth-inline-primary" disabled={busy} type="submit">
              {busy ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>
        ) : (
          <div className="auth-inline-form-wrap">
            <form className="auth-inline-form" onSubmit={requestOtp}>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@beispiel.ch"
                required
                type="email"
                value={email}
              />
              <button className="auth-inline-secondary" disabled={busy} type="submit">
                {busy ? 'Senden...' : 'Code senden'}
              </button>
            </form>
            {otpSent && (
              <form className="auth-inline-form" onSubmit={signInWithOtp}>
                <input
                  inputMode="numeric"
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="6-stelliger Code"
                  required
                  value={otp}
                />
                <button className="auth-inline-primary" disabled={busy} type="submit">
                  {busy ? 'Prüfen...' : 'Mit Code anmelden'}
                </button>
              </form>
            )}
          </div>
        )}

        {error && <p className="auth-inline-error">{error}</p>}
        {success && <p className="auth-inline-success">{success}</p>}
      </section>
    </main>
  );
}

export function AuthPage({ path }: { path: string }) {
  if (path === 'sign-in') {
    return <DazitSignInPanel />;
  }

  return (
    <main className="auth-page">
      <AuthView pathname={path} />
    </main>
  );
}
