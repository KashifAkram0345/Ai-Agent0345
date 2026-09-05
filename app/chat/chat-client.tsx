"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { MarkdownMessage } from "@/components/markdown-message";

type Conversation = { _id: string; title: string; updatedAt: string };
type Message = { _id: string; role: "user" | "assistant"; content: string; createdAt: string };
type Props = { user: { name: string; email?: string; image?: string | null } };

export default function ChatClient({ user }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function loadConversations() {
    const response = await fetch("/api/conversations");
    if (!response.ok) return;
    const data = await response.json();
    setConversations(data.conversations);
  }

  async function openConversation(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) return;
    const data = await response.json();
    setMessages(data.messages);
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setError("");
    setSidebarOpen(false);
  }

  async function deleteConversation(id: string) {
    const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setConversations((items) => items.filter((item) => item._id !== id));
    if (activeId === id) newChat();
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    setError("");
    const optimistic: Message = { _id: `temp-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() };
    setMessages((items) => [...items, optimistic]);
    setLoading(true);
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeId, message: content }) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setActiveId(data.conversationId);
    setMessages((items) => [...items, data.message]);
    await loadConversations();
  }

  return (
    <main className="flex h-screen overflow-hidden bg-ink">
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-20 flex w-80 flex-col border-r border-line bg-panel transition-transform md:relative md:translate-x-0`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.25em]"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lilac text-ink">N</span>NOVA</div>
          <button className="text-slate-500 md:hidden" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div className="p-4">
          <button onClick={newChat} className="flex w-full items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-violet-400/60 hover:bg-white/[0.06]"><span>New conversation</span><span className="text-lg text-violet-300">＋</span></button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <div className="px-3 pb-3 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-600">Your conversations</div>
          {conversations.map((conversation) => (
            <div key={conversation._id} className={`group mb-1 flex items-center rounded-lg ${activeId === conversation._id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}>
              <button onClick={() => openConversation(conversation._id)} className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm text-slate-300">{conversation.title}</button>
              <button onClick={() => deleteConversation(conversation._id)} aria-label="Delete conversation" className="mr-2 hidden text-xs text-slate-600 hover:text-red-300 group-hover:block">⌫</button>
            </div>
          ))}
          {!conversations.length && <p className="px-3 py-4 text-sm leading-6 text-slate-600">Your saved conversations will appear here.</p>}
        </div>
        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            {user.image ? <img src={user.image} alt="" className="h-9 w-9 rounded-full" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-400/20 text-sm text-violet-200">{user.name[0]}</div>}
            <div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-slate-500 hover:text-white">Exit</button>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[73px] items-center border-b border-line px-5 md:px-8">
          <button onClick={() => setSidebarOpen(true)} className="mr-4 text-slate-400 md:hidden">☰</button>
          <div><p className="text-sm font-medium text-white">{activeId ? conversations.find((item) => item._id === activeId)?.title : "New conversation"}</p><p className="mt-1 text-xs text-slate-600">Ollama · private workspace</p></div>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> ready</div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-6 pb-20">
              <span className="mb-6 text-5xl text-violet-300/80">✦</span>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Where should we start?</h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-500">Ask NOVA to think with you, work through a decision, or turn a rough idea into a clear next step.</p>
              <div className="mt-9 flex flex-wrap gap-2 text-xs text-slate-400"><span className="rounded-full border border-line px-3 py-2">“Help me plan…”</span><span className="rounded-full border border-line px-3 py-2">“Think through…”</span><span className="rounded-full border border-line px-3 py-2">“Calculate…”</span></div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
              {messages.map((message) => <div key={message._id} className={`mb-8 flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lilac text-xs font-bold text-ink">N</div>}
                <div className={message.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-md bg-violet-500/15 px-4 py-3 text-sm leading-7 text-violet-50" : "min-w-0 flex-1 pt-1"}>{message.role === "assistant" ? <MarkdownMessage content={message.content} /> : message.content}</div>
              </div>)}
              {loading && <div className="flex items-center gap-4 text-sm text-slate-500"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lilac text-xs font-bold text-ink">N</div><span className="flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300 [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300 [animation-delay:240ms]" /></span></div>}
              {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        <div className="mx-auto w-full max-w-3xl px-5 pb-5 md:px-8 md:pb-8">
          <div className="rounded-2xl border border-line bg-panel p-2 shadow-glow focus-within:border-violet-400/50">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Message NOVA…" rows={1} className="max-h-40 min-h-[48px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600" />
            <div className="flex items-center justify-between px-2 pb-1"><span className="text-[0.65rem] text-slate-600">Enter to send · Shift + Enter for a new line</span><button onClick={() => void sendMessage()} disabled={!input.trim() || loading} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-30">↑</button></div>
          </div>
          <p className="mt-3 text-center text-[0.65rem] text-slate-700">NOVA can make mistakes. Check important information.</p>
        </div>
      </section>
    </main>
  );
}