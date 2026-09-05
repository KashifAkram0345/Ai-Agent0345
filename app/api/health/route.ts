import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const checks = {
    mongodb: false,
    ollama: false,
    auth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET),
  };
  try {
    await connectToDatabase();
    checks.mongodb = true;
  } catch {}
  try {
    const baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(4_000), cache: "no-store" });
    checks.ollama = response.ok;
  } catch {}
  const healthy = checks.mongodb && checks.ollama && checks.auth;
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks, model: process.env.OLLAMA_MODEL || "llama3.2" }, { status: healthy ? 200 : 503 });
}