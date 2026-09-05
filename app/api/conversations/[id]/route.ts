import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/auth";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await requireSession();
  const { id } = await context.params;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  const conversation = await Conversation.findOne({ _id: id, userId: user._id }).lean();
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  const messages = await Message.find({ conversationId: id, userId: user._id }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ conversation, messages });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await requireSession();
  const { id } = await context.params;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  const deleted = await Conversation.findOneAndDelete({ _id: id, userId: user._id });
  if (!deleted) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  await Message.deleteMany({ conversationId: id, userId: user._id });
  return NextResponse.json({ ok: true });
}