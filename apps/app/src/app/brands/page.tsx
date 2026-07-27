import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app/app-shell';
import { BrandProfilesAdmin } from '@/components/admin/brand-profiles-admin';
import { getCurrentAppUser } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect('/auth/sign-in');
  if (!user.isAdmin) redirect('/documents');

  return (
    <AppShell active="brands" title="Brand Profiles" isAdmin>
      <BrandProfilesAdmin />
    </AppShell>
  );
}
