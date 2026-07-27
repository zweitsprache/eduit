import { redirect } from 'next/navigation';
import { AccountManager } from '@/components/auth/account-manager';
import { auth } from '@/lib/auth/server';
import { getBillingState } from '@/lib/billing';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/auth/sign-in');

  const billing = await getBillingState(session.user.id);

  return (
    <AccountManager
      email={session.user.email}
      initialName={session.user.name}
      tier={billing.tier}
      subscriptionStatus={billing.subscription_status}
      currentPeriodEnd={billing.current_period_end
        ? new Date(billing.current_period_end).toISOString()
        : null}
    />
  );
}
