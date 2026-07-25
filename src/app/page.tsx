export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_50%)] px-6 py-16">
      <div className="max-w-3xl rounded-3xl border border-white/10 bg-slate-900/70 p-10 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
          Next.js + Untitled UI + Neon + Auth
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Your education app foundation is ready.
        </h1>
        <p className="mt-5 text-lg text-slate-300">
          This starter includes a polished layout, Tailwind styling, and the core dependencies for Neon Database and authentication integration.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="https://nextjs.org" className="rounded-full bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500">
            Next.js Docs
          </a>
          <a href="https://neon.tech" className="rounded-full border border-white/15 px-5 py-3 font-medium text-slate-100 transition hover:bg-white/10">
            Neon Docs
          </a>
        </div>
      </div>
    </main>
  );
}
