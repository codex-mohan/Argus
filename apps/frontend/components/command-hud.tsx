"use client";

import { useState } from "react";
import { queryNetwork } from "@/lib/api.ts";

export default function CommandHud() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    try {
      const res = await queryNetwork(query.trim());
      setResult(res);
    } catch {
      setResult({
        type: "error",
        text: "Query failed. Backend may be unavailable.",
      } as Record<string, unknown>);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="z-50">
      <form
        className="flex items-center gap-4 border-border-subtle border-t bg-void px-6 py-3.5"
        onSubmit={handleSubmit}
      >
        <span className="shrink-0 font-mono text-sm text-truth">›</span>
        <input
          className="flex-1 border-none bg-transparent font-mono text-sm text-text-primary caret-truth outline-none placeholder:text-text-muted"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Query the network... Try: 'signals for NVIDIA' or 'watchlist'"
          type="text"
          value={query}
        />
        <button
          className="rounded border border-truth/20 bg-truth/10 px-2 py-1 font-mono text-[10px] text-truth transition-colors hover:bg-truth/20 disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? "..." : "RUN"}
        </button>
        <div className="flex shrink-0 gap-2">
          <span className="rounded border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
            ENTER
          </span>
        </div>
      </form>
      {result && (
        <div className="max-h-48 overflow-y-auto border-border-subtle border-t bg-surface px-6 py-3 font-mono text-text-secondary text-xs">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
