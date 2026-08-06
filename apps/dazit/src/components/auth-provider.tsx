'use client';

import { useMemo } from 'react';
import { AuthUIProvider } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const baseURL = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return '';
  }, []);

  return (
    <div className="neon-auth-ui">
      <AuthUIProvider
        apiKey={false}
        authClient={authClient}
        basePath="/auth"
        baseURL={baseURL}
        magicLink={false}
        multiSession={false}
        oneTap={false}
        passkey={false}
        redirectTo="/documents"
      >
        {children}
      </AuthUIProvider>
    </div>
  );
}
