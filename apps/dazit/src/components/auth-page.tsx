'use client';

import { AuthView } from '@neondatabase/auth/react/ui';

export function AuthPage({ path }: { path: string }) {
  return (
    <main className="auth-page">
      <AuthView pathname={path} />
    </main>
  );
}
