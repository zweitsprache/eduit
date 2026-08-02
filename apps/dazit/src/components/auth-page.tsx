'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle } from '@untitledui/icons';
import { AuthView } from '@neondatabase/auth/react/ui';

export function AuthPage({ path }: { path: string }) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-copy">
          <Link className="auth-backlink" href="/">
            <ArrowLeft aria-hidden="true" />
            Zur Bibliothek
          </Link>
          <span className="auth-eyebrow">Admin-Zugang</span>
          <h1>Dazit verwalten, Materialien pflegen und neue Inhalte veröffentlichen.</h1>
          <p>
            Dieser Bereich ist nur für die Administration gedacht. Melden Sie sich mit Ihrem bestehenden Zugang an,
            um Dokumente, Veröffentlichungen und Automationen zu steuern.
          </p>
          <ul className="auth-points">
            <li><CheckCircle aria-hidden="true" /> Veröffentlichungen für Dazit prüfen und freigeben</li>
            <li><CheckCircle aria-hidden="true" /> Lernkartenserien und Batch-Prozesse ausführen</li>
            <li><CheckCircle aria-hidden="true" /> Inhalte zentral in der Bibliothek verwalten</li>
          </ul>
        </section>
        <div className="auth-card-wrap">
          <div className="auth-card-intro">
            <span className="auth-card-badge">Intern</span>
            <h2>Anmelden</h2>
            <p>Bitte melden Sie sich mit Ihrem Admin-Konto an.</p>
          </div>
          <div className="auth-card">
            <AuthView pathname={path} />
          </div>
        </div>
      </div>
    </main>
  );
}
