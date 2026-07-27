'use client';

import { AuthView } from '@neondatabase/auth/react/ui';

export function AuthPage({ path }: { path: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-6 py-16">
      <AuthView pathname={path} />
    </main>
  );
}
