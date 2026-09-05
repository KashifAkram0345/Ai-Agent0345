import { requireSession } from "@/lib/session";
import ChatClient from "./chat-client";

export default async function ChatPage() {
  const user = await requireSession();
  if (!user) throw new Error("Unable to create an anonymous workspace session.");
  return <ChatClient user={{ name: "Guest", email: "Anonymous workspace" }} />;
}