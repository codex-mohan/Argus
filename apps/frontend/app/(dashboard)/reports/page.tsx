"use client";

import { useEffect, useState } from "react";

interface Brief {
  company: string;
  generatedAt: string;
  headline: string;
  keyFindings?: string[];
  recommendation?: string;
  riskScore: number;
  summary?: string;
}

export default function ReportsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadBriefs();
  }, []);

  async function loadBriefs() {
    setLoading(true);
    try {
      const res = await fetch("/api/briefs");
      if (!res.ok) {
        throw new Error("Failed to load briefs");
      }
      const data = await res.json();
      setBriefs(data.briefs ?? []);
    } catch {
      setBriefs([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = briefs.filter(
    (b) => !filter || b.company.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-semibold text-lg text-zinc-100">
          Reports & Briefs
          <span className="ml-2 font-normal text-sm text-zinc-500">
            ({filtered.length})
          </span>
        </h1>
        <input
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 placeholder-zinc-600"
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by company..."
          type="text"
          value={filter}
        />
      </div>

      {loading && (
        <div className="flex h-96 items-center justify-center text-sm text-zinc-500">
          Loading briefs...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-zinc-600">
          No briefs generated yet. Trigger a pipeline run to create intelligence
          briefs.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((brief, i) => (
          <BriefCard brief={brief} key={i} />
        ))}
      </div>
    </div>
  );
}

function BriefCard({ brief }: { brief: Brief }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800 bg-zinc-950">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <div>
          <div className="font-medium text-sm text-zinc-200">
            {brief.headline}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-500">
            {brief.company} · {new Date(brief.generatedAt).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500">Risk</span>
            <div className="h-1.5 w-16 bg-zinc-800">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${brief.riskScore}%` }}
              />
            </div>
            <span className="font-mono text-xs text-zinc-300">
              {brief.riskScore}
            </span>
          </div>
          <span className="text-xs text-zinc-500">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-zinc-800 border-t px-4 py-3">
          {brief.summary && (
            <p className="mb-3 text-xs text-zinc-300 leading-relaxed">
              {brief.summary}
            </p>
          )}
          {brief.keyFindings && brief.keyFindings.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-1 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                Key Findings
              </h4>
              <ul className="space-y-1">
                {brief.keyFindings.map((f, i) => (
                  <li className="text-xs text-zinc-400" key={i}>
                    • {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {brief.recommendation && (
            <div>
              <h4 className="mb-1 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                Recommendation
              </h4>
              <p className="text-xs text-zinc-300">{brief.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
