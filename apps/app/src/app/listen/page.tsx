import { Volume2 } from 'lucide-react';
import { get } from '@vercel/blob';

export const metadata = {
  title: 'Listen — Eduit',
};

// Only ever render <audio> for our own public dialogue-audio proxy route.
function isAllowedAudioSrc(src: string): boolean {
  return src.startsWith('/api/public/dialogue-audio?path=');
}

function audioSrcFromPath(path: string): string | null {
  if (!path.startsWith('dialogue-audio-public/')
    || (!path.endsWith('.mp3') && !path.endsWith('.json'))) {
    return null;
  }
  return `/api/public/dialogue-audio?path=${encodeURIComponent(path)}`;
}

type PlaylistTrack = {
  itemId: string;
  url: string;
  durationSeconds: number;
};

async function loadPlaylist(path: string | undefined) {
  if (!path?.endsWith('.json')) return null;
  if (!path.startsWith('dialogue-audio-public/')) return null;
  try {
    const result = await get(path, { access: 'private', useCache: false });
    if (!result?.stream) return null;
    const value = await new Response(result.stream).json() as { title?: unknown; tracks?: unknown };
    const tracks = Array.isArray(value.tracks)
      ? value.tracks.filter((track): track is PlaylistTrack => (
        Boolean(track)
        && typeof track === 'object'
        && typeof (track as PlaylistTrack).itemId === 'string'
        && typeof (track as PlaylistTrack).url === 'string'
        && (track as PlaylistTrack).url.startsWith('/api/public/dialogue-audio?path=')
      ))
      : [];
    return { title: typeof value.title === 'string' ? value.title : 'Dictation audio', tracks };
  } catch {
    return null;
  }
}

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string; src?: string }>;
}) {
  const { path, src } = await searchParams;
  const playlist = await loadPlaylist(path);
  const audioFromPath = typeof path === 'string' ? audioSrcFromPath(path) : null;
  const audioFromSrc = typeof src === 'string' && isAllowedAudioSrc(src) ? src : null;
  const audioSrc = path?.endsWith('.json') ? null : audioFromPath || audioFromSrc;

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f5f5f4',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#fff',
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <Volume2 size={32} style={{ margin: '0 auto 12px', color: '#57534e' }} />
        <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#57534e' }}>
          {playlist?.title ?? 'Dialogue audio'}
        </p>
        {playlist?.tracks.length ? (
          <div style={{ display: 'grid', gap: '16px', textAlign: 'left' }}>
            {playlist.tracks.map((track, index) => (
              <div key={track.itemId}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#57534e' }}>Item {index + 1}</p>
                <audio controls preload="none" src={track.url} style={{ width: '100%' }} />
              </div>
            ))}
          </div>
        ) : audioSrc ? (
          <audio controls autoPlay preload="auto" src={audioSrc} style={{ width: '100%' }} />
        ) : (
          <p style={{ margin: 0, fontSize: '14px', color: '#a8a29e' }}>
            Audio not found.
          </p>
        )}
      </div>
    </main>
  );
}
