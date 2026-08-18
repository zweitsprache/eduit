import { notFound } from 'next/navigation';
import { LearnViewer } from '@/app/learn/[token]/learn-viewer';
import type { LearningCardPublicationSnapshot } from '@/lib/learning-card-publication';
import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

type PublicationRow = {
  title: string;
  snapshot: unknown;
  isPublished: boolean;
};

function asSnapshot(value: unknown): LearningCardPublicationSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const snapshot = value as LearningCardPublicationSnapshot;
  if (!Array.isArray(snapshot.items) || !snapshot.items.length) return null;
  return snapshot;
}

type Props = {
  params: Promise<{ token: string }>;
};

export default async function LearnPage({ params }: Props) {
  const { token } = await params;
  if (!token || token.length < 12) notFound();

  const rows = await sql`
    select
      title,
      snapshot,
      is_published as "isPublished"
    from learning_card_publications
    where token = ${token}
    limit 1
  ` as PublicationRow[];

  const publication = rows[0];
  if (!publication?.isPublished) notFound();
  const snapshot = asSnapshot(publication.snapshot);
  if (!snapshot) notFound();

  return (
    <LearnViewer
      cards={snapshot.items}
      title={snapshot.title || publication.title}
    />
  );
}