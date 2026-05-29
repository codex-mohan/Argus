"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AgentFlowTimeline } from "@/components/agent-flow-timeline.tsx";
import AgentPanel from "@/components/agent-panel.tsx";
import { AuditScoreRing } from "@/components/audit-score-ring.tsx";
import ConvergenceCard from "@/components/convergence-card.tsx";
import { DemoModeToggle } from "@/components/demo-mode-toggle.tsx";
import LensGrid from "@/components/lens-grid.tsx";
import {
  type Signal,
  triggerReplay,
  triggerRun,
  useAgentStatus,
  useEventStream,
  useSignalStream,
} from "@/lib/api.ts";

type DemoMode = "live" | "cached" | "replay";

const LENS_COLORS: Record<string, string> = {
  gtm: "#d4a853",
  finance: "#34d399",
  security: "#f87171",
};

function buildSparklineData(signals: Signal[]) {
  // Bin signals by minute (last 10 minutes)
  const now = Date.now();
  const bins: Record<number, number> = {};
  for (let i = 9; i >= 0; i--) {
    bins[i] = 0;
  }
  for (const s of signals) {
    const age = now - new Date(s.detected_at).getTime();
    const minAgo = Math.floor(age / 60_000);
    if (minAgo < 10) {
      bins[minAgo] = (bins[minAgo] ?? 0) + 1;
    }
  }
  return Object.entries(bins)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([minAgo, count]) => ({
      label: minAgo === "0" ? "now" : `-${minAgo}m`,
      signals: count,
    }));
}

