"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type Signal, useSignalStream } from "@/lib/api.ts";

const LENS_COLORS: Record<string, string> = {
  gtm: "#d4a853",
  finance: "#34d399",
  security: "#f87171",
};

function SignalCard({ signal }: { signal: Signal }) {
  const [open, setOpen] = useState(false);
  const lensColor = LENS_COLORS[signal.lens] ?? "#d4a853";

  return (
    <div
      className="cursor-pointer border border-zinc-800 bg-zinc-950 transition-colors hover:border-zinc-700"
      onClick={() => setOpen(!open)}
    >
      <div className="p-3.5" style={{ borderLeft: `3px solid ${lensColor}` }}>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 font-bold text-[10px] uppercase"
            style={{ background: `${lensColor}18`, color: lensColor }}
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
          {/* Confidence pip */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1 w-16 rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${signal.confidence * 100}%`,
                  background: lensColor,
                  opacity: 0.7,
                }}
              />
            </div>
            <span className="font-mono text-[10px] text-zinc-500 tabular-nums">
              {(signal.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 tabular-nums">
            {new Date(signal.detected_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="text-[10px] text-zinc-600">{open ? "−" : "+"}</span>
        </div>
        <h3 className="font-medium text-sm text-zinc-200 leading-snug">
          {signal.headline}
        </h3>
        {!open && (
          <p className="mt-1.5 line-clamp-1 text-xs text-zinc-500 leading-relaxed">
            {signal.synthesis}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-600">
          <span>agent: {signal.agent_id}</span>
        </div>
      </div>
      {open && (
        <div className="border-zinc-800 border-t bg-zinc-900/50 p-4">
          <p className="mb-4 text-xs text-zinc-300 leading-relaxed">
            {signal.synthesis}
          </p>
          {signal.source_urls.length > 0 && (
            <>
              <div className="mb-2 text-[10px] text-zinc-500 uppercase tracking-wider">
                Source URLs
              </div>
              <div className="space-y-1">
                {signal.source_urls.map((u, i) => (
                  <a
                    className="block truncate text-[10px] text-zinc-400 transition-colors hover:text-amber-400"
                    href={u}
                    key={i}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {u}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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

  // Confidence distribution histogram
  const confidenceDistribution = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {
      "40-50%": { gtm: 0, finance: 0, security: 0 },
      "50-60%": { gtm: 0, finance: 0, security: 0 },
      "60-70%": { gtm: 0, finance: 0, security: 0 },
      "70-80%": { gtm: 0, finance: 0, security: 0 },
      "80-90%": { gtm: 0, finance: 0, security: 0 },
      "90-100%": { gtm: 0, finance: 0, security: 0 },
    };
    for (const s of signals) {
      const pct = s.confidence * 100;
      const key =
        pct < 50
          ? "40-50%"
          : pct < 60
            ? "50-60%"
            : pct < 70
              ? "60-70%"
              : pct < 80
                ? "70-80%"
                : pct < 90
                  ? "80-90%"
                  : "90-100%";
      if (buckets[key] && s.lens in buckets[key]) {
        buckets[key][s.lens] = (buckets[key][s.lens] ?? 0) + 1;
      }
    }
    return Object.entries(buckets).map(([range, counts]) => ({
      range,
      ...counts,
    }));
  }, [signals]);

  const gtmCount = signals.filter((s) => s.lens === "gtm").length;
  const financeCount = signals.filter((s) => s.lens === "finance").length;
  const securityCount = signals.filter((s) => s.lens === "security").length;
  const avgConfidence = signals.length
    ? (
        (signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length) *
        100
      ).toFixed(1)
    : "—";

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-zinc-800 border-b px-6 py-4">
        <div>
          <h1 className="font-semibold text-lg text-zinc-100">
            Signal Feed
            <span className="ml-2 font-normal text-sm text-zinc-500">
              ({filtered.length})
            </span>
          </h1>
          <p className="text-[10px] text-zinc-600">
            Live intelligence stream · avg confidence {avgConfidence}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-500" : "bg-red-500"}`}
          />
          <span className="text-[10px] text-zinc-500">
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 border border-red-800 bg-red-950/50 px-3 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      {signals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-zinc-800 border-b px-6 py-4 sm:grid-cols-4">
          {[
            { label: "GTM", value: gtmCount, color: "#d4a853" },
            { label: "Finance", value: financeCount, color: "#34d399" },
            { label: "Security", value: securityCount, color: "#f87171" },
            {
              label: "Avg Confidence",
              value: `${avgConfidence}%`,
              color: "#a1a1aa",
            },
          ].map((stat) => (
            <div className="flex items-center gap-3" key={stat.label}>
              <div
                className="font-bold font-mono text-xl tabular-nums"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Confidence Distribution Chart ──────────────────────────────── */}
      {signals.length >= 3 && (
        <div className="border-zinc-800 border-b px-6 py-4">
          <div className="mb-2 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
            Confidence Distribution by Lens
          </div>
          <ResponsiveContainer height={100} width="100%">
            <BarChart
              data={confidenceDistribution}
              margin={{ top: 0, right: 8, bottom: 0, left: -16 }}
            >
              <XAxis
                axisLine={false}
                dataKey="range"
                tick={{ fill: "#52525b", fontSize: 9 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fill: "#52525b", fontSize: 9 }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!(active && payload?.length)) {
                    return null;
                  }
                  return (
                    <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[10px] text-zinc-300">
                      <div className="mb-1 font-semibold">{label}</div>
                      {payload.map((p) => (
                        <div
                          key={p.dataKey as string}
                          style={{
                            color:
                              LENS_COLORS[p.dataKey as string] ?? "#d4a853",
                          }}
                        >
                          {String(p.dataKey).toUpperCase()}: {p.value}
                        </div>
                      ))}
                    </div>
                  );
                }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar
                dataKey="gtm"
                fill="#d4a853"
                fillOpacity={0.75}
                radius={[0, 0, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="finance"
                fill="#34d399"
                fillOpacity={0.75}
                stackId="a"
              />
              <Bar
                dataKey="security"
                fill="#f87171"
                fillOpacity={0.75}
                radius={[2, 2, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-zinc-800 border-b px-6 py-3">
        {(["all", "gtm", "finance", "security"] as const).map((f) => (
          <button
            className={`rounded-md border px-3 py-1 font-medium text-xs transition-all ${
              filter === f
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
            key={f}
            onClick={() => setFilter(f)}
            type="button"
          >
            {f === "all"
              ? `All (${signals.length})`
              : `${f.toUpperCase()} (${signals.filter((s) => s.lens === f).length})`}
          </button>
        ))}
        <input
          className="ml-auto rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search signals…"
          type="text"
          value={search}
        />
      </div>

      {/* ── Signal List ─────────────────────────────────────────────────── */}
      <div className="space-y-2 p-6">
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-2 text-2xl">📡</div>
            <p className="text-sm text-zinc-600">
              {search
                ? "No signals match your search."
                : "No signals yet. Trigger a run to collect data."}
            </p>
          </div>
        )}
        {filtered.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}
