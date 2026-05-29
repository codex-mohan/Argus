"use client";

import { useState } from "react";
import { useWatchlist } from "@/lib/api.ts";

export default function WatchlistPanel() {
  const { companies, add, remove, loading } = useWatchlist();
  const [input, setInput] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }
    await add(input.trim());
    setInput("");
  };

  return (
    <section className="border-border-subtle border-t px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display font-semibold text-text-secondary text-xs uppercase tracking-wide">
          Watchlist
        </h2>
        <span className="font-mono text-[10px] text-text-muted">
          {companies.length} companies
        </span>
      </div>
      <form className="mb-3 flex gap-2" onSubmit={handleAdd}>
        <input
          className="flex-1 rounded border border-border-subtle bg-base px-3 py-1.5 font-mono text-text-primary text-xs outline-none placeholder:text-text-muted focus:border-border-medium"
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add company..."
          type="text"
          value={input}
        />
        <button
          className="rounded border border-truth/20 bg-truth/10 px-3 py-1.5 font-mono text-truth text-xs transition-colors hover:bg-truth/20 disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {companies.map((company) => (
          <span
            className="inline-flex items-center gap-1.5 rounded border border-border-subtle bg-surface px-2 py-1 font-mono text-[10px] text-text-secondary"
            key={company}
          >
            {company}
            <button
              aria-label={`Remove ${company}`}
              className="text-text-muted transition-colors hover:text-text-primary"
              onClick={() => remove(company)}
            >
              ×
            </button>
          </span>
        ))}
        {companies.length === 0 && (
          <span className="text-text-muted text-xs">
            No companies tracked yet.
          </span>
        )}
      </div>
    </section>
  );
}
