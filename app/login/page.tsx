"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="grid-background pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-panel/90 p-8 shadow-glow backdrop-blur-xl sm:p-10">
        <Link href="/" className="text-xs font-semibold tracking-[0.25em] text-slate-500 hover:text-white">← NOVA</Link>
        <div className="mt-14 flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac text-xl font-bold text-ink">N</div>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight text-white">Welcome back.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Sign in to keep your conversations and pick up exactly where you left off.</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/chat" })}
          className="mt-9 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-ink transition hover:bg-violet-100"
        >
          <span className="text-base font-bold">G</span>
          Continue with Google
        </button>
        <p className="mt-7 text-center text-xs leading-5 text-slate-600">Your Google account is only used for authentication. Your AI provider remains configured through OpenRouter.</p>
      </div>
    </main>
  );
}