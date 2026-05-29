"use client";

interface DashboardHeaderProps {
  agentCount: number;
  signalCount: number;
}

export default function DashboardHeader({
  agentCount,
  signalCount,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-border-subtle border-b bg-void px-6 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className="relative grid h-8 w-8 place-items-center rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #d4a853, #34d399, #f87171, #d4a853)",
            animation: "rotate-slow 20s linear infinite",
          }}
        >
          <div className="h-3 w-3 rounded-full bg-void" />
        </div>
        <div>
          <div className="font-display font-semibold text-lg text-text-primary tracking-tight">
            Argus
          </div>
          <div className="font-medium text-[10px] text-text-muted uppercase tracking-widest">
            Unified Intelligence
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div
          aria-live="polite"
          className="flex items-center gap-2 font-mono text-[10px] text-text-tertiary tracking-wide"
          role="status"
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "#34d399",
              boxShadow: "0 0 8px rgba(52,211,153,0.3)",
              animation: "pulse-soft 3s ease-in-out infinite",
            }}
          />
          <span>{agentCount} agents active</span>
        </div>
        <div className="font-mono text-[10px] text-text-tertiary tracking-wide">
          {signalCount.toLocaleString()} signals
        </div>
      </div>
    </header>
  );
}
