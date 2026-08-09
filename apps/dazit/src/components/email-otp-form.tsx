'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth/client';

const CODE_LENGTH = 6;
const RESEND_DELAY = 45;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function EmailOtpForm({
  initialEmail = '',
  onVerified,
  onUseDifferentEmail,
  purpose = 'sign-in',
}: {
  initialEmail?: string;
  onVerified?: () => void;
  onUseDifferentEmail?: () => void;
  purpose?: 'sign-in' | 'email-verification';
}) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(initialEmail || null);
  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill('') as string[]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function sendCode(targetEmail: string) {
    setBusy(true);
    setError(null);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: targetEmail,
        type: purpose,
        fetchOptions: { throw: true },
      });
      setSentTo(targetEmail);
      setDigits(Array(CODE_LENGTH).fill(''));
      setResendIn(RESEND_DELAY);
      window.setTimeout(() => inputs.current[0]?.focus(), 0);
    } catch (sendError) {
      setError(errorMessage(sendError, 'Der Code konnte nicht gesendet werden.'));
    } finally {
      setBusy(false);
    }
  }

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setEmail(normalizedEmail);
    await sendCode(normalizedEmail);
  }

  async function verifyCode(code = digits.join('')) {
    if (!sentTo || code.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (purpose === 'email-verification') {
        const result = await authClient.emailOtp.verifyEmail({
          email: sentTo,
          otp: code,
          fetchOptions: { throw: true },
        });
        onVerified?.();
        window.location.assign(result.token ? '/auth/continue' : '/auth/sign-in');
      } else {
        await authClient.signIn.emailOtp({
          email: sentTo,
          otp: code,
          fetchOptions: { throw: true },
        });
        window.location.assign('/auth/continue');
      }
    } catch (verifyError) {
      setError(errorMessage(verifyError, 'Der Code ist ungültig oder abgelaufen.'));
      setDigits(Array(CODE_LENGTH).fill(''));
      window.setTimeout(() => inputs.current[0]?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }

  function updateDigit(index: number, value: string) {
    const nextDigit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = nextDigit;
    setDigits(next);
    if (nextDigit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (next.every(Boolean)) void verifyCode(next.join(''));
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handlePaste(value: string) {
    const pastedDigits = value.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
    if (!pastedDigits.length) return;
    const next = Array.from({ length: CODE_LENGTH }, (_, index) => pastedDigits[index] ?? '');
    setDigits(next);
    inputs.current[Math.min(pastedDigits.length, CODE_LENGTH) - 1]?.focus();
    if (pastedDigits.length === CODE_LENGTH) void verifyCode(next.join(''));
  }

  if (!sentTo) {
    return (
      <form className="email-otp-request" onSubmit={requestCode}>
        <p>Gib deine E-Mail-Adresse ein. Wir senden dir einen sechsstelligen Anmeldecode.</p>
        <label className="registration-field">
          <input
            autoComplete="email"
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
          {busy ? 'Code wird gesendet...' : 'Code senden'}
        </button>
      </form>
    );
  }

  return (
    <section className="email-otp-verification">
      <div>
        <h2>{purpose === 'email-verification' ? 'E-Mail bestätigen' : 'Code gesendet'}</h2>
        <p>
          Wir haben Ihnen einen 6-stelligen Code an <strong>{sentTo}</strong> geschickt.
          {purpose === 'email-verification' ? ' Geben Sie ihn ein, um Ihre Registrierung abzuschliessen.' : ''}
        </p>
      </div>
      <div aria-label="Sechsstelliger Anmeldecode" className="email-otp-code" role="group">
        {digits.map((digit, index) => (
          <input
            aria-label={`Ziffer ${index + 1}`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            disabled={busy}
            inputMode="numeric"
            key={index}
            maxLength={1}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => {
              event.preventDefault();
              handlePaste(event.clipboardData.getData('text'));
            }}
            ref={(element) => { inputs.current[index] = element; }}
            value={digit}
          />
        ))}
      </div>
      {error && <p className="registration-error" role="alert">{error}</p>}
      <button
        className="registration-submit"
        disabled={busy || digits.some((digit) => !digit)}
        onClick={() => void verifyCode()}
        type="button"
      >
        {busy
          ? 'Code wird geprüft...'
          : purpose === 'email-verification' ? 'E-Mail bestätigen' : 'Mit Code anmelden'}
      </button>
      <p className="email-otp-resend">
        Keine E-Mail erhalten?{' '}
        {resendIn > 0 ? (
          <span>Erneut senden in {resendIn} s</span>
        ) : (
          <button
            disabled={busy}
            onClick={() => void sendCode(sentTo)}
            type="button"
          >
            Erneut senden
          </button>
        )}
      </p>
      <button
        className="email-otp-change"
        onClick={() => {
          if (onUseDifferentEmail) onUseDifferentEmail();
          else setSentTo(null);
        }}
        type="button"
      >
        Andere E-Mail-Adresse verwenden
      </button>
    </section>
  );
}