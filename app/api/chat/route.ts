import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/session";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { OpenRouterError, runAgent } from "@/lib/agent";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    if (!user) return NextResponse.json({ error: "Anonymous session required. Please refresh and try again." }, { status: 401 });
    const limit = rateLimit(`chat:${user._id}`, 20);
    if (!limit.ok) return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
    const body = await request.json().catch(() => ({})) as { conversationId?: string; message?: string; regenerate?: boolean };

    if (body.regenerate) {
      if (!body.conversationId || !mongoose.isValidObjectId(body.conversationId)) {
        return NextResponse.json({ error: "A valid conversation is required to regenerate an answer." }, { status: 400 });
      }
      const conversation = await Conversation.findOne({ _id: body.conversationId, userId: user._id });
      if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      const storedMessages = await Message.find({ conversationId: conversation._id, userId: user._id }).sort({ createdAt: 1 });
      const lastAssistantIndex = storedMessages.map((message) => message.role).lastIndexOf("assistant");
      const lastUserIndex = storedMessages.slice(0, lastAssistantIndex < 0 ? storedMessages.length : lastAssistantIndex).map((message) => message.role).lastIndexOf("user");
      if (lastUserIndex < 0) return NextResponse.json({ error: "There is no answer to regenerate yet." }, { status: 400 });
      if (lastAssistantIndex >= 0) await Message.deleteOne({ _id: storedMessages[lastAssistantIndex]._id, userId: user._id });
      const answer = await runAgent(storedMessages[lastUserIndex].content, storedMessages.slice(0, lastUserIndex));
      const assistantMessage = await Message.create({ conversationId: conversation._id, userId: user._id, role: "assistant", content: answer });
      conversation.updatedAt = new Date();
      await conversation.save();
      return NextResponse.json({ conversationId: conversation._id, message: assistantMessage });
    }

    const content = typeof body.message === "string" ? body.message.trim() : "";
    if (!content || content.length > 10_000) return NextResponse.json({ error: "Message cannot be empty and must be 10,000 characters or fewer." }, { status: 400 });

    let conversation;
    let createdConversation = false;
    if (body.conversationId) {
      if (!mongoose.isValidObjectId(body.conversationId)) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
      conversation = await Conversation.findOne({ _id: body.conversationId, userId: user._id });
      if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    } else {
      conversation = await Conversation.create({ userId: user._id, title: content.slice(0, 60) });
      createdConversation = true;
    }
    const priorMessages = await Message.find({ conversationId: conversation._id, userId: user._id }).sort({ createdAt: 1 }).limit(30);
    await Message.create({ conversationId: conversation._id, userId: user._id, role: "user", content });
    try {
      const answer = await runAgent(content, priorMessages);
      const assistantMessage = await Message.create({ conversationId: conversation._id, userId: user._id, role: "assistant", content: answer });
      if (conversation.title === "New conversation") conversation.title = content.slice(0, 60);
      conversation.updatedAt = new Date();
      await conversation.save();
      return NextResponse.json({ conversationId: conversation._id, message: assistantMessage });
    } catch (error) {
      await Message.deleteOne({ conversationId: conversation._id, userId: user._id, role: "user", content });
      if (createdConversation) await Conversation.deleteOne({ _id: conversation._id, userId: user._id });
      const status = error instanceof OpenRouterError && error.upstreamStatus === 429 ? 429 : 502;
      const message = error instanceof Error ? error.message : "Unable to connect to the AI service. Please try again.";
      return NextResponse.json({ error: message }, { status });
    }
  } catch (error) {
    console.error("Chat API error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to save or load your conversation. Please try again." }, { status: 500 });
  }
}