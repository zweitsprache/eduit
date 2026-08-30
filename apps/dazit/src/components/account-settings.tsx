'use client';

import { FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { authErrorMessage } from '@/lib/auth/error-message';
import { PasswordStrengthMeter } from '@/components/password-strength-meter';
import type { Tier } from '@/lib/dazit-billing';
import type { CurrentUsage } from '@/lib/download-entitlements';

function messageFrom(error: unknown, fallback: string) {
  return authErrorMessage(error, fallback);
}

const TIER_LABEL: Record<Tier, string> = {
  free: 'Kostenlos',
  plus: 'Plus',
  unlimited: 'Unlimited',
};

function SubscriptionSection({ tier, hasPolarCustomer, usage }: {
  tier: Tier;
  hasPolarCustomer: boolean;
  usage: CurrentUsage;
}) {
  const [pending, setPending] = useState<'plus' | 'unlimited' | 'portal' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function checkout(nextTier: 'plus' | 'unlimited') {
    setPending(nextTier);
    setMessage(null);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: nextTier }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setMessage(result.error ?? 'Checkout konnte nicht gestartet werden.');
    } finally {
      setPending(null);
    }
  }

  async function openPortal() {
    setPending('portal');
    setMessage(null);
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' });
      const result = await response.json() as { url?: string; error?: string };
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setMessage(result.error ?? 'Abo-Verwaltung konnte nicht geöffnet werden.');
    } finally {
      setPending(null);
    }
  }

  const resetsAtLabel = usage.resetsAt
    ? new Intl.DateTimeFormat('de-CH', {
      dateStyle: usage.periodKind === 'month' ? 'medium' : undefined,
      timeStyle: usage.periodKind === 'day' ? 'short' : undefined,
    }).format(new Date(usage.resetsAt))
    : null;

  return (
    <section className="account-settings-section">
      <h2>Abonnement</h2>
      <p>
        Aktueller Plan: <strong>{TIER_LABEL[tier]}</strong>
      </p>
      {usage.limit !== null && (
        <p>
          Downloads in diesem Zeitraum: {usage.used} / {usage.limit}
          {resetsAtLabel && (usage.periodKind === 'month'
            ? ` (Zurücksetzung am ${resetsAtLabel})`
            : ` (Zurücksetzung um ${resetsAtLabel})`)}
        </p>
      )}
      {usage.limit === null && <p>Unbegrenzte Downloads.</p>}
      {message && <p className="account-settings-message" role="status">{message}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {tier !== 'plus' && tier !== 'unlimited' && (
          <button
            className="registration-submit"
            disabled={pending !== null}
            onClick={() => void checkout('plus')}
            type="button"
          >
            {pending === 'plus' ? 'Wird geladen...' : 'Auf Plus upgraden'}
          </button>
        )}
        {tier !== 'unlimited' && (
          <button
            className="registration-submit"
            disabled={pending !== null}
            onClick={() => void checkout('unlimited')}
            type="button"
          >
            {pending === 'unlimited' ? 'Wird geladen...' : 'Auf Unlimited upgraden'}
          </button>
        )}
        {hasPolarCustomer && (
          <button
            className="account-settings-secondary"
            disabled={pending !== null}
            onClick={() => void openPortal()}
            type="button"
          >
            {pending === 'portal' ? 'Wird geladen...' : 'Abo verwalten'}
          </button>
        )}
      </div>
    </section>
  );
}

