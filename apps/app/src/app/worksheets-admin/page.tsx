import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/app-shell';
import { WorksheetsAdminTable } from '@/components/admin/worksheets-admin-table';
import { getCurrentAppUser } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function WorksheetsAdminPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect('/auth/sign-in');
  if (!user.isAdmin) redirect('/documents');

  return (
    <AppShell active="worksheets-admin" title="Worksheets" isAdmin>
      <WorksheetsAdminTable />
    </AppShell>
  );
}
