// =====================================
// FILE: app/(app)/page.tsx  (Chat Dashboard)
// =====================================
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Trash2, Pencil, Star, User, RotateCcw } from "lucide-react";
import Sidebar from "@/components/sidebar";
import ChatInput from "@/components/chat-input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { getCurrentUser } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import Router from "next/router";

// Types
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export default function ChatDashboard() {

  const router = Router;

  const [navOpen, setNavOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [folders, setFolders] = useState<Record<string, unknown>[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/marketing");
        return;
      };

      const userId = user?.id || null;
      const fullUser = await getCurrentUser();

      setUserId(userId);
      setUser(fullUser);

      const { data: folders, error: fErr } = await supabase
      .from("folders")
      .select("id, custom_name, brand_id, dca_id, session_id, status, created_at")
      .order("created_at", { ascending: false })        // newest first
      .limit(50);                                       // adjust as needed

    if (fErr) {
      console.error("Folders fetch error:", fErr.message);
    } else {
      setFolders(folders || []); // make sure you have setFolders in state
    }
    };
    fetchUser();
  }, []);

  // Auto-scroll handling
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing, autoScroll]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const nearBottom = scrollHeight - (scrollTop + clientHeight) < 80;
    setAutoScroll(nearBottom);
  };

  async function sendMessage(text: string) {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setTyping(true);

    try {
      const res = await fetch("/chat/text", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, newMsg] }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), role: "assistant", content: data.content ?? "(no response)", createdAt: new Date() },
      ]);
    } catch (e) {
      console.error("chat error", e);
    } finally {
      setTyping(false);
    }
  }

  // Preload richer mock messages for scroll + markdown testing
  useEffect(() => {
    if (messages.length === 0) {
      const now = Date.now();
      const mocks: ChatMessage[] = [
        {
          id: "a0",
          role: "assistant",
          createdAt: new Date(now - 60 * 60 * 1000),
          content:
`# Welcome to **BrandOS**  
Complex Markdown demo:

- [x] Checklist item  
- **Bold** and *italic*  
- Inline \`code\`  
- Code block:

\`\`\`js
console.log("Hello World!");
\`\`\`

| Column | Value |
|--------|-------|
| A      | 123   |
| B      | 456   |
`,
        },
        {
          id: "u0",
          role: "user",
          createdAt: new Date(now - 58 * 60 * 1000),
          content: "Looks good, give me more examples with images disabled.",
        },
      ];
      setMessages(mocks);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
        {navOpen && <Sidebar folders={folders} />}

        <div className="flex-1 relative flex flex-col">
          {/* Toggle button — fixed so it isn't affected by scroll */}
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="fixed top-[4.5rem] z-40 p-2 rounded-md hover:bg-[hsl(var(--muted))] transition"
            style={{ left: navOpen ? 300 : 12 }}
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            title={navOpen ? "Close navigation" : "Open navigation"}
          >
            {navOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>

          {/* MessageList */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto px-4 py-10"
          >
            <div className="mx-auto w-full max-w-4xl space-y-12">
              {messages.map((m, i) => (
                <MessageBubble key={m.id} msg={m} prev={messages[i - 1]} />
              ))}
              {typing && <TypingIndicator />}
            </div>
          </div>

          {/* Composer */}
          <div className="bg-[hsl(var(--bg))] sticky bottom-0 px-4 py-5">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                placeholder="Message the assistant…"
                onSubmit={(v) => sendMessage(v)}
              />
              <p className="mt-2 text-[11px] opacity-60">Markdown supported • Images disabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, prev }: { msg: ChatMessage; prev?: ChatMessage }) {
  const isUser = msg.role === "user";
  const showTimeSep = !prev || (msg.createdAt.getTime() - prev.createdAt.getTime()) / 1000 > 900;

  return (
    <div className="my-10">
      {showTimeSep && (
        <div className="text-center text-xs opacity-60 mb-5">
          {msg.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      <div className={cn("flex gap-3 items-start", isUser ? "justify-end" : "justify-start")}>
        {/* Assistant avatar */}
        {!isUser && (
          <div className="w-9 h-9 rounded-full border-hairline bg-glass flex items-center justify-center text-[13px] font-medium">
            AI
          </div>
        )}

        {/* Bubble + actions wrapper */}
        <div className="relative group max-w-full md:max-w-[96%]">
          {isUser ? (
  <div className="rounded-xl px-6 py-4 text-[15px] shadow-soft border-hairline bg-[hsl(var(--muted))] leading-7">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
      {msg.content}
    </ReactMarkdown>
  </div>
) : (
  // Assistant bubble: subtle outline only in light mode
  <div className="rounded-lg bg-glass px-5 py-3 text-[15px] leading-7 border border-gray-200 dark:border-transparent">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
      {msg.content}
    </ReactMarkdown>
  </div>
)}


          {/* Hover actions */}
          {isUser ? (
            <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition mr-[3.75rem]">
              <div className="flex gap-1.5">
                <button className="p-1.5 rounded-md hover:bg-blue-100/60 hover:outline hover:outline-1 hover:outline-blue-400" title="Copy">
                  <Copy className="h-4 w-4 opacity-80" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-yellow-100/60 hover:outline hover:outline-1 hover:outline-yellow-500" title="Edit">
                  <Pencil className="h-4 w-4 text-yellow-500" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-red-100/60 hover:outline hover:outline-1 hover:outline-red-400" title="Delete">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex justify-start opacity-0 group-hover:opacity-100 transition ml-[1.75rem]">
              <div className="flex gap-1.5">
                <button className="p-1.5 rounded-md hover:bg-blue-100/60 hover:outline hover:outline-1 hover:outline-blue-400" title="Copy">
                  <Copy className="h-4 w-4 opacity-80" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-red-100/60 hover:outline hover:outline-1 hover:outline-red-400" title="Delete">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-sky-100/60 hover:outline hover:outline-1 hover:outline-sky-500" title="Redo answer">
                  <RotateCcw className="h-4 w-4 text-sky-600" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-yellow-100/60 hover:outline hover:outline-1 hover:outline-yellow-500" title="Star">
                  <Star className="h-4 w-4 text-yellow-500" style={{ fill: "transparent" }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {isUser && (
          <div className="w-9 h-9 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
            <User className="h-5 w-5 opacity-70" />
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-center opacity-70 px-4 mt-4">
      <div className="w-9 h-9 rounded-full border-hairline bg-glass flex items-center justify-center text-[13px] font-medium">
        AI
      </div>
      <span className="flex gap-1 text-sm mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]"></span>
      </span>
    </div>
  );
}




