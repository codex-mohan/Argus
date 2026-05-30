"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AgentPanel from "@/components/agent-panel.tsx";
import { AuditScoreRing } from "@/components/audit-score-ring.tsx";
import ConvergenceCard from "@/components/convergence-card.tsx";
import { PipelineModeToggle } from "@/components/pipeline-mode-toggle.tsx";
import LensGrid from "@/components/lens-grid.tsx";
import { LiveTerminal } from "@/components/live-terminal.tsx";
import {
  type Signal,
  triggerReplay,
  triggerRun,
  useAgentStatus,
  useSignalStream,
  useWatchlist,
} from "@/lib/api.ts";



const LENS_COLORS = { gtm: "#d4a853", finance: "#34d399", security: "#f87171" };
const SEV_COLORS = {
  critical: "#ef4444",
  high: "#f87171",
  medium: "#fbbf24",
  low: "#6b7280",
};

// ─── Data Builders ───────────────────────────────────────────────────────────

function buildFlowByLens(signals: Signal[]) {
  const now = Date.now();
  const mins = 15;
  const bins: Array<{
    label: string;
    gtm: number;
    finance: number;
    security: number;
  }> = [];
  for (let i = mins - 1; i >= 0; i--) {
    bins.push({
      label: i === 0 ? "now" : i % 3 === 0 ? `-${i}m` : "",
      gtm: 0,
      finance: 0,
      security: 0,
    });
  }
  for (const s of signals) {
    const age = now - new Date(s.detected_at).getTime();
    const idx = Math.min(mins - 1, Math.floor(age / 60_000));
    const bin = bins[mins - 1 - idx];
    if (bin) {
      (bin as unknown as Record<string, number>)[s.lens]++;
    }
  }
  return bins;
}

function buildLensComposition(signals: Signal[]) {
  const total = signals.length || 1;
  return (["gtm", "finance", "security"] as const).map((lens) => {
    const v = signals.filter((s) => s.lens === lens).length;
    return {
      name: lens.toUpperCase(),
      value: v,
      pct: Math.round((v / total) * 100),
      fill: LENS_COLORS[lens],
    };
  });
}

function buildSeverityByLens(signals: Signal[]) {
  return (["gtm", "finance", "security"] as const).map((lens) => {
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
        if (!counts[host]) {
          counts[host] = { count: 0, lens: s.lens };
        }
        counts[host].count++;
      } catch {}
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([domain, { count, lens }]) => ({ domain, count, lens }));
}

