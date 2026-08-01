import { permanentRedirect } from 'next/navigation';

export default async function LegacyWorksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/documents/${encodeURIComponent(slug)}`);
}
