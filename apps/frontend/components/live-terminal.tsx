"use client";

import { useEffect, useRef, useState } from "react";
import type { StepEvent } from "@/lib/api.ts";

const AGENT_COLORS: Record<string, string> = {
  "market-data-bot": "#34d399",
  "news-data-bot": "#60a5fa",
  "social-data-bot": "#f472b6",
  "supplier-data-bot": "#fbbf24",
  "filing-data-bot": "#22d3ee",
  normalizer: "#a78bfa",
  "gtm-lens": "#d4a853",
  "finance-lens": "#34d399",
  "security-lens": "#f87171",
  "correlation-engine": "#c084fc",
  "brief-writer": "#818cf8",
};

const STATUS_ICONS: Record<string, string> = {
  running: "▶",
  success: "✓",
  failed: "✗",
  skipped: "–",
};

const STATUS_COLORS: Record<string, string> = {
  running: "#fbbf24",
  success: "#34d399",
  failed: "#f87171",
  skipped: "#52525b",
};

function formatTs(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface Props {
  maxLines?: number;
  steps: StepEvent[];
}

export function LiveTerminal({ steps, maxLines = 200 }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Auto-scroll to bottom on new steps, unless paused
  useEffect(() => {
    if (!paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [steps.length, paused]);

  // Detect when user scrolls up → pause
  function handleScroll() {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setPaused(!atBottom);
  }

  const allAgents = [...new Set(steps.map((s) => s.agentId))].sort();
  const visible = steps
    .slice(-maxLines)
    .filter((s) => filter === "all" || s.agentId === filter);

  return (
    <div className="flex flex-col border border-zinc-800 bg-zinc-950">
      {/* Terminal header bar */}
      <div className="flex items-center justify-between border-zinc-800 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </span>
          <span className="font-mono text-[10px] text-zinc-500">
            argus-run — live terminal
          </span>
          {steps.length > 0 && (
            <span className="font-mono text-[10px] text-zinc-700">
              [{steps.length} events]
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Agent filter */}
          <select
            className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400 focus:outline-none"
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
          >
            <option value="all">all agents</option>
            {allAgents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          {paused && (
            <button
              className="rounded border border-amber-700/50 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400 transition-colors hover:bg-amber-500/20"
              onClick={() => {
                setPaused(false);
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              type="button"
            >
              ↓ Resume
            </button>
          )}
        </div>
      </div>

      {/* Terminal body */}
      <div
        className="h-72 overflow-y-auto font-mono text-[11px] leading-relaxed"
        onScroll={handleScroll}
        ref={containerRef}
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-700">
            <div className="text-xs">$ waiting for pipeline events…</div>
            <div className="animate-pulse text-[10px]">
              Trigger a run to see live output
            </div>
          </div>
        ) : (
          <div className="space-y-0.5 px-3 py-2">
            {visible.map((step, i) => {
              const color = AGENT_COLORS[step.agentId] ?? "#71717a";
              const statusColor = STATUS_COLORS[step.status] ?? "#71717a";
              const icon = STATUS_ICONS[step.status] ?? "·";

              return (
                <div className="group flex gap-2" key={i}>
                  {/* Timestamp */}
                  <span className="shrink-0 text-zinc-700 tabular-nums">
                    {formatTs(step.timestamp)}
                  </span>

                  {/* Status icon */}
                  <span
                    className={`shrink-0 font-bold ${step.status === "running" ? "animate-pulse" : ""}`}
                    style={{ color: statusColor }}
                  >
                    {icon}
                  </span>

                  {/* Agent ID */}
                  <span className="shrink-0 font-bold" style={{ color }}>
                    [{step.agentId}]
                  </span>

                  {/* Label */}
                  <span className="shrink-0 text-zinc-500">{step.label}:</span>

                  {/* Detail — the actual content */}
                  <span
                    className={`flex-1 break-words ${
                      step.status === "running"
                        ? "text-zinc-200"
                        : step.status === "failed"
                          ? "text-red-400"
                          : step.status === "skipped"
                            ? "text-zinc-600"
                            : "text-zinc-300"
                    }`}
                  >
                    {step.detail}
                  </span>

                  {/* Progress */}
                  <span className="shrink-0 text-zinc-700 tabular-nums">
                    {step.progress}%
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
