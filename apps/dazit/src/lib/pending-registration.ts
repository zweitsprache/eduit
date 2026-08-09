'use client';

const STORAGE_KEY = 'dazit:pending-registration';

export function savePendingRegistration({
  firstName,
  lastName,
  newsletter,
}: {
  firstName?: string;
  lastName?: string;
  newsletter: boolean;
}) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    createdAt: Date.now(),
    firstName,
    lastName,
    newsletter,
    termsAccepted: true,
  }));
}

export async function persistPendingRegistration() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  try {
    const value = JSON.parse(stored) as Record<string, unknown>;
    if (typeof value.createdAt !== 'number' || Date.now() - value.createdAt > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const response = await fetch('/api/account/registration-preferences', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstName: typeof value.firstName === 'string' ? value.firstName : null,
        lastName: typeof value.lastName === 'string' ? value.lastName : null,
        newsletter: value.newsletter === true,
        termsAccepted: value.termsAccepted === true,
      }),
    });
    if (response.ok) sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}