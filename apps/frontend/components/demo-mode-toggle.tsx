"use client";

type DemoMode = "live" | "cached" | "replay";

interface DemoModeToggleProps {
  disabled?: boolean;
  mode: DemoMode;
  onChange: (mode: DemoMode) => void;
}

const MODES: { id: DemoMode; label: string; sub: string; desc: string }[] = [
  { id: "live",   label: "Live",   sub: "20–60s",   desc: "Real Bright Data + real LLM analysis" },
  { id: "cached", label: "Cached", sub: "5–10s",     desc: "Cached evidence + live LLM analysis" },
  { id: "replay", label: "Replay", sub: "instant",   desc: "Canned scenario for demo safety" },
];

export function DemoModeToggle({ mode, onChange, disabled }: DemoModeToggleProps) {
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div className="flex items-center gap-0 rounded-md border border-zinc-800 overflow-hidden">
      {MODES.map((m) => {
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(m.id)}
            title={`${m.label} · ${m.sub} · ${m.desc}`}
            className={`px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors
              ${isActive
                ? "bg-amber-500/20 text-amber-400 border-r border-amber-500/30 last:border-r-0"
                : "text-zinc-600 hover:text-zinc-300 border-r border-zinc-800 last:border-r-0"
              }
              disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {m.label}
            <span className="ml-1 opacity-40 text-[9px]">{m.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
