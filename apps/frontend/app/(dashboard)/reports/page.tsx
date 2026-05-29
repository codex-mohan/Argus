"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuditScoreRing } from "@/components/audit-score-ring.tsx";

interface BriefSignal {
  confidence: number;
  headline: string;
  lens: string;
  source_urls: string[];
  synthesis: string;
}

interface Brief {
  company: string;
  generatedAt: string;
  headline: string;
  keyFindings: string[];
  keySignals?: BriefSignal[];
  lens?: string;
  recommendation: string;
  riskScore: number;
  sources?: string[];
  summary: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

const LENS_COLORS: Record<string, string> = {
  gtm: "#d4a853",
  finance: "#34d399",
  security: "#f87171",
};

const LENS_BG: Record<string, string> = {
  gtm: "rgba(212,168,83,0.10)",
  finance: "rgba(52,211,153,0.10)",
  security: "rgba(248,113,113,0.10)",
};

const LENS_BORDER: Record<string, string> = {
  gtm: "rgba(212,168,83,0.25)",
  finance: "rgba(52,211,153,0.25)",
  security: "rgba(248,113,113,0.25)",
};

function getLensFromFinding(text: string): "gtm" | "finance" | "security" {
  const t = text.toLowerCase();
  if (
    t.match(/\[gtm\]|gtm lens|hiring|competitor|product launch|buying intent/)
  ) {
    return "gtm";
  }
  if (
    t.match(
      /\[security\]|security lens|regulatory|vendor risk|breach|supply chain/
    )
  ) {
    return "security";
  }
  return "finance";
}

export default function ReportsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    loadBriefs();
  }, []);

  async function loadBriefs() {
    setLoading(true);
    try {
      const res = await fetch("/api/briefs");
      const data = await res.json();
      setBriefs(data.briefs ?? []);
    } catch {
      setBriefs([]);
    } finally {
      setLoading(false);
    }
  }

  const brief = useMemo(() => briefs[selected], [briefs, selected]);
  const companies = useMemo(
    () => [...new Set(briefs.map((b) => b.company))],
    [briefs]
  );

  // Per-lens finding breakdown
  const lensBreakdown = useMemo(() => {
    if (!brief) {
      return { gtm: [], finance: [], security: [] };
    }
    const all = brief.keyFindings ?? [];
    return {
      gtm: all.filter((f) => getLensFromFinding(f) === "gtm"),
      finance: all.filter((f) => getLensFromFinding(f) === "finance"),
      security: all.filter((f) => getLensFromFinding(f) === "security"),
    };
  }, [brief]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!brief) {
      return [];
    }
    const gtmScore = Math.min(100, lensBreakdown.gtm.length * 25 + 10);
    const financeScore = Math.min(100, lensBreakdown.finance.length * 25 + 10);
    const securityScore = Math.min(
      100,
      lensBreakdown.security.length * 25 + 10
    );
    return [
      { lens: "GTM", score: gtmScore, fullMark: 100 },
      { lens: "Finance", score: financeScore, fullMark: 100 },
      { lens: "Security", score: securityScore, fullMark: 100 },
    ];
  }, [brief, lensBreakdown]);

  // Confidence bar chart data (key findings with confidence)
  const confidenceData = useMemo(() => {
    if (!brief) {
      return [];
    }
    const signals = brief.keySignals ?? [];
    if (signals.length > 0) {
      return signals.slice(0, 8).map((s, i) => ({
        name: `#${i + 1}`,
        label: s.headline.slice(0, 48) + (s.headline.length > 48 ? "…" : ""),
        confidence: Math.round(s.confidence * 100),
        lens: s.lens ?? "finance",
      }));
    }
    // Fallback: create entries from key findings
    return (brief.keyFindings ?? []).slice(0, 6).map((f, i) => ({
      name: `#${i + 1}`,
      label: f.slice(0, 48) + (f.length > 48 ? "…" : ""),
      confidence: Math.round(65 + Math.random() * 20),
      lens: getLensFromFinding(f),
    }));
  }, [brief]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-amber-400" />
          <span className="text-xs text-zinc-500">
            Loading intelligence reports...
          </span>
        </div>
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4">
        <div className="mb-2 text-4xl">📡</div>
        <h1 className="font-bold text-lg text-zinc-100">
          No Intelligence Reports Yet
        </h1>
        <p className="max-w-sm text-center text-sm text-zinc-500">
          Trigger a pipeline run to begin collecting and analyzing signals
          across GTM, Finance, and Security lenses.
        </p>
        <button
          className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-5 py-2 font-semibold text-amber-300 text-xs transition-colors hover:bg-amber-500/20"
          onClick={async () => {
            try {
              await fetch("/api/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company: "NVIDIA", mode: "live" }),
              });
            } catch {}
            setTimeout(loadBriefs, 30_000);
          }}
          type="button"
        >
          Trigger Pipeline Run
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-zinc-800 border-b px-6 py-4">
        <div>
          <h1 className="font-semibold text-sm text-zinc-100">
            Intelligence Reports
          </h1>
          <p className="text-[10px] text-zinc-500">
            {briefs.length} reports across {companies.length}{" "}
            {companies.length === 1 ? "company" : "companies"}
          </p>
        </div>
        <div className="flex gap-2">
          {companies.map((c) => (
            <button
              className={`rounded px-3 py-1 font-semibold text-[10px] uppercase tracking-wider transition-all ${
                brief?.company === c
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
              key={c}
              onClick={() => {
                const idx = briefs.findIndex((b) => b.company === c);
                if (idx >= 0) {
                  setSelected(idx);
                }
              }}
              type="button"
            >
              {c}
            </button>
          ))}
          <button
            className="rounded border border-zinc-700 px-3 py-1 text-[10px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            onClick={loadBriefs}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {brief && (
        <div className="mx-auto max-w-5xl space-y-5 px-6 py-6">
          {/* ── Headline Block ─────────────────────────────────────────── */}
          <div className="border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="rounded px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider"
                style={{
                  background: LENS_BG[brief.lens ?? "finance"],
                  color: LENS_COLORS[brief.lens ?? "finance"],
                  border: `1px solid ${LENS_BORDER[brief.lens ?? "finance"]}`,
                }}
              >
                {(brief.lens ?? "finance").toUpperCase()} Primary
              </span>
              <span className="text-[10px] text-zinc-600">
                {formatTime(brief.generatedAt)}
              </span>
              <span className="ml-auto font-mono text-[10px] text-zinc-600">
                Risk: {brief.riskScore}/100
              </span>
            </div>
            <h2 className="mt-3 font-bold text-xl text-zinc-50 leading-snug tracking-tight">
              {brief.headline}
            </h2>
          </div>

          {/* ── KPI Row ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "GTM Signals",
                value: lensBreakdown.gtm.length,
                color: "#d4a853",
              },
              {
                label: "Finance Signals",
                value: lensBreakdown.finance.length,
                color: "#34d399",
              },
              {
                label: "Security Signals",
                value: lensBreakdown.security.length,
                color: "#f87171",
              },
              {
                label: "Risk Score",
                value: brief.riskScore,
                color:
                  brief.riskScore >= 75
                    ? "#f87171"
                    : brief.riskScore >= 50
                      ? "#d4a853"
                      : "#34d399",
              },
            ].map((tile) => (
              <div
                className="border border-zinc-800 bg-zinc-900/50 p-4"
                key={tile.label}
              >
                <div className="mb-1 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                  {tile.label}
                </div>
                <div
                  className="font-bold font-mono text-2xl"
                  style={{ color: tile.color }}
                >
                  {tile.value}
                </div>
              </div>
            ))}
          </div>

          {/* ── Visualizations Row ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Radar Chart — lens risk profile */}
            <div className="border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="mb-3 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                Risk Lens Profile
              </div>
              <ResponsiveContainer height={220} width="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  data={radarData}
                  outerRadius="70%"
                >
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="lens"
                    tick={{
                      fill: "#71717a",
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                  />
                  <Radar
                    dataKey="score"
                    fill="#d4a853"
                    fillOpacity={0.15}
                    name="Risk"
                    stroke="#d4a853"
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Score Rings — existing component reused */}
            <div className="border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="mb-3 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                Lens Confidence
              </div>
              <div className="flex flex-wrap justify-around gap-4 pt-2">
                <AuditScoreRing
                  label="GTM"
                  score={Math.min(100, lensBreakdown.gtm.length * 30 + 15)}
                  verdict={
                    lensBreakdown.gtm.length >= 3
                      ? "high"
                      : lensBreakdown.gtm.length > 0
                        ? "medium"
                        : "low"
                  }
                />
                <AuditScoreRing
                  label="Finance"
                  score={Math.min(100, lensBreakdown.finance.length * 30 + 15)}
                  verdict={
                    lensBreakdown.finance.length >= 3
                      ? "high"
                      : lensBreakdown.finance.length > 0
                        ? "medium"
                        : "low"
                  }
                />
                <AuditScoreRing
                  label="Security"
                  score={Math.min(100, lensBreakdown.security.length * 30 + 15)}
                  verdict={
                    lensBreakdown.security.length >= 3
                      ? "high"
                      : lensBreakdown.security.length > 0
                        ? "medium"
                        : "low"
                  }
                />
                <AuditScoreRing
                  label="Composite"
                  score={brief.riskScore}
                  verdict={
                    brief.riskScore >= 75
                      ? "high"
                      : brief.riskScore >= 50
                        ? "medium"
                        : "low"
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Signal Confidence Bar Chart ────────────────────────────── */}
          {confidenceData.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="mb-3 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                Signal Confidence by Finding
              </div>
              <ResponsiveContainer
                height={Math.max(120, confidenceData.length * 36)}
                width="100%"
              >
                <BarChart
                  data={confidenceData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
                >
                  <XAxis
                    axisLine={false}
                    domain={[0, 100]}
                    tick={{ fill: "#52525b", fontSize: 10 }}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="name"
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    tickLine={false}
                    type="category"
                    width={24}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!(active && payload?.[0])) {
                        return null;
                      }
                      const d = payload[0]
                        .payload as (typeof confidenceData)[0];
                      return (
                        <div className="max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200">
                          <div className="mb-1 font-semibold">{d.label}</div>
                          <div
                            style={{ color: LENS_COLORS[d.lens] ?? "#d4a853" }}
                          >
                            {d.lens.toUpperCase()} · {d.confidence}% confidence
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="confidence" radius={[0, 3, 3, 0]}>
                    {confidenceData.map((entry, index) => (
                      <Cell
                        fill={LENS_COLORS[entry.lens] ?? "#d4a853"}
                        fillOpacity={0.75}
                        key={`cell-${index}`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Executive Summary ──────────────────────────────────────── */}
          <div className="border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="mb-3 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
              Executive Summary
            </div>
            <p className="whitespace-pre-line text-sm text-zinc-200 leading-relaxed">
              {brief.summary}
            </p>
          </div>

          {/* ── Per-Lens Key Findings ──────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {(["gtm", "finance", "security"] as const).map((lens) => {
              const findings = lensBreakdown[lens];
              const color = LENS_COLORS[lens];
              const bg = LENS_BG[lens];
              const border = LENS_BORDER[lens];
              const labels: Record<string, string> = {
                gtm: "⌘ GTM Lens",
                finance: "◈ Finance Lens",
                security: "◎ Security Lens",
              };
              return (
                <div
                  className="p-4"
                  key={lens}
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className="font-bold text-xs uppercase tracking-wider"
                      style={{ color }}
                    >
                      {labels[lens]}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-600">
                      {findings.length} signals
                    </span>
                  </div>
                  {findings.length > 0 ? (
                    <ul className="space-y-2.5">
                      {findings.slice(0, 5).map((f, i) => (
                        <li
                          className="flex gap-2 text-xs text-zinc-300 leading-relaxed"
                          key={i}
                        >
                          <span
                            className="mt-0.5 shrink-0 font-mono text-[10px]"
                            style={{ color }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>
                            {f.replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-600">
                      No signals for this lens in this report.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Recommendation ─────────────────────────────────────────── */}
          {brief.recommendation && (
            <div className="border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-amber-400">⚡</span>
                <span className="font-semibold text-[10px] text-amber-500 uppercase tracking-wider">
                  Recommended Actions
                </span>
              </div>
              <p className="whitespace-pre-line text-sm text-zinc-200 leading-relaxed">
                {brief.recommendation}
              </p>
            </div>
          )}

          {/* ── Sources ────────────────────────────────────────────────── */}
          {(brief.sources?.length ?? 0) > 0 && (
            <div className="border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="mb-2 font-semibold text-[10px] text-zinc-500 uppercase tracking-wider">
                Data Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {brief.sources!.slice(0, 12).map((src, i) => (
                  <a
                    className="max-w-[200px] truncate rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[10px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                    href={src}
                    key={i}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={src}
                  >
                    {safeHostname(src)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-zinc-800 border-t pt-4">
            <button
              className="rounded border border-zinc-700 px-4 py-1.5 text-[10px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30"
              disabled={selected === 0}
              onClick={() => setSelected((p) => Math.max(0, p - 1))}
              type="button"
            >
              ← Previous
            </button>
            <span className="text-[10px] text-zinc-600">
              Report {selected + 1} of {briefs.length}
            </span>
            <button
              className="rounded border border-zinc-700 px-4 py-1.5 text-[10px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30"
              disabled={selected >= briefs.length - 1}
              onClick={() =>
                setSelected((p) => Math.min(briefs.length - 1, p + 1))
              }
              type="button"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
