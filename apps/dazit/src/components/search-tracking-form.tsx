'use client';

import type { FormEvent, ReactNode } from 'react';

export function getAnonymousSearchSession() {
  const key = 'dazit-anonymous-search-session';
  let value = window.localStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); window.localStorage.setItem(key, value); }
  return value;
}

export function trackSearch(query: string, resultCount: number, filters: Record<string, unknown> = {}) {
  if (query.trim().length < 2) return;
  void fetch('/api/search-events', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, resultCount, filters, anonymousSessionId: getAnonymousSearchSession() }), keepalive: true,
  });
}

export function SearchTrackingForm({ children, className }: { children: ReactNode; className?: string }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const query = String(new FormData(form).get('q') || '').trim();
    // The homepage has no result set yet; the documents page records the actual count.
  };
  return <form action="/documents" className={className} method="get" onSubmit={submit}>{children}</form>;
}
