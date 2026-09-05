import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true, maxlength: 30000 },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const Message = (mongoose.models.Message as Model<MessageDocument>) || mongoose.model<MessageDocument>("Message", messageSchema);