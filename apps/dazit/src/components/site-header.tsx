'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FilterLines, SearchLg } from '@untitledui/icons';
import { LogOut, Settings, User } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

export function SiteHeader({
  active = 'library',
  search = false,
}: {
  active?: 'home' | 'library';
  search?: boolean;
}) {
  const { data: session } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    window.location.assign('/');
  }

  return (
    <header className={`site-header${search ? '' : ' site-header--simple'}`}>
      <Link className="brand" href="/" aria-label="dazit Bibliothek">
        <Image src="/dazit.svg" alt="DaZit" width={124} height={48} priority />
      </Link>
      <nav aria-label="Hauptnavigation">
        <Link className={active === 'library' ? 'active' : undefined} href="/documents">Bibliothek</Link>
      </nav>
      {search && (
        <label className="header-search">
          <SearchLg aria-hidden="true" />
          <span className="sr-only">Bibliothek durchsuchen</span>
          <input placeholder="Titel oder Stichwort suchen …" />
        </label>
      )}
      {session?.user ? (
        <div className="account-menu">
          <button
            aria-label={`Konto von ${session.user.email} öffnen`}
            className="avatar"
            popoverTarget="dazit-account-menu"
            type="button"
          >
            <User aria-hidden="true" />
          </button>
          <div className="account-popover" id="dazit-account-menu" popover="auto">
            <strong>{session.user.name || session.user.email}</strong>
            <span>{session.user.email}</span>
            <Link className="account-popover-link" href="/account">
              <Settings aria-hidden="true" /> Kontoeinstellungen
            </Link>
            <button onClick={signOut} type="button">
              <LogOut aria-hidden="true" /> Abmelden
            </button>
          </div>
        </div>
      ) : (
        <Link
          aria-label="Anmelden oder registrieren"
          className="avatar"
          href="/auth/sign-in"
        >
          <User aria-hidden="true" />
        </Link>
      )}
      {search && (
        <button
          aria-controls="mobile-filters"
          aria-label="Filter öffnen"
          className="header-filter-trigger"
          onClick={() => window.dispatchEvent(new Event('dazit:open-filters'))}
          type="button"
        >
          <FilterLines />
        </button>
      )}
    </header>
  );
}
