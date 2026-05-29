"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { useAuth } from "@/contexts/auth-context.tsx";
import "streamdown/styles.css";

interface ChatMessage {
  content: string;
  id: string;
  role: "user" | "assistant";
  sources?: Array<{
    headline: string;
    lens: string;
    confidence: number;
    url?: string;
  }>;
  timestamp: string;
}

const QUICK_ACTIONS = [
  {
    label: "Generate NVIDIA report",
    icon: "▤",
    query:
      "Generate a full intelligence report on NVIDIA across all three lenses",
  },
  {
    label: "Latest signals",
    icon: "◎",
    query: "Show me the latest signals across my watchlist",
  },
  {
    label: "Cross-lens analysis",
    icon: "◆",
    query: "Give me a cross-lens correlation analysis of all recent signals",
  },
  {
    label: "Supply chain risk",
    icon: "◈",
    query:
      "What supply chain and vendor risks are detected for companies on my watchlist?",
  },
] as const;

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm your Argus intelligence assistant. I can generate structured reports, analyze signals, and correlate findings across all three lenses:\n\n**GTM Lens** -- Competitor moves, hiring signals, buying intent\n**Finance Lens** -- Alpha signals, supply-chain stress, filing divergence\n**Security Lens** -- Vendor risk, regulatory actions, threat intel\n\nWhat would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function sendMessage(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) {
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!text) {
      setInput("");
    }
    setLoading(true);

    try {
      const token = localStorage.getItem("argus_token");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          message,
          history: messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      const errorMsg = data.error ? `Error: ${data.error}` : null;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data.response ?? errorMsg ?? "I couldn't process that request.",
          timestamp: new Date().toISOString(),
          sources: data.sources ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Connection error. Is the backend running on port 3001?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-zinc-800 border-b px-6 py-3">
        <div>
          <h1 className="font-semibold text-sm text-zinc-100">
            Intelligence Assistant
          </h1>
          <p className="text-[10px] text-zinc-500">
            Cross-lens analysis powered by AI/ML API
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-[10px] text-zinc-600">
              Watchlist: {user.watchlist.join(", ") || "None"}
            </span>
          )}
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
            3 Lenses
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="border-zinc-800 border-b px-6 py-3">
          <p className="mb-2 font-semibold text-[10px] text-zinc-600 uppercase tracking-wider">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"
                disabled={loading}
                key={action.label}
                onClick={() => sendMessage(action.query)}
                type="button"
              >
                <span className="text-[10px]">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <div
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              key={msg.id}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-[10px] ${
                  msg.role === "user"
                    ? "bg-zinc-700 text-zinc-300"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {msg.role === "user" ? "You" : "AI"}
              </div>
              <div
                className={`max-w-[85%] ${msg.role === "user" ? "text-right" : ""}`}
              >
                {msg.role === "user" ? (
                  <div className="inline-block rounded-lg bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm text-zinc-300 leading-relaxed">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.sources.map((src, i) => (
                      <div
                        className="flex items-center gap-2 text-[10px] text-zinc-500"
                        key={i}
                      >
                        <span
                          className={`rounded px-1 py-0.5 font-bold text-[9px] uppercase ${
                            src.lens === "gtm"
                              ? "bg-amber-500/10 text-amber-400"
                              : src.lens === "finance"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {src.lens}
                        </span>
                        <span>{src.headline}</span>
                        <span className="text-zinc-600">
                          {(src.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-[10px] text-zinc-700">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-bold text-[10px] text-amber-400">
                AI
              </div>
              <div className="flex items-center gap-1 text-sm text-zinc-500">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-zinc-800 border-t p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            className="max-h-32 flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything: 'Generate a report on NVIDIA' or 'Analyze supply chain risk'"
            rows={1}
            value={input}
          />
          <button
            className="rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white text-xs hover:bg-amber-500 disabled:opacity-40"
            disabled={loading || !input.trim()}
            onClick={() => sendMessage()}
            type="button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
