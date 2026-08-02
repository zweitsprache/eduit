'use client';

import { AuthView } from '@neondatabase/auth/react/ui';

export function AuthPage({ path }: { path: string }) {
  return (
    <main className="auth-page">
      <div className="auth-card auth-card--standalone">
        <AuthView pathname={path} />
      </div>
    </main>
  );
}
