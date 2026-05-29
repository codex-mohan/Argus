"use client";

import { useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AgentFlowTimeline } from "@/components/agent-flow-timeline.tsx";
import AgentPanel from "@/components/agent-panel.tsx";
import { AuditScoreRing } from "@/components/audit-score-ring.tsx";
import ConvergenceCard from "@/components/convergence-card.tsx";
import { LiveTerminal } from "@/components/live-terminal.tsx";
import { DemoModeToggle } from "@/components/demo-mode-toggle.tsx";
import LensGrid from "@/components/lens-grid.tsx";
import {
  type Signal,
  addToWatchlist,
  removeFromWatchlist,
  triggerReplay,
  triggerRun,
  useAgentStatus,
  useEventStream,
  useSignalStream,
  useWatchlist,
} from "@/lib/api.ts";

type DemoMode = "live" | "cached" | "replay";

const LENS_COLORS = { gtm: "#d4a853", finance: "#34d399", security: "#f87171" };
const SEV_COLORS = {
  critical: "#ef4444",
  high: "#f87171",
  medium: "#fbbf24",
  low: "#6b7280",
};

// ─── Chart Data Builders ─────────────────────────────────────────────────────

function buildFlowByLens(signals: Signal[]) {
  const now = Date.now();
  const mins = 15;
  const bins: Array<{ label: string; gtm: number; finance: number; security: number }> = [];
  for (let i = mins - 1; i >= 0; i--) {
    bins.push({ label: i === 0 ? "now" : `-${i}m`, gtm: 0, finance: 0, security: 0 });
  }
  for (const s of signals) {
    const age = now - new Date(s.detected_at).getTime();
    const idx = Math.min(mins - 1, Math.floor(age / 60_000));
    const bin = bins[mins - 1 - idx];
    if (bin && s.lens in bin) {
      (bin as unknown as Record<string, number>)[s.lens]++;
    }
  }
  return bins;
}

function buildLensComposition(signals: Signal[]) {
  const gtm = signals.filter((s) => s.lens === "gtm").length;
  const finance = signals.filter((s) => s.lens === "finance").length;
  const security = signals.filter((s) => s.lens === "security").length;
  const total = signals.length || 1;
  return [
    { name: "GTM", value: gtm, pct: Math.round((gtm / total) * 100), fill: LENS_COLORS.gtm },
    { name: "Finance", value: finance, pct: Math.round((finance / total) * 100), fill: LENS_COLORS.finance },
    { name: "Security", value: security, pct: Math.round((security / total) * 100), fill: LENS_COLORS.security },
  ];
}

function buildSeverityByLens(signals: Signal[]) {
  const lenses = ["gtm", "finance", "security"] as const;
  return lenses.map((lens) => {
    const ls = signals.filter((s) => s.lens === lens);
    return {
      lens: lens.toUpperCase(),
      critical: ls.filter((s) => s.severity === "critical").length,
      high: ls.filter((s) => s.severity === "high").length,
      medium: ls.filter((s) => s.severity === "medium").length,
      low: ls.filter((s) => s.severity === "low").length,
    };
  });
}

