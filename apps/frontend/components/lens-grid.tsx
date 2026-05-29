"use client";

import { useState } from "react";
import type { Signal } from "@/lib/api.ts";

interface LensGridProps {
  signals: Signal[];
}

function MiniSpark({ color }: { color: string }) {
  return (
    <div className="flex h-4 items-end gap-0.5" style={{ color }}>
      {[40, 70, 50, 90, 60].map((h, i) => (
        <span
          className="w-[3px] rounded-sm"
          key={i}
          style={{
            height: `${h}%`,
            background: "currentColor",
            opacity: 0.5,
            animation: "spark-dance 2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) {
    return "just now";
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  return `${Math.floor(hrs / 24)}d ago`;
}

function LensColumn({
  title,
  lens,
  color,
  glow,
  bg,
  signals: lensSignals,
}: {
  title: string;
  lens: string;
  color: string;
  glow: string;
  bg: string;
  signals: Signal[];
}) {
  const [expanded, setExpanded] = useState(false);
  const briefSignals = lensSignals.slice(0, 6);

  return (
    <div className="relative flex flex-col gap-3 border-border-subtle border-r p-5 transition-colors last:border-r-0 hover:bg-white/[0.015]">
      <div className="flex items-center justify-between border-border-subtle border-b pb-2">
        <div className="flex items-center gap-2 font-display font-semibold text-text-secondary text-xs uppercase tracking-wide">
          <div className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${glow}` }} />
          {title}
        </div>
        <div className="rounded border border-border-subtle bg-base px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          {lensSignals.length} new
        </div>
      </div>

      <ul className="flex flex-col">
        {(expanded ? briefSignals : briefSignals.slice(0, 4)).map((s) => (
          <li
            className="group relative cursor-pointer overflow-hidden border-border-subtle border-b px-4 py-3 transition-all hover:translate-x-0.5 hover:bg-white/[0.02]"
            key={s.id}
          >
            <div
              className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r-sm opacity-80 transition-all group-hover:w-1 group-hover:opacity-100"
              style={{ background: color }}
            />
            <div className="mb-1 font-semibold text-sm text-text-primary leading-snug tracking-tight">
              {s.headline}
            </div>
            <div className="mb-2 text-text-secondary text-xs leading-relaxed">
              {s.synthesis}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-border-subtle bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
                {safeHostname(s.source_urls[0] ?? "#")}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {s.agent_id.replace(/-/g, " ")} · {formatTime(s.detected_at)}
              </span>
              <span
                className="ml-auto rounded px-1 py-0.5 font-bold font-mono text-[10px]"
                style={{ background: bg, color }}
              >
                {s.confidence.toFixed(2)}
              </span>
            </div>
          </li>
        ))}
        {lensSignals.length === 0 && (
          <li className="py-8 text-center text-text-muted text-xs">
            No signals yet. Agents are collecting...
          </li>
        )}
      </ul>

      <div className="mt-auto flex items-center justify-between border-border-subtle border-t pt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer text-[10px] text-text-muted tracking-wide transition-colors hover:text-text-primary"
        >
          {expanded ? "Collapse" : `Open ${title.split(" ")[0]} Brief`}
        </button>
        <MiniSpark color={color} />
      </div>
    </div>
  );
}

export default function LensGrid({ signals }: LensGridProps) {
  const gtm = signals.filter((s) => s.lens === "gtm");
  const finance = signals.filter((s) => s.lens === "finance");
  const security = signals.filter((s) => s.lens === "security");

  return (
    <section className="grid grid-cols-1 border-border-subtle border-b lg:grid-cols-[1.4fr_1fr_1.15fr]">
      <LensColumn
        bg="rgba(212,168,83,0.08)"
        color="#d4a853"
        glow="rgba(212,168,83,0.15)"
        lens="gtm"
        signals={gtm}
        title="GTM Lens"
      />
      <LensColumn
        bg="rgba(52,211,153,0.08)"
        color="#34d399"
        glow="rgba(52,211,153,0.15)"
        lens="finance"
        signals={finance}
        title="Finance Lens"
      />
      <LensColumn
        bg="rgba(248,113,113,0.08)"
        color="#f87171"
        glow="rgba(248,113,113,0.15)"
        lens="security"
        signals={security}
        title="Security Lens"
      />
    </section>
  );
}
