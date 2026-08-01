import Image from 'next/image';
import Link from 'next/link';
import { SearchLg } from '@untitledui/icons';

export function SiteHeader({
  active = 'library',
  search = false,
}: {
  active?: 'home' | 'library';
  search?: boolean;
}) {
  return (
    <header className={`site-header${search ? '' : ' site-header--simple'}`}>
      <Link className="brand" href="/" aria-label="dazit Bibliothek">
        <Image src="/dazit.svg" alt="dazit" width={124} height={48} priority />
      </Link>
      <nav aria-label="Hauptnavigation">
        <Link className={active === 'library' ? 'active' : undefined} href="/documents">Bibliothek</Link>
        <a href="#sammlungen">Sammlungen</a>
        <a href="#my-dazit">My dazit</a>
      </nav>
      {search && (
        <label className="header-search">
          <SearchLg aria-hidden="true" />
          <span className="sr-only">Bibliothek durchsuchen</span>
          <input placeholder="Titel oder Stichwort suchen …" />
        </label>
      )}
      <button className="avatar" type="button" aria-label="Benutzerkonto MK">MK</button>
    </header>
  );
}