export default function DashboardPage() {
  const { signals, connected, error } = useSignalStream();
  const { agents, error: agentError } = useAgentStatus();
  const { steps, convergence, brief } = useEventStream();
  const [demoMode, setDemoMode] = useState<DemoMode>("live");
  const [running, setRunning] = useState(false);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const sparklineData = useMemo(() => buildSparklineData(signals), [signals]);

  async function handleRun() {
    if (running) {
      return;
    }
    setRunning(true);
    try {
      if (demoMode === "replay") {
        await triggerReplay("nvidia_convergence");
      } else {
        await triggerRun("NVIDIA", demoMode);
      }
    } catch (err) {
      console.error("Run failed:", err);
    } finally {
      setTimeout(() => setRunning(false), 3000);
    }
  }

  // Convergence signal lenses for labeling score rings
  const convergenceSignalLabels = useMemo(() => {
    if (!convergence) {
      return [];
    }
    return convergence.signals.map((s, i) => {
      const text = (s.headline + " " + s.synthesis).toLowerCase();
      if (text.match(/hiring|competitor|product launch|buying intent/)) {
        return "gtm";
      }
      if (text.match(/regulatory|vendor risk|breach|supply chain/)) {
        return "security";
      }
      return "finance";
    });
  }, [convergence]);

  return (
    <div>
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
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
          <DemoModeToggle
            disabled={running}
            mode={demoMode}
            onChange={setDemoMode}
          />
          <button
            className="rounded-md bg-amber-600 px-4 py-2 font-semibold text-white text-xs transition-colors hover:bg-amber-500 disabled:opacity-40"
            disabled={running}
            onClick={handleRun}
            type="button"
          >
            {running ? "Running…" : "Trigger Run"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-red-800 border-b bg-red-950/50 px-6 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ── Convergence Card + Lens Grid ──────────────────────────────────── */}
      <ConvergenceCard signals={signals} />
      <LensGrid signals={signals} />

      {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-0 border-zinc-800 border-b lg:grid-cols-[1fr_300px]">
        {/* Left: Activity + Convergence + Brief */}
        <div className="space-y-6 border-zinc-800 border-r p-6">
          {/* Live Agent Activity */}
          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
              Live Agent Activity
            </h2>
            <AgentFlowTimeline maxSteps={30} steps={steps} />
          </section>

          {/* Signal Trend Sparkline */}
          {signals.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                Signal Inflow (last 10 min)
              </h2>
              <div className="border border-zinc-800 bg-zinc-900/30 p-4">
                <ResponsiveContainer height={80} width="100%">
                  <AreaChart
                    data={sparklineData}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient
                        id="signalGrad"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#d4a853"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#d4a853"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      axisLine={false}
                      dataKey="label"
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
                      content={({ active, payload }) => {
                        if (!(active && payload?.[0])) {
                          return null;
                        }
                        return (
                          <div className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300">
                            {payload[0].payload.label}: {payload[0].value}{" "}
                            signal{Number(payload[0].value) === 1 ? "" : "s"}
                          </div>
                        );
                      }}
                      cursor={{ stroke: "rgba(255,255,255,0.05)" }}
                    />
                    <Area
                      dataKey="signals"
                      dot={false}
                      fill="url(#signalGrad)"
                      stroke="#d4a853"
                      strokeWidth={1.5}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Convergence Score Rings */}
          {convergence && (
            <section>
              <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                {convergence.company} —{" "}
                {convergence.verdict === "converged"
                  ? "Convergence Detected"
                  : "Alert"}
              </h2>
              <div className="flex flex-wrap gap-6">
                <AuditScoreRing
                  label="Composite"
                  score={convergence.compositeScore}
                  verdict={convergence.verdict}
                />
                {convergence.signals.map((sig, i) => {
                  const lensLabel =
                    convergenceSignalLabels[i] ?? `Signal ${i + 1}`;
                  return (
                    <AuditScoreRing
                      key={i}
                      label={lensLabel.toUpperCase()}
                      score={Math.round(sig.confidence * 100)}
                    />
                  );
                })}
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

          {/* Brief */}
          {brief && (
            <section className="border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="mb-1 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                Executive Brief — {brief.company}
              </div>
              <h3 className="mb-3 font-semibold text-sm text-zinc-100 leading-snug">
                {brief.brief.headline}
              </h3>
              <p className="mb-3 text-xs text-zinc-300 leading-relaxed">
                {brief.brief.summary}
              </p>
              <div className="mb-4 space-y-1.5">
                {brief.brief.keyFindings.map((f, i) => (
                  <div className="flex gap-2 text-xs text-zinc-400" key={i}>
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] text-zinc-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Risk
                </span>
                <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all"
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
                <span className="font-mono text-xs text-zinc-300 tabular-nums">
                  {brief.brief.riskScore}/100
                </span>
              </div>
            </section>
          )}
        </div>

        {/* Right: Agent Status + Recent Signals */}
        <div className="space-y-6 bg-zinc-950 p-6">
          {/* Agent Status */}
          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
              Agent Status
            </h2>
            {agentError && (
              <div className="mb-2 text-red-400 text-xs">{agentError}</div>
            )}
            <div className="space-y-2">
              {agents.slice(0, 10).map((agent) => (
                <div
                  className="flex items-center justify-between text-xs"
                  key={agent.id}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        agent.status === "active"
                          ? "animate-pulse bg-emerald-500"
                          : "bg-zinc-600"
                      }`}
                    />
                    <span className="truncate text-zinc-300">{agent.id}</span>
                  </div>
                  <span
                    className={`ml-2 shrink-0 text-[10px] ${agent.status === "active" ? "text-emerald-500" : "text-zinc-600"}`}
                  >
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Signals */}
          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
              Recent Signals
            </h2>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {signals.slice(0, 20).map((signal) => (
                <div
                  className="border-l-2 py-0.5 pl-2.5"
                  key={signal.id}
                  style={{ borderColor: LENS_COLORS[signal.lens] ?? "#d4a853" }}
                >
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span
                      className="rounded px-1 py-0.5 font-bold text-[9px] uppercase"
                      style={{
                        background: `${LENS_COLORS[signal.lens]}20`,
                        color: LENS_COLORS[signal.lens],
                      }}
                    >
                      {signal.lens}
                    </span>
                    <span className="ml-auto text-[9px] text-zinc-600 tabular-nums">
                      {new Date(signal.detected_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-[11px] text-zinc-300 leading-snug">
                    {signal.headline}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-zinc-600">
                    {(signal.confidence * 100).toFixed(0)}% conf
                  </div>
                </div>
              ))}
              {signals.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-600">
                  No signals yet — trigger a run
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Agent Network Panel ───────────────────────────────────────────── */}
      <AgentPanel agents={agents} error={agentError} />
    </div>
  );
}
