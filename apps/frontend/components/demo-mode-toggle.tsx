"use client";

type DemoMode = "live" | "cached" | "replay";

interface DemoModeToggleProps {
  disabled?: boolean;
  mode: DemoMode;
  onChange: (mode: DemoMode) => void;
}

const MODES: { id: DemoMode; label: string; sub: string; desc: string }[] = [
  {
    id: "live",
    label: "Live",
    sub: "20–60s",
    desc: "Real Bright Data + real LLM analysis",
  },
  {
    id: "cached",
    label: "Cached",
    sub: "5–10s",
    desc: "Cached evidence + live LLM analysis",
  },
  {
    id: "replay",
    label: "Replay",
    sub: "instant",
    desc: "Canned scenario for demo safety",
  },
];

export function DemoModeToggle({
  mode,
  onChange,
  disabled,
}: DemoModeToggleProps) {
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div className="flex items-center gap-0 overflow-hidden rounded-md border border-zinc-800">
      {MODES.map((m) => {
        const isActive = mode === m.id;
        return (
          <button
            className={`px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              isActive
                ? "border-amber-500/30 border-r bg-amber-500/20 text-amber-400 last:border-r-0"
                : "border-zinc-800 border-r text-zinc-600 last:border-r-0 hover:text-zinc-300"
            }disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={disabled}
            key={m.id}
            onClick={() => !disabled && onChange(m.id)}
            title={`${m.label} · ${m.sub} · ${m.desc}`}
            type="button"
          >
            {m.label}
            <span className="ml-1 text-[9px] opacity-40">{m.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
