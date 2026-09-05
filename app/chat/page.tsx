import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import ChatClient from "./chat-client";

export default async function ChatPage() {
  const user = await requireSession();
  if (!user) redirect("/login");
  return <ChatClient user={{ name: user.name ?? "Member", email: user.email, image: user.image }} />;
}