export function AccountSettings({
  email,
  initialName,
  tier,
  hasPolarCustomer,
  usage,
}: {
  email: string;
  initialName: string;
  tier: Tier;
  hasPolarCustomer: boolean;
  usage: CurrentUsage;
}) {
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) return;
    setBusy('profile');
    setProfileMessage(null);
    try {
      await authClient.updateUser({ name: normalizedName, fetchOptions: { throw: true } });
      setName(normalizedName);
      setProfileMessage('Profil gespeichert.');
    } catch (error) {
      setProfileMessage(messageFrom(error, 'Das Profil konnte nicht gespeichert werden.'));
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    setBusy('password');
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
        fetchOptions: { throw: true },
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Passwort geändert. Andere Sitzungen wurden abgemeldet.');
    } catch (error) {
      setPasswordMessage(messageFrom(error, 'Das Passwort konnte nicht geändert werden.'));
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteConfirmation !== 'LÖSCHEN') return;
    setBusy('delete');
    setDeleteMessage(null);
    try {
      await authClient.deleteUser({
        ...(deletePassword ? { password: deletePassword } : {}),
        fetchOptions: { throw: true },
      });
      window.location.assign('/');
    } catch (error) {
      setDeleteMessage(messageFrom(error, 'Das Konto konnte nicht gelöscht werden.'));
      setBusy(null);
    }
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign('/');
  }

  return (
    <main className="account-settings-page">
      <div className="account-settings-heading">
        <h1>Konto</h1>
        <p>Verwalten Sie Ihr Profil, Passwort und DaZit-Konto.</p>
      </div>

      <section className="account-settings-section">
        <h2>Profil</h2>
        <form onSubmit={saveProfile}>
          <label className="registration-field">
            <input onChange={(event) => setName(event.target.value)} placeholder=" " required value={name} />
            <span>Name</span>
          </label>
          <label className="registration-field">
            <input disabled placeholder=" " value={email} />
            <span>E-Mail-Adresse</span>
          </label>
          {profileMessage && <p className="account-settings-message" role="status">{profileMessage}</p>}
          <button className="registration-submit" disabled={busy !== null} type="submit">
            {busy === 'profile' ? 'Wird gespeichert...' : 'Profil speichern'}
          </button>
        </form>
      </section>

      <section className="account-settings-section">
        <h2>Passwort ändern</h2>
        <form onSubmit={changePassword}>
          <label className="registration-field">
            <input autoComplete="current-password" onChange={(event) => setCurrentPassword(event.target.value)} placeholder=" " required type="password" value={currentPassword} />
            <span>Aktuelles Passwort</span>
          </label>
          <label className="registration-field">
            <input autoComplete="new-password" maxLength={128} minLength={8} onChange={(event) => setNewPassword(event.target.value)} placeholder=" " required type="password" value={newPassword} />
            <span>Neues Passwort</span>
          </label>
          <PasswordStrengthMeter password={newPassword} />
          <label className="registration-field">
            <input autoComplete="new-password" maxLength={128} minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} placeholder=" " required type="password" value={confirmPassword} />
            <span>Passwort wiederholen</span>
          </label>
          {passwordMessage && <p className="account-settings-message" role="status">{passwordMessage}</p>}
          <button className="registration-submit" disabled={busy !== null} type="submit">
            {busy === 'password' ? 'Wird geändert...' : 'Passwort ändern'}
          </button>
        </form>
      </section>

      <section className="account-settings-section">
        <h2>Sitzung</h2>
        <button className="account-settings-secondary" onClick={() => void signOut()} type="button">Abmelden</button>
      </section>

      <SubscriptionSection hasPolarCustomer={hasPolarCustomer} tier={tier} usage={usage} />

      <section className="account-settings-section account-settings-danger">
        <h2>Konto löschen</h2>
        <p>Diese Aktion kann nicht rückgängig gemacht werden. Geben Sie bei einem Passwort-Konto zusätzlich Ihr aktuelles Passwort ein.</p>
        <form onSubmit={deleteAccount}>
          <label className="registration-field">
            <input autoComplete="current-password" onChange={(event) => setDeletePassword(event.target.value)} placeholder=" " type="password" value={deletePassword} />
            <span>Aktuelles Passwort (optional bei Google)</span>
          </label>
          <label className="registration-field">
            <input autoComplete="off" onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder=" " required value={deleteConfirmation} />
            <span>Zur Bestätigung LÖSCHEN eingeben</span>
          </label>
          {deleteMessage && <p className="registration-error" role="alert">{deleteMessage}</p>}
          <button className="account-settings-delete" disabled={busy !== null || deleteConfirmation !== 'LÖSCHEN'} type="submit">
            {busy === 'delete' ? 'Konto wird gelöscht...' : 'Konto endgültig löschen'}
          </button>
        </form>
      </section>
    </main>
  );
}