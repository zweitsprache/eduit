'use client';

const STORAGE_KEY = 'dazit:pending-download';
const MAX_AGE_MS = 15 * 60 * 1000;

export type PendingDownload = {
  returnTo: string;
  url: string;
};

function isSafePath(value: unknown, prefix: string): value is string {
  return typeof value === 'string'
    && value.startsWith(prefix)
    && !value.startsWith('//')
    && !value.includes('\\');
}

export function savePendingDownload(url: string) {
  if (!isSafePath(url, '/api/download/')) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    createdAt: Date.now(),
    returnTo: `${window.location.pathname}${window.location.search}`,
    url,
  }));
}

export function takePendingDownload(): PendingDownload | null {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const value = JSON.parse(stored) as Record<string, unknown>;
    if (typeof value.createdAt !== 'number' || Date.now() - value.createdAt > MAX_AGE_MS) {
      return null;
    }
    if (!isSafePath(value.url, '/api/download/') || !isSafePath(value.returnTo, '/')) {
      return null;
    }
    return { returnTo: value.returnTo, url: value.url };
  } catch {
    return null;
  }
}