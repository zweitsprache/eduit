import { redirect } from 'next/navigation';
import { AccountSettings } from '@/components/account-settings';
import { SiteHeader } from '@/components/site-header';
import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { getBillingState } from '@/lib/dazit-billing';
import { getCurrentUsage } from '@/lib/download-entitlements';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentDazitUser();
  if (!user) redirect('/auth/sign-in');

  const [billing, usage] = await Promise.all([
    getBillingState(user.id),
    getCurrentUsage(user.id),
  ]);

  return (
    <>
      <SiteHeader />
      <AccountSettings
        email={user.email}
        initialName={user.name}
        tier={billing.tier}
        hasPolarCustomer={Boolean(billing.polar_customer_id)}
        usage={usage}
      />
    </>
  );
}