import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { Conversation } from "@/lib/models/Conversation";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const conversations = await Conversation.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(100).lean();
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!rateLimit(`conversation:${user._id}` , 20).ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { title?: string };
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "New conversation";
  const conversation = await Conversation.create({ userId: user._id, title });
  return NextResponse.json({ conversation }, { status: 201 });
}