function buildConfidenceByAgent(signals: Signal[]) {
  const groups: Record<string, number[]> = {};
  for (const s of signals) {
    if (!groups[s.agent_id]) {
      groups[s.agent_id] = [];
    }
    groups[s.agent_id].push(s.confidence);
  }
  return Object.entries(groups)
    .map(([id, confs]) => ({
      agent: id.replace(/-bot|-lens|-engine|-writer/g, "").replace(/-/g, " "),
      agentId: id,
      avg: Math.round((confs.reduce((s, c) => s + c, 0) / confs.length) * 100),
      count: confs.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 7);
}

function agentColor(id: string) {
  if (id.includes("gtm") || id.includes("market") || id.includes("news")) {
    return "#d4a853";
  }
  if (id.includes("finance") || id.includes("filing")) {
    return "#34d399";
  }
  if (id.includes("security") || id.includes("supplier")) {
    return "#f87171";
  }
  if (id.includes("correlation")) {
    return "#c084fc";
  }
  if (id.includes("social")) {
    return "#f472b6";
  }
  return "#71717a";
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    fill?: string;
  }>;
  label?: string;
}) {
  if (!(active && payload?.length)) {
    return null;
  }
  return (
    <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[10px] shadow-xl">
      {label && <div className="mb-1 font-semibold text-zinc-300">{label}</div>}
      {payload.map((p) => (
        <div className="flex items-center gap-1.5" key={p.name}>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: p.color ?? p.fill ?? "#71717a" }}
          />
          <span className="text-zinc-500">{p.name}:</span>
          <span className="font-mono text-zinc-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Chart Card ─────────────────────────────────────────────────────────

function MiniCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-2 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
        {title}
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
    if (!company) {
      return;
    }
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
    <div>
      <div className="mb-2 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
        Watchlist
      </div>
      <form className="mb-2 flex gap-1.5" onSubmit={handleAdd}>
        <input
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-700 focus:border-zinc-500 focus:outline-none"
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add company… TSMC, AMD"
          type="text"
          value={input}
        />
        <button
          className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-30"
          disabled={loading || !input.trim()}
          type="submit"
        >
          +
        </button>
      </form>
      <div className="space-y-1">
        {companies.length === 0 && (
          <div className="py-1 text-[10px] text-zinc-700">No companies yet</div>
        )}
        {companies.map((c) => (
          <div
            className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/50 px-2 py-1"
            key={c}
          >
            <span className="flex-1 font-mono font-semibold text-[11px] text-zinc-300">
              {c}
            </span>
            <button
              className="rounded border border-amber-600/30 bg-amber-500/10 px-1.5 py-0.5 font-bold text-[9px] text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-40"
              disabled={runningCompany !== null}
              onClick={() => handleRun(c)}
              type="button"
            >
              {runningCompany === c ? "…" : "▶"}
            </button>
            <button
              className="px-1 text-[10px] text-zinc-700 transition-colors hover:text-red-400"
              onClick={() => remove(c)}
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agent Status Strip ───────────────────────────────────────────────────────

const AGENT_ORDER = [
  "market-data-bot",
  "news-data-bot",
  "social-data-bot",
  "supplier-data-bot",
  "filing-data-bot",
  "normalizer",
  "gtm-lens",
  "finance-lens",
  "security-lens",
  "correlation-engine",
  "brief-writer",
];

function AgentStatusStrip({
  agents,
}: {
  agents: Array<{ id: string; status: string }>;
}) {
  const agentMap = new Map(agents.map((a) => [a.id, a.status]));
  return (
    <div className="grid grid-cols-2 gap-1">
      {AGENT_ORDER.map((id) => {
        const status = agentMap.get(id) ?? "idle";
        const active = status === "active";
        return (
          <div className="flex items-center gap-1.5" key={id}>
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "animate-pulse bg-emerald-500" : "bg-zinc-700"}`}
            />
            <span className="truncate text-[10px] text-zinc-500">
              {id.replace(/-bot|-lens|-engine|-writer/g, "")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { signals, steps, convergence, brief, connected, error: streamError } =
    useSignalStream();
  const { agents, error: agentError } = useAgentStatus();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(streamError);

  const activeAgents = agents.filter((a) => a.status === "active").length;

  const flowData = useMemo(() => buildFlowByLens(signals), [signals]);
  const composition = useMemo(() => buildLensComposition(signals), [signals]);
  const severity = useMemo(() => buildSeverityByLens(signals), [signals]);
  const sources = useMemo(() => buildTopSources(signals), [signals]);
  const confidence = useMemo(() => buildConfidenceByAgent(signals), [signals]);

  const convergenceLensLabels = useMemo(() => {
    if (!convergence) {
      return [];
    }
    return convergence.signals.map((s) => {
      const t = (s.headline + s.synthesis).toLowerCase();
      return t.match(/hiring|competitor|buying intent/)
        ? "gtm"
        : t.match(/regulatory|vendor risk|breach/)
          ? "security"
          : "finance";
    });
  }, [convergence]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const company = "NVIDIA";
      await triggerRun(company, "live");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  // KPI strip values
  const gtmCount = signals.filter((s) => s.lens === "gtm").length;
  const finCount = signals.filter((s) => s.lens === "finance").length;
  const secCount = signals.filter((s) => s.lens === "security").length;
  const avgConf = signals.length
    ? (
        (signals.reduce((s, x) => s + x.confidence, 0) / signals.length) *
        100
      ).toFixed(0)
    : "—";

  return (
    <div className="min-w-0">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-zinc-800 border-b bg-zinc-950 px-5 py-2.5">
        {/* Title — never wraps */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap font-semibold text-sm text-zinc-100">
            Command Deck
          </span>
          <span
            className={`whitespace-nowrap text-[10px] ${connected ? "text-emerald-400" : "text-red-400"}`}
          >
            {connected ? "● Live" : "○ Offline"}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px shrink-0 bg-zinc-800" />

        {/* KPI strip — scrolls horizontally if needed, never wraps title */}
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
          {[
            { label: "GTM", value: gtmCount, color: LENS_COLORS.gtm },
            { label: "Finance", value: finCount, color: LENS_COLORS.finance },
            { label: "Security", value: secCount, color: LENS_COLORS.security },
            { label: "Agents", value: `${activeAgents}/11`, color: "#71717a" },
            { label: "Conf", value: `${avgConf}%`, color: "#a1a1aa" },
          ].map((k) => (
            <div className="flex shrink-0 items-center gap-1" key={k.label}>
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                {k.label}
              </span>
              <span
                className="font-bold font-mono text-[11px] tabular-nums"
                style={{ color: k.color }}
              >
                {k.value}
              </span>
            </div>
          ))}
        </div>

        {/* Controls — right side, never shrinks */}
        <div className="flex shrink-0 items-center gap-2">
          <PipelineModeToggle />
          <button
            className="whitespace-nowrap rounded bg-amber-600 px-3 py-1.5 font-semibold text-white text-xs transition-colors hover:bg-amber-500 disabled:opacity-40"
            disabled={running}
            onClick={handleRun}
            type="button"
          >
            {running ? "Running…" : "Trigger Run"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-red-800 border-b bg-red-950/50 px-5 py-1.5 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ── Convergence Card (compact) ───────────────────────────────────────── */}
      <ConvergenceCard signals={signals} />

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN 3-COLUMN LAYOUT — fills width, minimal scroll
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid min-w-0 grid-cols-1 border-zinc-800 border-b md:grid-cols-[1fr_1fr] xl:grid-cols-[2fr_2fr_1fr]">
        {/* ── Col 1: Signal Flow + Live Terminal ────────────────────────────── */}
        <div className="flex min-w-0 flex-col border-zinc-800 border-r">
          {/* Signal Flow chart */}
          <div className="border-zinc-800 border-b px-4 py-3">
            <div className="mb-1.5 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
              Signal Flow — last 15 min
            </div>
            <ResponsiveContainer height={90} width="100%">
              <AreaChart
                data={flowData}
                margin={{ top: 2, right: 4, bottom: 0, left: -24 }}
              >
                <defs>
                  {(["gtm", "finance", "security"] as const).map((l) => (
                    <linearGradient
                      id={`fg-${l}`}
                      key={l}
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={LENS_COLORS[l]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={LENS_COLORS[l]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tick={{ fill: "#3f3f46", fontSize: 8 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "#3f3f46", fontSize: 8 }}
                  tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} />
                <Area
                  dataKey="gtm"
                  dot={false}
                  fill="url(#fg-gtm)"
                  name="GTM"
                  stackId="a"
                  stroke={LENS_COLORS.gtm}
                  strokeWidth={1.5}
                  type="monotone"
                />
                <Area
                  dataKey="finance"
                  dot={false}
                  fill="url(#fg-finance)"
                  name="Finance"
                  stackId="a"
                  stroke={LENS_COLORS.finance}
                  strokeWidth={1.5}
                  type="monotone"
                />
                <Area
                  dataKey="security"
                  dot={false}
                  fill="url(#fg-security)"
                  name="Security"
                  stackId="a"
                  stroke={LENS_COLORS.security}
                  strokeWidth={1.5}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Live Terminal — fills remaining height */}
          <div className="flex flex-1 flex-col px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
                Live Run Terminal
              </div>
              {steps.length > 0 && (
                <span className="font-mono text-[9px] text-zinc-700">
                  · {steps.length} events
                </span>
              )}
            </div>
            <LiveTerminal maxLines={200} steps={steps} />
          </div>

          {/* Convergence scores (compact, horizontal) */}
          {convergence && (
            <div className="border-zinc-800 border-t px-4 py-3">
              <div className="mb-2 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
                {convergence.company} Convergence
              </div>
              <div className="flex flex-wrap gap-4">
                <AuditScoreRing
                  label="Composite"
                  score={convergence.compositeScore}
                  verdict={convergence.verdict}
                />
                {convergence.signals.map((sig, i) => (
                  <AuditScoreRing
                    key={i}
                    label={(
                      convergenceLensLabels[i] ?? `Sig ${i + 1}`
                    ).toUpperCase()}
                    score={Math.round(sig.confidence * 100)}
                  />
                ))}
              </div>
              {convergence.contradictions.map((c, i) => (
                <div className="mt-1 text-[10px] text-red-400" key={i}>
                  ⚠ {c.description} ({c.severity})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Col 2: Charts Grid ──────────────────────────────────────────────── */}
        <div className="min-w-0 border-zinc-800 border-r">
          {/* Charts 2x2 */}
          <div className="grid grid-cols-2 border-zinc-800 border-b">
            {/* Lens Donut */}
            <div className="border-zinc-800 border-r px-3 py-3">
              <div className="mb-1 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
                Lens Split
              </div>
              <div className="relative">
                <ResponsiveContainer height={120} width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={composition}
                      dataKey="value"
                      innerRadius={30}
                      outerRadius={52}
                      paddingAngle={3}
                    >
                      {composition.map((e, i) => (
                        <Cell
                          fill={e.fill}
                          fillOpacity={signals.length ? 0.85 : 0.2}
                          key={i}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!(active && payload?.[0])) {
                          return null;
                        }
                        const d = payload[0].payload as (typeof composition)[0];
                        return (
                          <div className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px]">
                            <span style={{ color: d.fill }}>{d.name}</span> ·{" "}
                            {d.value} ({d.pct}%)
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-bold font-mono text-lg text-zinc-100">
                    {signals.length}
                  </div>
                  <div className="text-[8px] text-zinc-700">signals</div>
                </div>
              </div>
              <div className="mt-1 flex justify-center gap-2">
                {composition.map((d) => (
                  <div className="flex items-center gap-1" key={d.name}>
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: d.fill }}
                    />
                    <span className="text-[9px] text-zinc-600">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity by Lens */}
            <div className="px-3 py-3">
              <div className="mb-1 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
                Severity
              </div>
              <ResponsiveContainer height={140} width="100%">
                <BarChart
                  data={severity}
                  margin={{ top: 2, right: 0, bottom: 0, left: -24 }}
                >
                  <XAxis
                    axisLine={false}
                    dataKey="lens"
                    tick={{ fill: "#52525b", fontSize: 8 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tick={{ fill: "#3f3f46", fontSize: 8 }}
                    tickLine={false}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar
                    dataKey="critical"
                    fill={SEV_COLORS.critical}
                    name="Critical"
                    stackId="a"
                  />
                  <Bar
                    dataKey="high"
                    fill={SEV_COLORS.high}
                    name="High"
                    stackId="a"
                  />
                  <Bar
                    dataKey="medium"
                    fill={SEV_COLORS.medium}
                    name="Medium"
                    stackId="a"
                  />
                  <Bar
                    dataKey="low"
                    fill={SEV_COLORS.low}
                    name="Low"
                    radius={[2, 2, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agent Confidence */}
          <div className="border-zinc-800 border-b px-3 py-3">
            <div className="mb-1 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
              Agent Confidence (%)
            </div>
            <ResponsiveContainer
              height={Math.max(100, confidence.length * 20)}
              width="100%"
            >
              <BarChart
                data={confidence}
                layout="vertical"
                margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
              >
                <XAxis
                  axisLine={false}
                  domain={[0, 100]}
                  tick={{ fill: "#3f3f46", fontSize: 8 }}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="agent"
                  tick={{ fill: "#71717a", fontSize: 8 }}
                  tickLine={false}
                  type="category"
                  width={68}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!(active && payload?.[0])) {
                      return null;
                    }
                    const d = payload[0].payload as (typeof confidence)[0];
                    return (
                      <div className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px]">
                        <div className="mb-0.5 text-zinc-400">{d.agentId}</div>
                        <span className="font-mono text-zinc-200">
                          {d.avg}%
                        </span>{" "}
                        · {d.count} signals
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                />
                <Bar dataKey="avg" radius={[0, 2, 2, 0]}>
                  {confidence.map((e, i) => (
                    <Cell
                      fill={agentColor(e.agentId)}
                      fillOpacity={0.75}
                      key={i}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Sources */}
          <div className="px-3 py-3">
            <div className="mb-1 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
              Top Sources
            </div>
            {sources.length > 0 ? (
              <ResponsiveContainer
                height={Math.max(80, sources.length * 18)}
                width="100%"
              >
                <BarChart
                  data={sources}
                  layout="vertical"
                  margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
                >
                  <XAxis
                    axisLine={false}
                    tick={{ fill: "#3f3f46", fontSize: 8 }}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="domain"
                    tick={{ fill: "#71717a", fontSize: 8 }}
                    tickLine={false}
                    type="category"
                    width={90}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!(active && payload?.[0])) {
                        return null;
                      }
                      const d = payload[0].payload as (typeof sources)[0];
                      return (
                        <div className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px]">
                          <span
                            className="uppercase"
                            style={{
                              color:
                                LENS_COLORS[
                                  d.lens as keyof typeof LENS_COLORS
                                ] ?? "#71717a",
                            }}
                          >
                            {d.lens}
                          </span>{" "}
                          · {d.count} signals
                        </div>
                      );
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                    {sources.map((e, i) => (
                      <Cell
                        fill={
                          LENS_COLORS[e.lens as keyof typeof LENS_COLORS] ??
                          "#71717a"
                        }
                        fillOpacity={0.7}
                        key={i}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-4 text-center text-[10px] text-zinc-700">
                Sources appear after signals are collected
              </div>
            )}
          </div>

          {/* Brief (inline, compact) */}
          {brief && (
            <div className="border-zinc-800 border-t px-3 py-3">
              <div className="mb-1 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
                Executive Brief — {brief.company}
              </div>
              <div className="mb-1 font-semibold text-xs text-zinc-100 leading-snug">
                {brief.brief.headline}
              </div>
              <p className="mb-2 line-clamp-3 text-[10px] text-zinc-400 leading-relaxed">
                {brief.brief.summary}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-600 uppercase">Risk</span>
                <div className="h-1 flex-1 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${brief.brief.riskScore}%`,
                      background:
                        brief.brief.riskScore >= 75
                          ? "#f87171"
                          : brief.brief.riskScore >= 50
                            ? "#d4a853"
                            : "#34d399",
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] text-zinc-300">
                  {brief.brief.riskScore}/100
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Col 3: Watchlist + Agents + Recent Signals ──────────────────────── */}
        <div className="hidden min-w-0 flex-col gap-0 divide-y divide-zinc-800 xl:flex">
          {/* Watchlist */}
          <div className="px-4 py-3">
            <WatchlistWidget demoMode={demoMode} />
          </div>

          {/* Agent pipeline status — compact 2-col grid */}
          <div className="px-4 py-3">
            <div className="mb-2 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
              Pipeline · {activeAgents} active
            </div>
            <AgentStatusStrip agents={agents} />
            {agentError && (
              <div className="mt-1 text-[10px] text-red-400">{agentError}</div>
            )}
          </div>

          {/* Recent signals feed */}
          <div className="flex flex-1 flex-col px-4 py-3">
            <div className="mb-2 font-semibold text-[9px] text-zinc-600 uppercase tracking-widest">
              Recent Signals
            </div>
            <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
              {signals.slice(0, 30).map((s) => (
                <div
                  className="border-l-2 py-0.5 pl-2"
                  key={s.id}
                  style={{ borderColor: LENS_COLORS[s.lens] ?? "#d4a853" }}
                >
                  <div className="mb-0.5 flex items-center gap-1">
                    <span
                      className="rounded px-1 py-0.5 font-bold text-[8px] uppercase"
                      style={{
                        background: `${LENS_COLORS[s.lens]}18`,
                        color: LENS_COLORS[s.lens],
                      }}
                    >
                      {s.lens}
                    </span>
                    <span className="ml-auto font-mono text-[8px] text-zinc-700 tabular-nums">
                      {new Date(s.detected_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-[10px] text-zinc-300 leading-snug">
                    {s.headline}
                  </div>
                  <div className="mt-0.5 font-mono text-[8px] text-zinc-700">
                    {(s.confidence * 100).toFixed(0)}% conf
                  </div>
                </div>
              ))}
              {signals.length === 0 && (
                <div className="py-4 text-center text-[10px] text-zinc-700">
                  No signals yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lens Signal Grid ────────────────────────────────────────────────── */}
      <LensGrid signals={signals} />

      <AgentPanel agents={agents} error={agentError} />
    </div>
  );
}
