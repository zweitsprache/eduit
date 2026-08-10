'use client';

import { useEffect, useState } from 'react';
import { takePendingDownload } from '@/lib/pending-download';
import { persistPendingRegistration } from '@/lib/pending-registration';

export default function AuthContinuePage() {
  const [message, setMessage] = useState('Anmeldung wird abgeschlossen...');

  useEffect(() => {
    void (async () => {
      await persistPendingRegistration();
      const pending = takePendingDownload();
      if (!pending) {
        window.location.replace('/documents');
        return;
      }

      void fetch(pending.url).then(async (response) => {
        if (!response.ok) throw new Error();
        const blobUrl = URL.createObjectURL(await response.blob());
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = response.headers.get('content-disposition')
          ?.match(/filename="([^"]+)"/)?.[1] ?? 'dazit.pdf';
        anchor.click();
        URL.revokeObjectURL(blobUrl);
        window.location.replace(pending.returnTo);
      }).catch(() => {
        setMessage('Der Download konnte nicht gestartet werden. Sie werden zur Bibliothek zurückgebracht.');
        window.setTimeout(() => window.location.replace(pending.returnTo), 1800);
      });
    })();
  }, []);

  return <main className="auth-continue-page" role="status">{message}</main>;
}