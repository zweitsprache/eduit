"use client";

import { Button } from '@/components/base/buttons/button';
import { ArrowRight, Edit05, Settings01 } from '@untitledui/icons';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 py-16">
      <div className="max-w-3xl rounded-3xl border border-secondary bg-primary p-10 shadow-xl">
        <p className="mb-4 text-sm font-semibold text-brand-secondary">
          Next.js + Untitled UI + Neon + Auth
        </p>
        <h1 className="text-display-md font-semibold text-primary">
          Your education app foundation is ready.
        </h1>
        <p className="mt-5 text-lg text-tertiary">
          A polished starter built with the real Untitled UI React design system,
          Tiptap editor, Neon Postgres, and NextAuth.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="xl" iconLeading={<Edit05 className="size-5" />} onPress={() => { window.location.href = '/editor'; }}>
            Open Editor
          </Button>
          <Button
            color="secondary"
            size="xl"
            iconLeading={<Edit05 className="size-5" />}
            onPress={() => { window.location.href = '/worksheets'; }}
          >
            Manage worksheets
          </Button>
          <Button
            color="secondary"
            size="xl"
            iconLeading={<Settings01 className="size-5" />}
            onPress={() => { window.location.href = '/admin/brands'; }}
          >
            Manage brands
          </Button>
          <Button
            color="secondary"
            size="xl"
            iconTrailing={<ArrowRight className="size-5" />}
            onPress={() => { window.location.href = 'https://neon.tech'; }}
          >
            Neon Docs
          </Button>
        </div>
      </div>
    </main>
  );
}
