"use client";

import type { Signal } from "@/lib/api.ts";

interface SignalRiverProps {
  connected: boolean;
  signals: Signal[];
}

function lensColor(lens: string): string {
  if (lens === "gtm") {
    return "#d4a853";
  }
  if (lens === "finance") {
    return "#34d399";
  }
  if (lens === "security") {
    return "#f87171";
  }
  return "#a78bfa";
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) {
    return "just now";
  }
  if (mins < 60) {
    return `${mins} min ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SignalRiver({ signals, connected }: SignalRiverProps) {
  return (
    <aside className="flex max-h-[320px] flex-col overflow-hidden border-border-subtle border-l bg-base lg:max-h-none">
      <div className="z-10 flex items-center justify-between border-border-subtle border-b bg-base px-5 py-4">
        <div className="font-display font-semibold text-text-secondary text-xs uppercase tracking-wider">
          Live Signals
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-finance">
          <div
            className="h-[5px] w-[5px] rounded-full"
            style={{
              background: connected ? "#34d399" : "#555564",
              animation: connected
                ? "live-pulse 1.5s ease-in-out infinite"
                : "none",
            }}
          />
          {connected ? "STREAMING" : "OFFLINE"}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {signals.slice(0, 50).map((s) => (
          <div
            className="group relative cursor-pointer overflow-hidden border-border-subtle border-b px-5 py-3.5 transition-all hover:translate-x-[3px] hover:bg-white/[0.02]"
            key={s.id}
          >
            <div
              className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-sm opacity-80 transition-all group-hover:w-1"
              style={{ background: lensColor(s.lens) }}
            />
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
              <span style={{ color: lensColor(s.lens) }}>
                {s.lens.toUpperCase()}
              </span>
              <span>·</span>
              <span>{s.agent_id.replace(/-/g, " ")}</span>
            </div>
            <div className="line-clamp-2 text-text-secondary text-xs leading-snug">
              {s.headline}
            </div>
            <div className="mt-1 font-mono text-[10px] text-text-muted">
              {formatTimeAgo(s.detected_at)}
            </div>
          </div>
        ))}
        {signals.length === 0 && (
          <div className="py-8 text-center text-text-muted text-xs">
            No signals yet. Waiting for agents...
          </div>
        )}
      </div>
    </aside>
  );
}