function buildTopSources(signals: Signal[]) {
  const counts: Record<string, { count: number; lens: string }> = {};
  for (const s of signals) {
    for (const url of s.source_urls) {
      try {
        const host = new URL(url).hostname.replace("www.", "");
        if (!counts[host]) counts[host] = { count: 0, lens: s.lens };
        counts[host].count++;
      } catch {}
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([domain, { count, lens }]) => ({ domain, count, lens }));
}

function buildConfidenceByAgent(signals: Signal[]) {
  const agentGroups: Record<string, number[]> = {};
  for (const s of signals) {
    if (!agentGroups[s.agent_id]) agentGroups[s.agent_id] = [];
    agentGroups[s.agent_id].push(s.confidence);
  }
  return Object.entries(agentGroups)
    .map(([agent, confs]) => ({
      agent: agent.replace(/-/g, " ").replace(/bot|lens|engine|writer/gi, "").trim() || agent,
      agentId: agent,
      avg: Math.round((confs.reduce((s, c) => s + c, 0) / confs.length) * 100),
      count: confs.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8);
}

function agentColor(agentId: string): string {
  if (agentId.includes("gtm") || agentId.includes("market") || agentId.includes("news")) return "#d4a853";
  if (agentId.includes("finance") || agentId.includes("filing")) return "#34d399";
  if (agentId.includes("security") || agentId.includes("supplier")) return "#f87171";
  if (agentId.includes("correlation")) return "#c084fc";
  if (agentId.includes("social")) return "#f472b6";
  return "#71717a";
}

// ─── Tooltip helpers ──────────────────────────────────────────────────────────

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; fill?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] shadow-xl">
      {label && <div className="mb-1.5 font-semibold text-zinc-300">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: p.color ?? p.fill ?? "#71717a" }}
          />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-mono font-semibold text-zinc-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-zinc-800 bg-zinc-900/40 p-4 ${className}`}>
      <div className="mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{title}</div>
        {subtitle && <div className="mt-0.5 text-[10px] text-zinc-700">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Watchlist Widget ─────────────────────────────────────────────────────────

function WatchlistWidget({ demoMode }: { demoMode: string }) {
  const { companies, add, remove, loading } = useWatchlist();
  const [input, setInput] = useState("");
  const [runningCompany, setRunningCompany] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const company = input.trim().toUpperCase();
    if (!company) return;
    await add(company);
    setInput("");
  }

  async function handleRun(company: string) {
    setRunningCompany(company);
    try {
      await triggerRun(company, demoMode);
    } catch {}
    setTimeout(() => setRunningCompany(null), 4000);
  }

  return (
    <section>
      <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
        Watchlist
      </h2>

      {/* Add company form */}
      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add company… (e.g. TSMC)"
          className="flex-1 min-w-0 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded border border-zinc-700 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-30 transition-colors"
        >
          {loading ? "…" : "+"}
        </button>
      </form>

      {/* Company list */}
      {companies.length === 0 ? (
        <div className="py-3 text-center text-[11px] text-zinc-700">
          No companies on watchlist yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {companies.map((company) => (
            <div
              key={company}
              className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/50 px-2.5 py-2"
            >
              <span className="flex-1 font-mono text-xs font-semibold text-zinc-200">{company}</span>
              {/* Run button */}
              <button
                type="button"
                onClick={() => handleRun(company)}
                disabled={runningCompany !== null}
                title={`Run pipeline for ${company}`}
                className="rounded border border-amber-600/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
              >
                {runningCompany === company ? "Running…" : "▶ Run"}
              </button>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => remove(company)}
                title={`Remove ${company}`}
                className="rounded px-1.5 py-0.5 text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { signals, connected, error } = useSignalStream();
  const { agents, error: agentError } = useAgentStatus();
  const { steps, convergence, brief } = useEventStream();
  const [demoMode, setDemoMode] = useState<DemoMode>("live");
  const [running, setRunning] = useState(false);

  const activeAgents = agents.filter((a) => a.status === "active").length;

  // Chart data — all derived from live signal stream
  const flowData = useMemo(() => buildFlowByLens(signals), [signals]);
  const compositionData = useMemo(() => buildLensComposition(signals), [signals]);
  const severityData = useMemo(() => buildSeverityByLens(signals), [signals]);
  const sourcesData = useMemo(() => buildTopSources(signals), [signals]);
  const confidenceData = useMemo(() => buildConfidenceByAgent(signals), [signals]);

  const convergenceSignalLabels = useMemo(() => {
    if (!convergence) return [];
    return convergence.signals.map((s) => {
      const text = (s.headline + " " + s.synthesis).toLowerCase();
      if (text.match(/hiring|competitor|product launch|buying intent/)) return "gtm";
      if (text.match(/regulatory|vendor risk|breach|supply chain/)) return "security";
      return "finance";
    });
  }, [convergence]);

  async function handleRun() {
    if (running) return;
    setRunning(true);
    try {
      if (demoMode === "replay") await triggerReplay("nvidia_convergence");
      else await triggerRun("NVIDIA", demoMode);
    } catch (err) {
      console.error("Run failed:", err);
    } finally {
      setTimeout(() => setRunning(false), 3000);
    }
  }

  const hasData = signals.length > 0;

  return (
    <div>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-zinc-800 border-b bg-zinc-950 px-6 py-4">
        <div>
          <h1 className="font-semibold text-lg text-zinc-100">Command Deck</h1>
          <p className="text-xs text-zinc-500">
            {activeAgents} active agents · {signals.length} signals ·{" "}
            <span className={connected ? "text-emerald-400" : "text-red-400"}>
              {connected ? "● Live" : "○ Offline"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DemoModeToggle disabled={running} mode={demoMode} onChange={setDemoMode} />
          <button
            className="rounded-md bg-amber-600 px-4 py-2 font-semibold text-white text-xs hover:bg-amber-500 disabled:opacity-40 transition-colors"
            disabled={running}
            onClick={handleRun}
            type="button"
          >
            {running ? "Running…" : "Trigger Run"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-red-800 border-b bg-red-950/50 px-6 py-2 text-red-400 text-xs">{error}</div>
      )}

      {/* ── Convergence Card ─────────────────────────────────────────────── */}
      <ConvergenceCard signals={signals} />

      {/* ── Intelligence Analytics ────────────────────────────────────────── */}
      <section className="border-zinc-800 border-b px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">Intelligence Analytics</h2>
            <p className="mt-0.5 text-[10px] text-zinc-700">Live signal stream · {signals.length} signals across {compositionData.filter(d=>d.value>0).length} active lenses</p>
          </div>
          {!hasData && (
            <span className="rounded border border-zinc-800 px-2 py-1 text-[10px] text-zinc-600">
              Trigger a run to populate charts
            </span>
          )}
        </div>

        {/* Row 1: Signal Flow (full width) */}
        <ChartCard
          title="Signal Flow by Lens — last 15 minutes"
          subtitle="How many signals each lens produced per minute"
          className="mb-4"
        >
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={flowData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                {(["gtm", "finance", "security"] as const).map((lens) => (
                  <linearGradient key={lens} id={`grad-${lens}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LENS_COLORS[lens]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={LENS_COLORS[lens]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="label" tick={{ fill: "#52525b", fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fill: "#52525b", fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="gtm" name="GTM" stackId="a" stroke={LENS_COLORS.gtm} fill={`url(#grad-gtm)`} strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="finance" name="Finance" stackId="a" stroke={LENS_COLORS.finance} fill={`url(#grad-finance)`} strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="security" name="Security" stackId="a" stroke={LENS_COLORS.security} fill={`url(#grad-security)`} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row 2: 3 charts side by side */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-4">

          {/* Chart 2: Lens Composition Donut */}
          <ChartCard title="Lens Composition" subtitle="Share of signals by intelligence lens">
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {compositionData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} fillOpacity={hasData ? 0.85 : 0.2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload as (typeof compositionData)[0];
                      return (
                        <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px]">
                          <div style={{ color: d.fill }} className="font-bold">{d.name}</div>
                          <div className="text-zinc-400">{d.value} signals · {d.pct}%</div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-bold font-mono text-2xl text-zinc-100">{signals.length}</div>
                <div className="text-[9px] text-zinc-600 uppercase tracking-wider">signals</div>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-2 flex justify-center gap-4">
              {compositionData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  <span className="text-[10px] text-zinc-500">{d.name} <span className="font-mono text-zinc-400">{d.pct}%</span></span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Chart 3: Severity Distribution by Lens */}
          <ChartCard title="Severity Distribution" subtitle="Signal urgency breakdown per lens">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={severityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="lens" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#52525b", fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="critical" name="Critical" stackId="a" fill={SEV_COLORS.critical} radius={[0,0,0,0]} />
                <Bar dataKey="high" name="High" stackId="a" fill={SEV_COLORS.high} />
                <Bar dataKey="medium" name="Medium" stackId="a" fill={SEV_COLORS.medium} />
                <Bar dataKey="low" name="Low" stackId="a" fill={SEV_COLORS.low} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-1.5 flex justify-center gap-3">
              {(["critical","high","medium","low"] as const).map((sev) => (
                <div key={sev} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: SEV_COLORS[sev] }} />
                  <span className="text-[9px] text-zinc-600 capitalize">{sev}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Chart 4: Agent Confidence Scores */}
          <ChartCard title="Agent Confidence" subtitle="Average confidence score per agent (%)">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={confidenceData}
                layout="vertical"
                margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
              >
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="agent"
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as (typeof confidenceData)[0];
                    return (
                      <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px]">
                        <div className="font-semibold text-zinc-200 mb-1">{d.agentId}</div>
                        <div className="text-zinc-400">Avg confidence: <span className="font-mono text-zinc-200">{d.avg}%</span></div>
                        <div className="text-zinc-600">{d.count} signals</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="avg" name="Confidence %" radius={[0, 3, 3, 0]}>
                  {confidenceData.map((entry, i) => (
                    <Cell key={i} fill={agentColor(entry.agentId)} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Top Source Domains (full width) */}
        <ChartCard
          title="Top Data Sources"
          subtitle="Domains that produced the most intelligence signals — colored by primary lens"
        >
          {sourcesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={sourcesData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fill: "#52525b", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="domain"
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as (typeof sourcesData)[0];
                    return (
                      <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px]">
                        <div className="font-mono font-semibold text-zinc-200 mb-1">{d.domain}</div>
                        <div style={{ color: LENS_COLORS[d.lens as keyof typeof LENS_COLORS] ?? "#71717a" }} className="uppercase text-[10px]">{d.lens} lens</div>
                        <div className="text-zinc-400">{d.count} signal{d.count !== 1 ? "s" : ""}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name="Signals" radius={[0, 3, 3, 0]}>
                  {sourcesData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={LENS_COLORS[entry.lens as keyof typeof LENS_COLORS] ?? "#71717a"}
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-20 items-center justify-center text-[11px] text-zinc-700">
              Source domains will appear here once signals are collected
            </div>
          )}
        </ChartCard>
      </section>

      {/* ── Lens Signal Grid ──────────────────────────────────────────────── */}
      <LensGrid signals={signals} />

      {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-0 border-zinc-800 border-b min-w-0 xl:grid-cols-[1fr_300px]">
        {/* Left: Pipeline Activity + Live Terminal + Convergence + Brief */}
        <div className="space-y-5 border-zinc-800 border-r p-6">
          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
              Pipeline Activity
            </h2>
            <AgentFlowTimeline maxSteps={30} steps={steps} />
          </section>

          {/* Live Terminal — real-time event stream */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">Live Run Terminal</h2>
              {steps.length > 0 && (
                <span className="font-mono text-[10px] text-zinc-600">{steps.length} events</span>
              )}
            </div>
            <LiveTerminal steps={steps} maxLines={200} />
          </section>

          {convergence && (
            <section>
              <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                {convergence.company} — {convergence.verdict === "converged" ? "Convergence" : "Alert"}
              </h2>
              <div className="flex flex-wrap gap-5">
                <AuditScoreRing label="Composite" score={convergence.compositeScore} verdict={convergence.verdict} />
                {convergence.signals.map((sig, i) => (
                  <AuditScoreRing
                    key={i}
                    label={(convergenceSignalLabels[i] ?? `Signal ${i + 1}`).toUpperCase()}
                    score={Math.round(sig.confidence * 100)}
                  />
                ))}
              </div>
              {convergence.contradictions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {convergence.contradictions.map((c, i) => (
                    <div className="text-red-400 text-xs" key={i}>
                      ⚠ {c.lensA} vs {c.lensB}: {c.description} ({c.severity})
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {brief && (
            <section className="border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Executive Brief — {brief.company}
              </div>
              <h3 className="mb-3 font-semibold text-sm text-zinc-100 leading-snug">
                {brief.brief.headline}
              </h3>
              <p className="mb-3 text-xs text-zinc-300 leading-relaxed">{brief.brief.summary}</p>
              <div className="mb-4 space-y-1.5">
                {brief.brief.keyFindings.map((f, i) => (
                  <div className="flex gap-2 text-xs text-zinc-400" key={i}>
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] text-zinc-600">{String(i + 1).padStart(2, "0")}</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Risk</span>
                <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${brief.brief.riskScore}%`,
                      background: brief.brief.riskScore >= 75 ? "#f87171" : brief.brief.riskScore >= 50 ? "#d4a853" : "#34d399",
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-zinc-300 tabular-nums">{brief.brief.riskScore}/100</span>
              </div>
            </section>
          )}
        </div>

        {/* Right: Watchlist + Agent Status + Recent Signals */}
        <div className="space-y-5 bg-zinc-950 p-5">

          {/* ── Watchlist Widget ─────────────────────────────────────── */}
          <WatchlistWidget demoMode={demoMode} />

          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">Agent Status</h2>
            {agentError && <div className="text-red-400 text-xs mb-2">{agentError}</div>}
            <div className="space-y-2">
              {agents.slice(0, 10).map((agent) => (
                <div className="flex items-center justify-between text-xs" key={agent.id}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
                    <span className="text-zinc-300 truncate">{agent.id}</span>
                  </div>
                  <span className={`ml-2 shrink-0 text-[10px] ${agent.status === "active" ? "text-emerald-500" : "text-zinc-600"}`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">Recent Signals</h2>
            <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
              {signals.slice(0, 20).map((signal) => (
                <div
                  className="border-l-2 pl-2.5 py-0.5"
                  key={signal.id}
                  style={{ borderColor: LENS_COLORS[signal.lens] ?? "#d4a853" }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="rounded px-1 py-0.5 font-bold text-[9px] uppercase"
                      style={{ background: `${LENS_COLORS[signal.lens]}20`, color: LENS_COLORS[signal.lens] }}
                    >
                      {signal.lens}
                    </span>
                    <span className="text-[9px] text-zinc-600 ml-auto tabular-nums">
                      {new Date(signal.detected_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-300 leading-snug line-clamp-2">{signal.headline}</div>
                  <div className="mt-0.5 font-mono text-[9px] text-zinc-600">{(signal.confidence * 100).toFixed(0)}% conf</div>
                </div>
              ))}
              {signals.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-600">No signals yet — trigger a run</div>
              )}
            </div>
          </section>
        </div>
      </div>

      <AgentPanel agents={agents} error={agentError} />
    </div>
  );
}
