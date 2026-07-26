import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/app-shell';
import { WorksheetManager } from '@/components/worksheets/worksheet-manager';
import { getCurrentAppUser } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <AppShell active="documents" title="Documents" isAdmin={user.isAdmin}>
      <WorksheetManager />
    </AppShell>
  );
}
