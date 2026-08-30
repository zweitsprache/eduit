'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import { AuthSurface } from '@/components/auth-surface';
import { savePendingDownload } from '@/lib/pending-download';
import { authClient } from '@/lib/auth/client';

function AuthRequiredModal({
  error,
  open,
  onClose,
}: {
  error?: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-label="Anmeldung erforderlich"
      className="auth-required-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <section className="auth-required-modal" aria-modal="true">
        <header className="auth-required-modal-header">
          <img alt="DaZit" src="/dazit_icon_orange.svg" />
          <button
            aria-label="Modal schließen"
            className="auth-required-modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <XClose aria-hidden="true" />
          </button>
        </header>
        {error ? (
          <div>
            <p className="auth-required-modal-error" role="alert">{error}</p>
            <p><a href="/account">Zum Konto &amp; Upgrade</a></p>
          </div>
        ) : (
          <div className="auth-required-modal-view">
            <AuthSurface showLogo={false} />
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

export function DownloadAuthGate({
  canDownload,
  className,
  downloadUrl,
  dataVariant,
  children,
}: {
  canDownload?: boolean;
  className?: string;
  downloadUrl?: string | null;
  dataVariant?: string;
  children: ReactNode;
}) {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resolvedCanDownload = canDownload ?? Boolean(session?.user);

  const closeModal = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const startDownload = async () => {
    if (!downloadUrl) return;
    setError(null);
    if (!resolvedCanDownload) {
      savePendingDownload(downloadUrl);
      setOpen(true);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(downloadUrl);
      if (response.status === 401) {
        savePendingDownload(downloadUrl);
        setOpen(true);
        return;
      }
      if (response.status === 429) {
        const payload = await response.json().catch(() => null) as {
          tier?: string;
          periodKind?: 'day' | 'month';
          limit?: number;
          resetsAt?: string;
        } | null;
        const reset = payload?.resetsAt
          ? new Intl.DateTimeFormat('de-CH', payload.periodKind === 'month'
            ? { dateStyle: 'medium' }
            : { hour: '2-digit', minute: '2-digit' })
            .format(new Date(payload.resetsAt))
          : null;
        const limit = payload?.limit ?? 1;
        if (payload?.periodKind === 'month') {
          setError(`Sie haben Ihre ${limit} Downloads für diesen Monat aufgebraucht.${reset ? ` Neue Downloads sind ab ${reset} verfügbar.` : ''} Upgraden Sie auf Unlimited für unbegrenzte Downloads.`);
        } else {
          setError(`Ihr${limit === 1 ? '' : 'e'} kostenlose${limit === 1 ? 'r' : 'n'} Download${limit === 1 ? '' : 's'} ${limit === 1 ? 'ist' : 'sind'} heute aufgebraucht.${reset ? ` Neue Downloads sind ab ${reset} verfügbar.` : ''} Upgraden Sie auf Plus oder Unlimited für mehr Downloads.`);
        }
        setOpen(true);
        return;
      }
      if (!response.ok) throw new Error('Das PDF konnte nicht heruntergeladen werden.');

      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = response.headers.get('content-disposition')
        ?.match(/filename="([^"]+)"/)?.[1] ?? 'dazit.pdf';
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError('Das PDF konnte nicht heruntergeladen werden. Bitte versuchen Sie es erneut.');
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={className}
        data-variant={dataVariant}
        disabled={busy || !downloadUrl}
        onClick={startDownload}
        ref={triggerRef}
        type="button"
      >
        {children}
      </button>
      <AuthRequiredModal error={error} open={open} onClose={closeModal} />
    </>
  );
}