'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import { AuthView } from '@neondatabase/auth/react/ui';

function AuthRequiredModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'sign-in' | 'email-otp'>('sign-in');

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose, open]);

  useEffect(() => {
    if (open) setMode('sign-in');
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
          <h2>PDF herunterladen</h2>
          <button
            aria-label="Modal schließen"
            className="auth-required-modal-close"
            onClick={onClose}
            type="button"
          >
            <XClose aria-hidden="true" />
          </button>
        </header>
        <p className="auth-required-modal-copy">
          Bitte melde dich an oder registriere dich, um dieses Dokument herunterzuladen.
        </p>
        <div className="auth-required-modal-switch">
          <button
            className={mode === 'sign-in' ? 'is-active' : ''}
            onClick={() => setMode('sign-in')}
            type="button"
          >
            Anmelden
          </button>
          <button
            className={mode === 'email-otp' ? 'is-active' : ''}
            onClick={() => setMode('email-otp')}
            type="button"
          >
            Registrieren
          </button>
        </div>
        <div className="auth-required-modal-view">
          <AuthView
            classNames={{
              footer: 'auth-required-modal-hide',
              footerLink: 'auth-required-modal-hide',
              form: {
                secondaryButton: 'auth-required-modal-hide',
              },
            }}
            view={mode === 'email-otp' ? 'EMAIL_OTP' : 'SIGN_IN'}
          />
        </div>
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

  if (canDownload && downloadUrl) {
    return (
      <a
        className={className}
        data-variant={dataVariant}
        href={downloadUrl}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }

  return (
    <>
      <button
        className={className}
        data-variant={dataVariant}
        onClick={() => setOpen(true)}
        type="button"
      >
        {children}
      </button>
      <AuthRequiredModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}