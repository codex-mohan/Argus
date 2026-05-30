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

const AGENT_META: Record<
  string,
  { color: string; bg: string; icon: string; category: string }
> = {
  "market-data-bot": {
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    icon: "📈",
    category: "COLLECT",
  },
  "news-data-bot": {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    icon: "📰",
    category: "COLLECT",
  },
  "social-data-bot": {
    color: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    icon: "🔗",
    category: "COLLECT",
  },
  "supplier-data-bot": {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    icon: "🏭",
    category: "COLLECT",
  },
  "filing-data-bot": {
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.08)",
    icon: "📄",
    category: "COLLECT",
  },
  normalizer: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    icon: "⚙️",
    category: "PROCESS",
  },
  "gtm-lens": {
    color: "#d4a853",
    bg: "rgba(212,168,83,0.08)",
    icon: "⌘",
    category: "ANALYZE",
  },
  "finance-lens": {
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    icon: "◈",
    category: "ANALYZE",
  },
  "security-lens": {
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    icon: "◎",
    category: "ANALYZE",
  },
  "correlation-engine": {
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
    icon: "🔀",
    category: "SYNTHESIZE",
  },
  "brief-writer": {
    color: "#818cf8",
    bg: "rgba(129,140,248,0.08)",
    icon: "✍️",
    category: "SYNTHESIZE",
  },
};

const PIPELINE_ORDER = [
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

function statusIcon(status: StepEvent["status"]): string {
  if (status === "running") {
    return "●";
  }
  if (status === "success") {
    return "✓";
  }
  if (status === "failed") {
    return "✗";
  }
  return "–";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) {
    return `${s}s ago`;
  }
  return `${Math.floor(s / 60)}m ago`;
}

export function AgentFlowTimeline({
  steps,
  maxSteps = 50,
}: AgentFlowTimelineProps) {
  // Group by agent, keep latest step per agent
  const agentMap = useMemo(() => {
    const m = new Map<string, StepEvent>();
    for (const step of steps.slice(-maxSteps)) {
      m.set(step.agentId, step);
    }
    return m;
  }, [steps, maxSteps]);

  if (steps.length === 0) {
    return (
      <div className="space-y-2">
        {PIPELINE_ORDER.map((agentId) => {
          const meta = AGENT_META[agentId] ?? {
            color: "#71717a",
            bg: "transparent",
            icon: "·",
            category: "OTHER",
          };
          return (
            <div
              className="flex items-center gap-3 rounded border border-zinc-800 px-3 py-2 opacity-40"
              key={agentId}
            >
              <span className="w-5 text-center text-sm">{meta.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold font-mono text-[10px] uppercase tracking-wide"
                    style={{ color: meta.color }}
                  >
                    {agentId}
                  </span>
                  <span className="text-[9px] text-zinc-700 uppercase tracking-widest">
                    {meta.category}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-zinc-600">
                  Waiting for pipeline run…
                </div>
              </div>
              <div className="h-1 w-16 rounded-full bg-zinc-800" />
            </div>
          );
        })}
      </div>
    );
  }

  // Show agents in pipeline order, then any extras
  const ordered = [
    ...PIPELINE_ORDER.filter((id) => agentMap.has(id)),
    ...[...agentMap.keys()].filter((id) => !PIPELINE_ORDER.includes(id)),
  ];

  return (
    <div className="space-y-1.5">
      {ordered.map((agentId) => {
        const latest = agentMap.get(agentId)!;
        const meta = AGENT_META[agentId] ?? {
          color: "#71717a",
          bg: "rgba(255,255,255,0.03)",
          icon: "·",
          category: "OTHER",
        };
        const isRunning = latest.status === "running";
        const isFailed = latest.status === "failed";

        return (
          <div
            className="rounded border transition-all"
            key={agentId}
            style={{
              borderColor: isRunning
                ? meta.color + "40"
                : isFailed
                  ? "rgba(248,113,113,0.3)"
                  : "rgba(63,63,70,0.6)",
              background: isRunning ? meta.bg : "rgba(9,9,11,0.5)",
            }}
          >
            <div className="flex items-start gap-3 px-3 py-2.5">
              {/* Icon */}
              <span className="mt-0.5 w-5 shrink-0 text-center text-sm">
                {meta.icon}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Header row */}
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="font-bold font-mono text-[10px] uppercase tracking-wide"
                    style={{ color: meta.color }}
                  >
                    {agentId}
                  </span>
                  <span className="shrink-0 text-[9px] text-zinc-700 uppercase tracking-widest">
                    {meta.category}
                  </span>
                  {isRunning && (
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full"
                      style={{ background: meta.color }}
                    />
                  )}
                  <span
                    className={`ml-auto shrink-0 font-mono text-[10px] ${
                      isFailed
                        ? "text-red-400"
                        : isRunning
                          ? "text-amber-400"
                          : latest.status === "skipped"
                            ? "text-zinc-600"
                            : "text-emerald-400"
                    }`}
                  >
                    {statusIcon(latest.status)} {latest.status}
                  </span>
                </div>

                {/* Step label — this is the phase name like "Search", "Scrape", "Analyze" */}
                <div
                  className="mb-0.5 font-semibold text-xs"
                  style={{ color: isRunning ? "#e4e4e7" : "#a1a1aa" }}
                >
                  {latest.label}
                </div>

                {/* Detail — this is where the actual content goes */}
                <div className="break-words text-[11px] text-zinc-400 leading-snug">
                  {latest.detail}
                </div>

                {/* Progress + time */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${latest.progress}%`,
                        background: isFailed
                          ? "#f87171"
                          : latest.status === "skipped"
                            ? "#52525b"
                            : meta.color,
                      }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[9px] text-zinc-600 tabular-nums">
                    {latest.progress}%
                  </span>
                  <span className="shrink-0 text-[9px] text-zinc-700">
                    {timeAgo(latest.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
