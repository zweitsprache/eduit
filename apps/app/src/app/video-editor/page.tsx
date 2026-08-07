import { redirect } from 'next/navigation';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { VideoEditorClient } from '@/app/video-editor/video-editor-client';

export const dynamic = 'force-dynamic';

export default async function VideoEditorPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect('/auth/sign-in');

  return <VideoEditorClient />;
}