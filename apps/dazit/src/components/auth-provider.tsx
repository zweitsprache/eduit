'use client';

import { AuthUIProvider } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthUIProvider
      apiKey={false}
      authClient={authClient}
      magicLink={false}
      multiSession={false}
      oneTap={false}
      passkey={false}
      redirectTo="/documents"
    >
      {children}
    </AuthUIProvider>
  );
}
