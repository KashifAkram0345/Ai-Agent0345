import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/auth";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { runAgent } from "@/lib/agent";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = rateLimit(`chat:${user._id}`, 20);
  if (!limit.ok) return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { conversationId?: string; message?: string };
  const content = typeof body.message === "string" ? body.message.trim() : "";
  if (!content || content.length > 10_000) return NextResponse.json({ error: "Message must be between 1 and 10,000 characters." }, { status: 400 });

  let conversation;
  if (body.conversationId) {
    if (!mongoose.isValidObjectId(body.conversationId)) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    conversation = await Conversation.findOne({ _id: body.conversationId, userId: user._id });
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  } else {
    conversation = await Conversation.create({ userId: user._id, title: content.slice(0, 60) });
  }
  const priorMessages = await Message.find({ conversationId: conversation._id, userId: user._id }).sort({ createdAt: 1 }).limit(30);
  await Message.create({ conversationId: conversation._id, userId: user._id, role: "user", content });
  try {
    const answer = await runAgent(content, priorMessages);
    const assistantMessage = await Message.create({ conversationId: conversation._id, userId: user._id, role: "assistant", content: answer });
    if (conversation.title === "New conversation") {
      conversation.title = content.slice(0, 60);
    }
    conversation.updatedAt = new Date();
    await conversation.save();
    return NextResponse.json({ conversationId: conversation._id, message: assistantMessage });
  } catch (error) {
    await Message.deleteOne({ conversationId: conversation._id, userId: user._id, role: "user", content });
    const message = error instanceof Error ? error.message : "The AI provider is unavailable.";
    return NextResponse.json({ error: message, conversationId: conversation._id }, { status: 502 });
  }
}