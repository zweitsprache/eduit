'use client';

import { type ReactNode } from 'react';
import { useDazitViewer } from '@/lib/auth/use-dazit-viewer';

export function AdminOnly({ children }: { children: ReactNode }) {
  const viewer = useDazitViewer();
  if (!viewer?.isAdmin) return null;
  return <>{children}</>;
}
