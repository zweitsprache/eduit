'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

export function SearchTrackingForm({ children, className }: { children: ReactNode; className?: string }) {
  const [sessionId, setSessionId] = useState('');
  useEffect(() => {
    const key = 'dazit-anonymous-search-session';
    let value = window.localStorage.getItem(key);
    if (!value) { value = crypto.randomUUID(); window.localStorage.setItem(key, value); }
    setSessionId(value);
  }, []);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const query = String(new FormData(form).get('q') || '').trim();
    if (query.length >= 2) void fetch('/api/search-events', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, anonymousSessionId: sessionId }), keepalive: true,
    });
  };
  return <form action="/documents" className={className} method="get" onSubmit={submit}>{children}</form>;
}
