"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac text-xl font-bold text-ink">N</div>
        <h1 className="mt-6 text-2xl font-semibold text-white">NOVA needs a moment</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">We could not load the workspace. Check your connection and try again.</p>
        <button onClick={reset} className="mt-7 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-violet-100">Try again</button>
      </div>
    </main>
  );
}