"use client";

import { useEffect, useState, useMemo } from "react";
import { AuditScoreRing } from "@/components/audit-score-ring.tsx";

interface Brief {
  company: string;
  headline: string;
  riskScore: number;
  generatedAt: string;
  summary: string;
  keyFindings: string[];
  recommendation: string;
  sources?: string[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function ReportsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => { loadBriefs(); }, []);

  async function loadBriefs() {
    setLoading(true);
    try {
      const res = await fetch("/api/briefs");
      const data = await res.json();
      setBriefs(data.briefs ?? []);
    } catch { setBriefs([]);
    } finally { setLoading(false); }
  }

  const brief = useMemo(() => briefs[selected], [briefs, selected]);
  const companies = useMemo(() => [...new Set(briefs.map((b) => b.company))], [briefs]);

  const metricBreakdown = useMemo(() => {
    if (!brief) return [];
    // Simulate per-lens metrics from key findings
    const gtm = brief.keyFindings?.filter((f) => f.toLowerCase().match(/gtm|hiring|competitor|product|launch|buying/i)) ?? [];
    const finance = brief.keyFindings?.filter((f) => f.toLowerCase().match(/finance|price|guidance|earnings|filing|revenue/i)) ?? [];
    const security = brief.keyFindings?.filter((f) => f.toLowerCase().match(/security|risk|vendor|regulatory|breach|supply/i)) ?? [];
    return [
      { lens: "GTM", count: gtm.length, color: "#d4a853", bg: "rgba(212,168,83,0.08)" },
      { lens: "Finance", count: finance.length, color: "#34d399", bg: "rgba(52,211,153,0.08)" },
      { lens: "Security", count: security.length, color: "#f87171", bg: "rgba(248,113,113,0.08)" },
    ];
  }, [brief]);

  const signalsTotal = metricBreakdown.reduce((s, m) => s + m.count, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading reports...
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <h1 className="mb-2 font-bold text-lg text-zinc-100">No Reports Yet</h1>
        <p className="mb-6 text-sm text-zinc-500">Trigger a pipeline run to generate intelligence briefs.</p>
        <button
          type="button"
          onClick={async () => {
            try { await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: "NVIDIA", mode: "live" }) }); } catch {}
            setTimeout(loadBriefs, 30000);
          }}
          className="rounded bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500"
        >
          Trigger Pipeline Run
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-zinc-800 border-b px-6 py-4">
        <div>
          <h1 className="font-semibold text-sm text-zinc-100">Intelligence Reports</h1>
          <p className="text-[10px] text-zinc-500">{briefs.length} reports across {companies.length} companies</p>
        </div>
        <div className="flex gap-2">
          {companies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                const idx = briefs.findIndex((b) => b.company === c);
                if (idx >= 0) setSelected(idx);
              }}
              className={`rounded px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                brief?.company === c ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "text-zinc-500 border border-zinc-800 hover:text-zinc-300"
              }`}
            >
              {c}
            </button>
          ))}
          <button type="button" onClick={loadBriefs} className="rounded border border-zinc-700 px-3 py-1 text-[10px] text-zinc-400 hover:text-zinc-200">Refresh</button>
        </div>
      </div>

      {brief && (
        <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
          {/* KPI Tiles */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Signals", value: signalsTotal, sub: "extracted" },
              { label: "Sources Scraped", value: brief.keyFindings?.length ?? 0, sub: "unique domains" },
              { label: "Data Freshness", value: `${Math.round((Date.now() - new Date(brief.generatedAt).getTime()) / 60000)}m`, sub: "age of report" },
              { label: "Risk Score", value: brief.riskScore, sub: "composite" },
            ].map((tile) => (
              <div key={tile.label} className="border border-zinc-800 bg-zinc-900/50 p-4 argus-tile-bump">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{tile.label}</div>
                <div className="font-bold font-mono text-2xl text-zinc-100">{tile.value}</div>
                <div className="mt-0.5 text-[10px] text-zinc-600">{tile.sub}</div>
              </div>
            ))}
          </div>

          {/* Score Rings */}
          <div className="border border-zinc-800 bg-zinc-900/30 p-6">
            <h3 className="mb-4 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">Risk Dimensions</h3>
            <div className="flex flex-wrap justify-center gap-8">
              {metricBreakdown.map((m) => (
                <AuditScoreRing
                  key={m.lens}
                  score={Math.round((m.count / Math.max(1, signalsTotal)) * 100)}
                  label={m.lens}
                  verdict={m.count > 3 ? "high" : m.count > 0 ? "medium" : "low"}
                />
              ))}
              <AuditScoreRing
                score={brief.riskScore}
                label="Composite"
                verdict={brief.riskScore >= 75 ? "high" : brief.riskScore >= 50 ? "medium" : "low"}
              />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Headline</div>
            <h2 className="mb-3 font-bold text-lg text-zinc-100">{brief.headline}</h2>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Summary</div>
            <p className="text-sm text-zinc-300 leading-relaxed">{brief.summary}</p>
          </div>

          {/* Per-Lens Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { lens: "GTM", color: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500/5", icon: "⌘" },
              { lens: "Finance", color: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/5", icon: "◈" },
              { lens: "Security", color: "border-red-500/30", text: "text-red-400", bg: "bg-red-500/5", icon: "◎" },
            ].map(({ lens, color, text, bg, icon }) => {
              const findings = brief.keyFindings?.filter((f) => {
                const lower = f.toLowerCase();
                if (lens === "GTM") return lower.match(/gtm|hiring|competitor|product|launch|buying/i);
                if (lens === "Finance") return lower.match(/finance|price|guidance|earnings|filing|revenue/i);
                return lower.match(/security|risk|vendor|regulatory|breach|supply/i);
              }) ?? [];
              return (
                <div key={lens} className={`border ${color} ${bg} p-4`}>
                  <div className={`mb-3 flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${text}`}>
                    <span>{icon}</span>
                    {lens} Lens
                    <span className="ml-auto font-mono text-[11px] text-zinc-500">{findings.length} signals</span>
                  </div>
                  {findings.length > 0 ? (
                    <ul className="space-y-2">
                      {findings.slice(0, 5).map((f, i) => (
                        <li key={i} className="text-xs text-zinc-400 leading-relaxed border-l-2 border-zinc-800 pl-2">-- {f}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-600">No signals for this lens in this report.</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recommendation */}
          {brief.recommendation && (
            <div className="border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-500">Recommendation</div>
              <p className="text-sm text-zinc-300 leading-relaxed">{brief.recommendation}</p>
            </div>
          )}

          {/* Source Attribution */}
          <div className="border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Sources</div>
            <div className="flex flex-wrap gap-1.5">
              {brief.sources?.slice(0, 10).map((src, i) => (
                <span key={i} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500">{src}</span>
              )) ?? <span className="text-[10px] text-zinc-600">No sources recorded</span>}
            </div>
          </div>

          {/* Report Navigation */}
          <div className="flex items-center justify-between border-zinc-800 border-t pt-4">
            <button
              type="button"
              onClick={() => setSelected((p) => Math.max(0, p - 1))}
              disabled={selected === 0}
              className="rounded border border-zinc-700 px-3 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-[10px] text-zinc-600">Report {selected + 1} of {briefs.length}</span>
            <button
              type="button"
              onClick={() => setSelected((p) => Math.min(briefs.length - 1, p + 1))}
              disabled={selected >= briefs.length - 1}
              className="rounded border border-zinc-700 px-3 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
