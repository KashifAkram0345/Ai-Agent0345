import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const checks = {
    mongodb: false,
    openrouter: false,
    auth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET),
  };
  try {
    await connectToDatabase();
    checks.mongodb = true;
  } catch {}
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
        signal: AbortSignal.timeout(4_000),
        cache: "no-store",
      });
      checks.openrouter = response.ok;
    } catch {}
  }
  const healthy = checks.mongodb && checks.openrouter && checks.auth;
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks, model: process.env.OPENROUTER_MODEL || "openrouter/free" }, { status: healthy ? 200 : 503 });
}