import Link from "next/link";

const features = [
  ["01", "Private by design", "Your conversations live in your MongoDB. NOVA never trains on your data."],
  ["02", "Free AI engine", "Use Ollama and your own local or remote model endpoint. No paid AI API required."],
  ["03", "Actually remembers", "Keep a searchable trail of your thinking instead of starting from zero every time."],
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
      <div className="grid-background pointer-events-none absolute inset-0 opacity-70" />
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-7 lg:px-10">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[0.25em] text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lilac text-sm text-ink shadow-glow">N</span>
          NOVA
        </Link>
        <Link href="/login" className="rounded-full border border-line px-5 py-2 text-sm text-slate-300 transition hover:border-lilac hover:text-white">
          Sign in
        </Link>
      </nav>

      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 lg:px-10 lg:pt-28">
        <div className="max-w-4xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-lilac/25 bg-lilac/10 px-3 py-1.5 text-xs font-medium text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_12px_#6ee7b7]" />
            Your thinking, with a little more range
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-8xl">
            An AI agent that
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-mint bg-clip-text text-transparent">stays in the room.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">
            NOVA is a personal AI workspace for ideas, decisions, and the messy middle. Powered by your Ollama model, backed by your MongoDB, and ready whenever you are.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/login" className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-violet-100">
              Start a conversation <span className="ml-2">↗</span>
            </Link>
            <span className="text-sm text-slate-500">Free to run with Ollama</span>
          </div>
        </div>

        <div className="mt-24 grid gap-4 border-t border-line/80 pt-8 md:grid-cols-3">
          {features.map(([number, title, description]) => (
            <div key={number} className="rounded-2xl border border-line/70 bg-panel/60 p-6 backdrop-blur-sm">
              <div className="text-xs font-semibold tracking-[0.2em] text-violet-300">{number}</div>
              <h2 className="mt-9 text-lg font-medium text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}