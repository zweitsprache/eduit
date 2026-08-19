'use client';

import { useEffect, useState } from 'react';

type DazitViewer = {
  authenticated: boolean;
  isAdmin: boolean;
};

export function useDazitViewer() {
  const [viewer, setViewer] = useState<DazitViewer | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadViewer = async () => {
      try {
        const response = await fetch('/api/viewer', { cache: 'no-store' });
        if (!response.ok) throw new Error('viewer_unavailable');
        const payload = await response.json() as DazitViewer;
        if (!cancelled) setViewer(payload);
      } catch {
        if (!cancelled) setViewer({ authenticated: false, isAdmin: false });
      }
    };

    loadViewer();

    return () => {
      cancelled = true;
    };
  }, []);

  return viewer;
}
