"use client";

import type { AgentStatus } from "@/lib/api.ts";

interface AgentPanelProps {
  agents: AgentStatus[];
  error?: string | null;
}

function getAvatarClass(id: string): string {
  if (id.includes("market")) {
    return "bg-gtm-bg text-gtm";
  }
  if (id.includes("filing")) {
    return "bg-finance-bg text-finance";
  }
  if (id.includes("social")) {
    return "bg-truth/10 text-truth";
  }
  if (id.includes("supplier")) {
    return "bg-[rgba(56,189,248,0.1)] text-[#38bdf8]";
  }
  if (id.includes("news")) {
    return "bg-[rgba(251,146,60,0.1)] text-[#fb923c]";
  }
  return "bg-surface-raised text-text-tertiary";
}

function getInitials(id: string): string {
  return id
    .split("-")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AgentPanel({ agents, error }: AgentPanelProps) {
  if (agents.length === 0) {
    return (
      <section className="border-border-subtle border-t px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold text-text-secondary text-xs uppercase tracking-wide">
            Agent Network
          </h2>
        </div>
        <div className="py-4 text-center text-text-muted text-xs">
          {error
            ? `Agent status unavailable: ${error}`
            : "Loading agent status..."}
        </div>
      </section>
    );
  }

  return (
    <section className="border-border-subtle border-t px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display font-semibold text-text-secondary text-xs uppercase tracking-wide">
          Agent Network
        </h2>
        <span className="rounded border border-border-medium bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
          v2.4.1
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
        {agents.map((agent) => (
          <div
            className="flex items-center gap-3 rounded-lg border border-border-subtle bg-base px-3 py-3 transition-all hover:border-border-medium hover:bg-surface-raised"
            key={agent.id}
          >
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-bold font-mono text-[10px] ${getAvatarClass(agent.id)}`}
            >
              {getInitials(agent.id)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-text-primary text-xs">
                {agent.id
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <div className="truncate font-mono text-[10px] text-text-muted">
                {agent.task}
              </div>
            </div>
            <div
              className="ml-auto h-[5px] w-[5px] shrink-0 rounded-full"
              style={{
                background: agent.status === "active" ? "#34d399" : "#555564",
                opacity: agent.status === "active" ? 1 : 0.4,
                boxShadow:
                  agent.status === "active"
                    ? "0 0 6px rgba(52,211,153,0.3)"
                    : "none",
                animation:
                  agent.status === "active"
                    ? "agent-blink 2.5s ease-in-out infinite"
                    : "none",
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
