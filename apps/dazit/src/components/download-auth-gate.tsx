'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import { AuthSurface } from '@/components/auth-surface';
import { savePendingDownload } from '@/lib/pending-download';

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
          <p className="auth-required-modal-error" role="alert">{error}</p>
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
  canDownload: boolean;
  className?: string;
  downloadUrl?: string | null;
  dataVariant?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeModal = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const startDownload = async () => {
    if (!downloadUrl) return;
    setError(null);
    if (!canDownload) {
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
        const payload = await response.json().catch(() => null) as { resetsAt?: string } | null;
        const reset = payload?.resetsAt
          ? new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' })
            .format(new Date(payload.resetsAt))
          : 'Mitternacht';
        setError(`Deine drei kostenlosen Downloads sind heute aufgebraucht. Neue Downloads sind ab ${reset} verfügbar.`);
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
    } catch (downloadError) {
      setError(downloadError instanceof Error
        ? downloadError.message
        : 'Das PDF konnte nicht heruntergeladen werden.');
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