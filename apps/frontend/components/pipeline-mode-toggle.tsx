"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export type PipelineMode = "manual" | "scheduled" | "live";

export function PipelineModeToggle() {
  const [mode, setMode] = useState<PipelineMode>("manual");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipeline/mode")
      .then((res) => res.json())
      .then((data) => {
        if (data.mode) {
          setMode(data.mode);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function updateMode(newMode: PipelineMode) {
    setLoading(true);
    setMode(newMode);
    try {
      await fetch("/api/pipeline/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode, interval: 5 }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const MODES: { id: PipelineMode; label: string; sub: string; desc: string }[] = [
    {
      id: "manual",
      label: "Manual",
      sub: "idle",
      desc: "Only runs when Trigger Run is pressed",
    },
    {
      id: "scheduled",
      label: "Every 5m",
      sub: "auto",
      desc: "Runs every 5 minutes in background",
    },
    {
      id: "live",
      label: "Live",
      sub: "1m",
      desc: "Runs every 1 minute continuously",
    },
  ];

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
            } disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={loading}
            key={m.id}
            onClick={() => updateMode(m.id)}
            title={`${m.label} · ${m.desc}`}
            type="button"
          >
            {m.label}
            <span className="ml-1 text-[9px] opacity-40">{m.sub}</span>
          </button>
        );
      })}
      {loading && (
        <div className="px-2">
          <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
        </div>
      )}
    </div>
  );
}
