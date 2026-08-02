'use client';

import { AuthUIProvider } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="neon-auth-ui">
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
    </div>
  );
}
