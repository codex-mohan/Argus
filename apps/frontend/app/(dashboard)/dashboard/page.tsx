"use client";

import { useState } from "react";
import { AgentFlowTimeline } from "@/components/agent-flow-timeline.tsx";
import AgentPanel from "@/components/agent-panel.tsx";
import { AuditScoreRing } from "@/components/audit-score-ring.tsx";
import ConvergenceCard from "@/components/convergence-card.tsx";
import { DemoModeToggle } from "@/components/demo-mode-toggle.tsx";
import LensGrid from "@/components/lens-grid.tsx";
import {
  triggerReplay,
  triggerRun,
  useAgentStatus,
  useEventStream,
  useSignalStream,
} from "@/lib/api.ts";

type DemoMode = "live" | "cached" | "replay";

export default function DashboardPage() {
  const { signals, connected, error } = useSignalStream();
  const { agents, error: agentError } = useAgentStatus();
  const { steps, convergence, brief } = useEventStream();
  const [demoMode, setDemoMode] = useState<DemoMode>("live");
  const [running, setRunning] = useState(false);

  const activeAgents = agents.filter((a) => a.status === "active").length;

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

  return (
    <div>
      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-zinc-800 border-b bg-zinc-950 px-6 py-4">
        <div>
          <h1 className="font-semibold text-lg text-zinc-100">Command Deck</h1>
          <p className="text-xs text-zinc-500">
            {activeAgents} active agents · {signals.length} signals ·{" "}
            {connected ? "Connected" : "Offline"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DemoModeToggle
            disabled={running}
            mode={demoMode}
            onChange={setDemoMode}
          />
          <button
            className="rounded-md bg-amber-600 px-4 py-2 font-semibold text-white text-xs hover:bg-amber-500 disabled:opacity-40"
            disabled={running}
            onClick={handleRun}
            type="button"
          >
            {running ? "Running..." : "Trigger Run"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-red-800 border-b bg-red-950/50 px-6 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ─── Original Components (restored) ─────────────────────────────── */}
      <ConvergenceCard signals={signals} />
      <LensGrid signals={signals} />

      {/* ─── Two-column: Live Activity + Sidebar widgets ────────────────── */}
      <div className="grid grid-cols-1 gap-0 border-zinc-800 border-b lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 border-zinc-800 border-r p-6">
          {/* Live Agent Activity */}
          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
              Live Agent Activity
            </h2>
            <AgentFlowTimeline maxSteps={30} steps={steps} />
          </section>

          {/* Convergence Score Rings */}
          {convergence && (
            <section>
              <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                {convergence.company} —{" "}
                {convergence.verdict === "converged" ? "Convergence" : "Alert"}
              </h2>
              <div className="flex flex-wrap gap-6">
                <AuditScoreRing
                  label="Composite"
                  score={convergence.compositeScore}
                  verdict={convergence.verdict}
                />
                {convergence.signals.map((sig, i) => (
                  <AuditScoreRing
                    key={i}
                    label={`Signal ${i + 1}`}
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

          {/* Brief */}
          {brief && (
            <section>
              <h2 className="mb-2 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
                Executive Brief — {brief.company}
              </h2>
              <h3 className="mb-2 font-semibold text-sm text-zinc-100">
                {brief.brief.headline}
              </h3>
              <p className="mb-3 text-xs text-zinc-300 leading-relaxed">
                {brief.brief.summary}
              </p>
              <div className="mb-3 space-y-1">
                {brief.brief.keyFindings.map((f, i) => (
                  <div className="text-xs text-zinc-400" key={i}>
                    • {f}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Risk
                </span>
                <div className="h-2 w-24 bg-zinc-800">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${brief.brief.riskScore}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-zinc-300">
                  {brief.brief.riskScore}/100
                </span>
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar widgets */}
        <div className="space-y-6 bg-zinc-950 p-6">
          {/* Agent Status */}
          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
              Agent Status
            </h2>
            {agentError && (
              <div className="text-red-400 text-xs">{agentError}</div>
            )}
            <div className="space-y-2">
              {agents.slice(0, 8).map((agent) => (
                <div
                  className="flex items-center justify-between text-xs"
                  key={agent.id}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        agent.status === "active"
                          ? "bg-emerald-500"
                          : "bg-zinc-600"
                      }`}
                    />
                    <span className="text-zinc-300">{agent.id}</span>
                  </div>
                  <span className="text-zinc-500">{agent.status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Signals */}
          <section>
            <h2 className="mb-3 font-semibold text-xs text-zinc-400 uppercase tracking-wider">
              Recent Signals
            </h2>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {signals.slice(0, 15).map((signal) => (
                <div
                  className="border-zinc-700 border-l-2 pl-2"
                  key={signal.id}
                >
                  <div className="font-bold text-[10px] text-zinc-500 uppercase">
                    {signal.lens}
                  </div>
                  <div className="text-xs text-zinc-300">{signal.headline}</div>
                  <div className="text-[10px] text-zinc-600">
                    {(signal.confidence * 100).toFixed(0)}% ·{" "}
                    {new Date(signal.detected_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {signals.length === 0 && (
                <div className="py-4 text-center text-xs text-zinc-600">
                  No signals yet
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ─── Original Agent Network Panel (restored) ────────────────────── */}
      <AgentPanel agents={agents} error={agentError} />
    </div>
  );
}
