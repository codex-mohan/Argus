"use client";

import { useState } from "react";
import { useSignalStream } from "@/lib/api.ts";

export default function SignalsPage() {
  const { signals, connected, error } = useSignalStream();
  const [filter, setFilter] = useState<"all" | "gtm" | "finance" | "security">(
    "all"
  );
  const [search, setSearch] = useState("");

  const filtered = signals.filter((s) => {
    if (filter !== "all" && s.lens !== filter) {
      return false;
    }
    if (search && !s.headline.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-semibold text-lg text-zinc-100">
          Signals
          <span className="ml-2 font-normal text-sm text-zinc-500">
            ({filtered.length})
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`}
          />
          <span className="text-[10px] text-zinc-500">
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-red-800 bg-red-950/50 px-3 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "gtm", "finance", "security"] as const).map((f) => (
          <button
            className={`rounded-md border px-3 py-1 font-medium text-xs ${
              filter === f
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
            key={f}
            onClick={() => setFilter(f)}
            type="button"
          >
            {f === "all" ? "All" : f.toUpperCase()}
          </button>
        ))}
        <input
          className="ml-auto rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 placeholder-zinc-600"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search signals..."
          type="text"
          value={search}
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-zinc-600">
            {search
              ? "No signals match your search."
              : "No signals yet. Trigger a run to collect data."}
          </div>
        )}
        {filtered.map((signal) => (
          <div
            className="border border-zinc-800 bg-zinc-950 p-3"
            key={signal.id}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 font-bold text-[10px] uppercase ${
                  signal.lens === "gtm"
                    ? "bg-amber-500/20 text-amber-300"
                    : signal.lens === "finance"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                }`}
              >
                {signal.lens}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                  signal.severity === "high" || signal.severity === "critical"
                    ? "bg-red-900/50 text-red-300"
                    : signal.severity === "medium"
                      ? "bg-amber-900/50 text-amber-300"
                      : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {signal.severity}
              </span>
              <span className="ml-auto text-[10px] text-zinc-600">
                {new Date(signal.detected_at).toLocaleTimeString()}
              </span>
            </div>
            <h3 className="font-medium text-sm text-zinc-200">
              {signal.headline}
            </h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              {signal.synthesis}
            </p>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-600">
              <span>confidence: {(signal.confidence * 100).toFixed(0)}%</span>
              <span>agent: {signal.agent_id}</span>
              <a
                className="text-zinc-500 hover:text-zinc-300"
                href={signal.source_urls[0]}
                rel="noopener noreferrer"
                target="_blank"
              >
                source ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
