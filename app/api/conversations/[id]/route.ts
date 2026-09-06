import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/session";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    if (!user) return NextResponse.json({ error: "Anonymous session required. Please refresh and try again." }, { status: 401 });
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    const conversation = await Conversation.findOne({ _id: id, userId: user._id }).lean();
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    const messages = await Message.find({ conversationId: id, userId: user._id }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error("Conversation load error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to load this conversation." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    if (!user) return NextResponse.json({ error: "Anonymous session required. Please refresh and try again." }, { status: 401 });
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    const deleted = await Conversation.findOneAndDelete({ _id: id, userId: user._id });
    if (!deleted) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    await Message.deleteMany({ conversationId: id, userId: user._id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Conversation deletion error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to delete this conversation." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    if (!user) return NextResponse.json({ error: "Anonymous session required. Please refresh and try again." }, { status: 401 });
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    const conversation = await Conversation.findOne({ _id: id, userId: user._id });
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    const body = await request.json().catch(() => ({})) as { title?: string; clear?: boolean };
    if (body.clear) {
      await Message.deleteMany({ conversationId: id, userId: user._id });
      conversation.updatedAt = new Date();
      await conversation.save();
      return NextResponse.json({ conversation, cleared: true });
    }
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Conversation title cannot be empty." }, { status: 400 });
    }
    conversation.title = body.title.trim().slice(0, 120);
    conversation.updatedAt = new Date();
    await conversation.save();
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Conversation update error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to update this conversation." }, { status: 500 });
  }
}