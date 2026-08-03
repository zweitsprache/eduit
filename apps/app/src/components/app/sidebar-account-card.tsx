'use client';

import {
  CreditCard01,
  DotsVertical,
  LogOut01,
  Settings01,
} from '@untitledui/icons';
import { authClient } from '@/lib/auth/client';
import { useI18n } from '@/components/i18n/locale-provider';

export function SidebarAccountCard() {
  const { t } = useI18n();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  async function signOut() {
    await authClient.signOut();
    window.location.assign('/');
  }

  if (isPending || !user) {
    return (
      <details className="group relative mt-auto border-t border-secondary pt-4">
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-2 outline-none transition hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 space-y-2 text-left">
            <span className="block h-3 w-24 animate-pulse rounded bg-quaternary" />
            <span className="block h-3 w-32 animate-pulse rounded bg-quaternary" />
          </span>
        </summary>
      </details>
    );
  }

  return (
    <details className="group relative mt-auto border-t border-secondary pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg p-2 outline-none transition hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold text-secondary">
            {user.name || t('account.userFallback')}
          </span>
          <span className="block truncate text-xs text-tertiary">{user.email}</span>
        </span>
        <DotsVertical className="size-5 shrink-0 text-fg-quaternary" />
      </summary>

      <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 w-full overflow-hidden rounded-lg border border-secondary bg-primary py-1 shadow-lg">
        <a
          href="/account"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary hover:bg-primary_hover"
        >
          <Settings01 className="size-4.5 text-fg-quaternary" />
          {t('navigation.accountSettings')}
        </a>
        <a
          href="/account#billing"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary hover:bg-primary_hover"
        >
          <CreditCard01 className="size-4.5 text-fg-quaternary" />
          {t('common.billing')}
        </a>
        <div className="my-1 border-t border-secondary" />
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-secondary hover:bg-primary_hover"
        >
          <LogOut01 className="size-4.5 text-fg-quaternary" />
          {t('common.signOut')}
        </button>
      </div>
    </details>
  );
}
