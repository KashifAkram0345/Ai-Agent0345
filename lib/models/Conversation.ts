import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const conversationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120, default: "New conversation" },
}, { timestamps: true });

conversationSchema.index({ userId: 1, updatedAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const Conversation = (mongoose.models.Conversation as Model<ConversationDocument>) || mongoose.model<ConversationDocument>("Conversation", conversationSchema);