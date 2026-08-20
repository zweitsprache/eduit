import { Volume2 } from 'lucide-react';

export const metadata = {
  title: 'Listen — Eduit',
};

// Only ever render <audio> for our own public blob storage URLs.
function isAllowedAudioSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const { src } = await searchParams;
  const audioSrc = typeof src === 'string' && isAllowedAudioSrc(src) ? src : null;

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
          Dialogue audio
        </p>
        {audioSrc ? (
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
