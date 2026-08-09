'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { savePendingRegistration } from '@/lib/pending-registration';
import { PasswordStrengthMeter } from '@/components/password-strength-meter';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="registration-google-mark" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg">
      <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285f4" />
      <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34a853" />
      <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z" fill="#fbbc05" />
      <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#eb4335" />
    </svg>
  );
}

export function RegistrationForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [password, setPassword] = useState('');
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [registrationMethod, setRegistrationMethod] = useState<'email' | 'google'>('email');

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function resendVerification() {
    if (!verificationEmail || busy || resendIn > 0) return;
    setBusy(true);
    setError(null);
    try {
      await authClient.sendVerificationEmail({
        email: verificationEmail,
        callbackURL: `${window.location.origin}/auth/continue`,
        fetchOptions: { throw: true },
      });
      setResendIn(45);
    } catch (resendError) {
      setError(resendError instanceof Error
        ? resendError.message
        : 'Die Bestätigungs-E-Mail konnte nicht gesendet werden.');
    } finally {
      setBusy(false);
    }
  }

  async function registerWithGoogle() {
    setError(null);
    if (!termsAccepted) {
      setError('Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.');
      return;
    }
    savePendingRegistration({ newsletter });
    setBusy(true);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/auth/continue`,
        errorCallbackURL: `${window.location.origin}/auth/oauth-error`,
        fetchOptions: { throw: true },
      });
    } catch (registerError) {
      setError(registerError instanceof Error
        ? registerError.message
        : 'Google-Registrierung fehlgeschlagen.');
      setBusy(false);
    }
  }

  async function registerWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get('firstName') ?? '').trim();
    const lastName = String(formData.get('lastName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    setError(null);
    if (!firstName || !lastName) {
      setError('Bitte gib deinen Vor- und Nachnamen ein.');
      return;
    }
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (!termsAccepted) {
      setError('Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.');
      return;
    }

    savePendingRegistration({ firstName, lastName, newsletter });
    setBusy(true);
    try {
      const result = await authClient.signUp.email({
        email,
        name: `${firstName} ${lastName}`,
        password,
        callbackURL: `${window.location.origin}/auth/continue`,
        fetchOptions: { throw: true },
      });
      if (result.token) {
        window.location.assign('/auth/continue');
      } else {
        setVerificationEmail(email);
        setResendIn(45);
      }
    } catch (registerError) {
      setError(registerError instanceof Error
        ? registerError.message
        : 'Das Konto konnte nicht erstellt werden.');
    } finally {
      setBusy(false);
    }
  }

  if (verificationEmail) {
    return (
      <section className="registration-verification" role="status">
        <div>
          <h2>E-Mail bestätigen</h2>
          <p>
            Wir haben Ihnen einen Bestätigungslink an <strong>{verificationEmail}</strong> geschickt.
            Öffnen Sie den Link, um Ihre Registrierung abzuschliessen.
          </p>
        </div>
        {error && <p className="registration-error" role="alert">{error}</p>}
        <p className="registration-verification-resend">
          Keine E-Mail erhalten?{' '}
          {resendIn > 0 ? (
            <span>Erneut senden in {resendIn} s</span>
          ) : (
            <button disabled={busy} onClick={() => void resendVerification()} type="button">
              Erneut senden
            </button>
          )}
        </p>
        <button
          className="email-otp-change"
          onClick={() => {
            setVerificationEmail(null);
            setError(null);
          }}
          type="button"
        >
          Andere E-Mail-Adresse verwenden
        </button>
      </section>
    );
  }

  if (registrationMethod === 'google') {
    return (
      <div className="registration-form registration-google-consent">
        <div className="registration-method-heading">
          <GoogleIcon />
          <div>
            <h2>Mit Google registrieren</h2>
            <p>Bestätigen Sie Ihre Auswahl, bevor Sie zu Google weitergeleitet werden.</p>
          </div>
        </div>
        <form onSubmit={(event) => {
          event.preventDefault();
          void registerWithGoogle();
        }}>
          <label className="registration-checkbox">
            <input
              checked={termsAccepted}
              name="termsAccepted"
              onChange={(event) => setTermsAccepted(event.target.checked)}
              required
              type="checkbox"
            />
            <span>
              Ich akzeptiere die{' '}
              <Link href="/lizenz-und-nutzungsrecht" target="_blank">AGB</Link>
              {' '}und die{' '}
              <Link href="/datenschutzerklaerung" target="_blank">Datenschutzerklärung</Link>.
            </span>
          </label>
          <label className="registration-checkbox">
            <input
              checked={newsletter}
              name="newsletter"
              onChange={(event) => setNewsletter(event.target.checked)}
              type="checkbox"
            />
            <span>Ich möchte über Neuigkeiten auf DaZit informiert werden.</span>
          </label>
          {error && <p className="registration-error" role="alert">{error}</p>}
          <button className="registration-submit" disabled={busy || !termsAccepted} type="submit">
            {busy ? 'Weiterleitung zu Google...' : 'Mit Google fortfahren'}
          </button>
          <button
            className="registration-method-back"
            disabled={busy}
            onClick={() => {
              setRegistrationMethod('email');
              setError(null);
            }}
            type="button"
          >
            Mit E-Mail registrieren
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="registration-form">
      <button
        className="registration-google"
        disabled={busy}
        onClick={() => {
          setRegistrationMethod('google');
          setError(null);
        }}
        type="button"
      >
        <GoogleIcon />
        Mit Google registrieren
      </button>

      <div className="registration-divider"><span>oder mit E-Mail</span></div>

      <form onSubmit={registerWithEmail}>
        <div className="registration-name-grid">
          <label className="registration-field">
            <input autoComplete="given-name" name="firstName" placeholder=" " required />
            <span>Vorname</span>
          </label>
          <label className="registration-field">
            <input autoComplete="family-name" name="lastName" placeholder=" " required />
            <span>Nachname</span>
          </label>
        </div>
        <label className="registration-field">
          <input autoComplete="email" name="email" placeholder=" " required type="email" />
          <span>E-Mail-Adresse</span>
        </label>
        <label className="registration-field">
          <input
            autoComplete="new-password"
            maxLength={128}
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder=" "
            required
            type="password"
          />
          <span>Passwort</span>
        </label>
        <PasswordStrengthMeter password={password} />
        <label className="registration-field">
          <input autoComplete="new-password" maxLength={128} minLength={8} name="confirmPassword" placeholder=" " required type="password" />
          <span>Passwort wiederholen</span>
        </label>
        <label className="registration-checkbox">
          <input
            checked={termsAccepted}
            name="termsAccepted"
            onChange={(event) => setTermsAccepted(event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            Ich akzeptiere die{' '}
            <Link href="/lizenz-und-nutzungsrecht" target="_blank">AGB</Link>
            {' '}und die{' '}
            <Link href="/datenschutzerklaerung" target="_blank">Datenschutzerklärung</Link>.
          </span>
        </label>
        <label className="registration-checkbox">
          <input
            checked={newsletter}
            name="newsletter"
            onChange={(event) => setNewsletter(event.target.checked)}
            type="checkbox"
          />
          <span>Ich möchte über Neuigkeiten auf DaZit informiert werden.</span>
        </label>
        {error && <p className="registration-error" role="alert">{error}</p>}
        <button className="registration-submit" disabled={busy} type="submit">
          {busy ? 'Konto wird erstellt...' : 'Konto erstellen'}
        </button>
      </form>
    </div>
  );
}