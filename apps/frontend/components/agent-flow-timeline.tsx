"use client";

import { useMemo } from "react";

export interface StepEvent {
  agentId: string;
  detail: string;
  label: string;
  lens?: string;
  progress: number;
  status: "running" | "success" | "failed" | "skipped";
  step: number;
  timestamp: string;
}

interface AgentFlowTimelineProps {
  maxSteps?: number;
  steps: StepEvent[];
}

const AGENT_COLORS: Record<string, string> = {
  "market-data-bot": "text-emerald-400",
  "news-data-bot": "text-blue-400",
  "social-data-bot": "text-pink-400",
  "supplier-data-bot": "text-amber-400",
  "filing-data-bot": "text-cyan-400",
  "gtm-lens": "text-amber-300",
  "finance-lens": "text-emerald-300",
  "security-lens": "text-red-300",
  "correlation-engine": "text-violet-300",
  "brief-writer": "text-indigo-300",
  normalizer: "text-zinc-300",
};

export function AgentFlowTimeline({
  steps,
  maxSteps = 50,
}: AgentFlowTimelineProps) {
  const grouped = useMemo(() => {
    const byAgent = new Map<string, StepEvent[]>();
    for (const step of steps.slice(-maxSteps)) {
      const list = byAgent.get(step.agentId) ?? [];
      list.push(step);
      byAgent.set(step.agentId, list);
    }
    return byAgent;
  }, [steps, maxSteps]);

  if (steps.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
        No active pipeline runs. Add a company to watchlist or trigger a replay.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">
          Live Agent Activity
        </h3>
        <span className="text-xs text-zinc-500">{steps.length} steps</span>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {Array.from(grouped.entries()).map(([agentId, agentSteps]) => {
          const latest = agentSteps[agentSteps.length - 1]!;
          const colorClass = AGENT_COLORS[agentId] ?? "text-zinc-300";
          const isRunning = latest.status === "running";

          return (
            <div
              className={`relative overflow-hidden border-l-2 ${
                isRunning
                  ? "border-l-amber-500 bg-amber-500/5"
                  : "border-l-zinc-700 bg-zinc-900/30"
              } px-3 py-2 transition-all`}
              key={agentId}
            >
              <div className="flex items-center gap-2">
                <span className={`font-bold font-mono text-xs ${colorClass}`}>
                  {agentId.replace("-", " ").toUpperCase()}
                </span>
                {latest.lens && (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase tracking-wider">
                    {latest.lens}
                  </span>
                )}
                {isRunning && (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                )}
              </div>

              <div className="mt-1 text-xs text-zinc-300">{latest.label}</div>
              <div className="truncate text-[11px] text-zinc-500">
                {latest.detail}
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1 w-full bg-zinc-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    latest.status === "failed"
                      ? "bg-red-500"
                      : latest.status === "success"
                        ? "bg-emerald-500"
                        : latest.status === "skipped"
                          ? "bg-zinc-600"
                          : "bg-amber-500"
                  }`}
                  style={{ width: `${latest.progress}%` }}
                />
              </div>

              {/* Step counter */}
              <div className="mt-1 text-right text-[10px] text-zinc-600">
                step {latest.step} • {latest.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
