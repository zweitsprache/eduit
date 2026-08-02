'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FilterLines, SearchLg } from '@untitledui/icons';
import { User } from 'lucide-react';

export function SiteHeader({
  active = 'library',
  canAdminister = false,
  search = false,
}: {
  active?: 'home' | 'library';
  canAdminister?: boolean;
  search?: boolean;
}) {
  return (
    <header className={`site-header${search ? '' : ' site-header--simple'}`}>
      <Link className="brand" href="/" aria-label="dazit Bibliothek">
        <Image src="/dazit.svg" alt="dazit" width={124} height={48} priority />
      </Link>
      <nav aria-label="Hauptnavigation">
        <Link className={active === 'library' ? 'active' : undefined} href="/documents">Bibliothek</Link>
        {canAdminister && <a href="#sammlungen">Sammlungen</a>}
        {canAdminister && <a href="#my-dazit">My dazit</a>}
      </nav>
      {search && (
        <label className="header-search">
          <SearchLg aria-hidden="true" />
          <span className="sr-only">Bibliothek durchsuchen</span>
          <input placeholder="Titel oder Stichwort suchen …" />
        </label>
      )}
      <Link className="avatar" href="/auth/sign-in" aria-label="Admin anmelden">
        <User aria-hidden="true" />
      </Link>
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
