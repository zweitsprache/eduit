import { redirect } from 'next/navigation';
import { AccountSettings } from '@/components/account-settings';
import { SiteHeader } from '@/components/site-header';
import { getCurrentDazitUser } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentDazitUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <>
      <SiteHeader />
      <AccountSettings email={user.email} initialName={user.name} />
    </>
  );
}