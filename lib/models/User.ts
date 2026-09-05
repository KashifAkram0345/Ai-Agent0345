import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema({
  name: { type: String, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  image: { type: String, maxlength: 500 },
  anonymousId: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>("User", userSchema);