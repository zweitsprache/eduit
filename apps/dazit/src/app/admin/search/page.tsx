import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { getDazitSearchStats } from '@/lib/db';

export const revalidate = 300;

export default async function SearchDashboard() {
  const user = await getCurrentDazitUser();
  if (!user?.isAdmin) redirect('/auth/sign-in');
  const stats = await getDazitSearchStats();
  return <>
    <SiteHeader active="library" />
    <main className="legal-shell">
      <h1>Suchanfragen</h1>
      <p className="lead">Anonyme Suchanfragen der letzten 12 Monate.</p>
      <h2>Häufig gesucht</h2>
      <ul>{stats.popular.map((row) => <li key={row.query}><strong>{row.query}</strong> · {row.searches}</li>)}</ul>
      <h2>Ohne Treffer</h2>
      <ul>{stats.zeroResults.map((row) => <li key={row.query}><strong>{row.query}</strong> · {row.searches}</li>)}</ul>
    </main>
  </>;
}
