'use client';

import { FormEvent, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/locale-provider';

type AccountManagerProps = {
  email: string;
  initialName: string;
  tier: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
};

export function AccountManager({
  email,
  initialName,
  tier,
  subscriptionStatus,
  currentPeriodEnd,
}: AccountManagerProps) {
  const { locale, t } = useI18n();
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    const { error } = await authClient.updateUser({ name: name.trim() });
    setMessage(error?.message ?? t('account.profileSaved'));
    setPending(false);
  }

  async function checkout(nextTier: 'pro' | 'scale') {
    setPending(true);
    setMessage('');
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
    setMessage(result.error ?? t('account.checkoutError'));
    setPending(false);
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign('/');
  }

  return (
    <main className="min-h-screen bg-secondary px-6 py-16">
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <div className="flex justify-end md:col-span-2">
          <LanguageSwitcher />
        </div>
        <section id="billing" className="rounded-3xl border border-secondary bg-primary p-8 shadow-lg">
          <p className="text-sm font-semibold text-brand-secondary">{t('account.section')}</p>
          <h1 className="mt-2 text-display-sm font-semibold text-primary">{t('account.profile')}</h1>
          <form className="mt-6 space-y-4" onSubmit={saveProfile}>
            <label className="block text-sm font-medium text-secondary">
              {t('account.name')}
              <input
                className="mt-1 w-full border border-primary bg-primary px-3 py-2 text-primary"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-secondary">
              {t('account.email')}
              <input
                className="mt-1 w-full border border-primary bg-disabled px-3 py-2 text-disabled"
                value={email}
                disabled
              />
            </label>
            <button
              className="rounded-lg bg-brand-solid px-4 py-2 font-semibold text-white disabled:opacity-50"
              disabled={pending}
            >
              {t('account.saveProfile')}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-secondary bg-primary p-8 shadow-lg">
          <p className="text-sm font-semibold text-brand-secondary">{t('account.subscription')}</p>
          <h2 className="mt-2 text-display-sm font-semibold capitalize text-primary">{tier}</h2>
          <p className="mt-2 text-sm text-tertiary">
            {t('common.status')}: {subscriptionStatus ?? t('account.noSubscription')}
          </p>
          {currentPeriodEnd && (
            <p className="mt-1 text-sm text-tertiary">
              {t('account.currentPeriod', {
                date: new Date(currentPeriodEnd).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB'),
              })}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              className="rounded-lg bg-brand-solid px-4 py-2 font-semibold text-white disabled:opacity-50"
              onClick={() => checkout('pro')}
              disabled={pending}
            >
              {t('account.choosePro')}
            </button>
            <button
              className="rounded-lg border border-primary px-4 py-2 font-semibold text-secondary disabled:opacity-50"
              onClick={() => checkout('scale')}
              disabled={pending}
            >
              {t('account.chooseScale')}
            </button>
          </div>
        </section>

        {message && <p className="md:col-span-2 text-sm text-tertiary">{message}</p>}
        <button className="w-fit text-sm font-semibold text-error-primary" onClick={signOut}>
          {t('common.signOut')}
        </button>
      </div>
    </main>
  );
}
