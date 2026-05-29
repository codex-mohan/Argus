"use client";

type DemoMode = "live" | "cached" | "replay";

interface DemoModeToggleProps {
  disabled?: boolean;
  mode: DemoMode;
  onChange: (mode: DemoMode) => void;
}

export function DemoModeToggle({
  mode,
  onChange,
  disabled,
}: DemoModeToggleProps) {
  const modes: { id: DemoMode; label: string; sub: string; desc: string }[] = [
    {
      id: "live",
      label: "LIVE",
      sub: "20–60s",
      desc: "Real Bright Data + real LLM analysis",
    },
    {
      id: "cached",
      label: "CACHED",
      sub: "5–10s",
      desc: "Cached evidence + live LLM analysis",
    },
    {
      id: "replay",
      label: "REPLAY",
      sub: "instant",
      desc: "Canned scenario for demo safety",
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {modes.map((m) => {
          const active = mode === m.id;
          return (
            <button
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                active
                  ? "border-amber-500 bg-amber-500/20 text-white"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={disabled}
              key={m.id}
              onClick={() => !disabled && onChange(m.id)}
              title={`${m.label} · ${m.sub} · ${m.desc}`}
              type="button"
            >
              {m.label} <span className="opacity-60">· {m.sub}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-zinc-600">
        {modes.find((m) => m.id === mode)?.desc}
      </p>
    </div>
  );
}
