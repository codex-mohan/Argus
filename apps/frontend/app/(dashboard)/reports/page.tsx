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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Signal {
  agent_id: string;
  confidence: number;
  detected_at: string;
  headline: string;
  id: string;
  lens: "gtm" | "finance" | "security";
  severity: "low" | "medium" | "high" | "critical";
  source_urls: string[];
  synthesis: string;
}

interface Brief {
  company: string;
  generatedAt: string;
  headline: string;
  keyFindings: string[];
  lens?: string;
  recommendation: string;
  riskScore: number;
  sources?: string[];
  summary: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LENS_META = {
  gtm: {
    color: "#d4a853",
    bg: "rgba(212,168,83,0.06)",
    border: "rgba(212,168,83,0.2)",
    icon: "⌘",
    label: "GTM Lens",
    desc: "Competitor moves, hiring signals, product launches, buying intent, account expansion",
  },
  finance: {
    color: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.2)",
    icon: "◈",
    label: "Finance Lens",
    desc: "Price action, filing anomalies, supply chain stress, earnings divergence, macro signals",
  },
  security: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.06)",
    border: "rgba(248,113,113,0.2)",
    icon: "◎",
    label: "Security Lens",
    desc: "Vendor risk, regulatory actions, key personnel changes, brand exposure, threat intel",
  },
} as const;

const SEV_COLORS = {
  critical: "#ef4444",
  high: "#f87171",
  medium: "#fbbf24",
  low: "#6b7280",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeHostname(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({ signal, color }: { signal: Signal; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const conf = Math.round(signal.confidence * 100);

  return (
    <div
      className="border-l-2 py-3 pl-3 transition-colors hover:bg-white/[0.02] cursor-pointer"
      style={{ borderColor: color }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Top row: severity + time + confidence */}
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase"
          style={{ background: `${SEV_COLORS[signal.severity]}18`, color: SEV_COLORS[signal.severity] }}
        >
          {signal.severity}
        </span>
        <span className="text-[9px] text-zinc-700">{timeAgo(signal.detected_at)}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {/* Confidence bar */}
          <div className="h-1 w-16 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full"
              style={{
                width: `${conf}%`,
                background: conf >= 80 ? "#34d399" : conf >= 60 ? "#fbbf24" : "#f87171",
              }}
            />
          </div>
          <span className="font-mono text-[9px] text-zinc-500 tabular-nums">{conf}%</span>
        </div>
      </div>

      {/* Headline */}
      <div className="mb-1 text-xs font-semibold text-zinc-100 leading-snug">
        {/* Strip the [LENS]: prefix if present */}
        {signal.headline.replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "").replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")}
      </div>

      {/* Synthesis — show full when expanded */}
      {signal.synthesis && signal.synthesis !== signal.headline && (
        <div className={`text-[11px] text-zinc-400 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
          {signal.synthesis.replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "").trim()}
        </div>
      )}

      {/* Sources */}
      {expanded && signal.source_urls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {signal.source_urls.slice(0, 3).map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
              title={url}
            >
              ↗ {safeHostname(url)}
            </a>
          ))}
        </div>
      )}

      {/* Agent */}
      <div className="mt-1 text-[9px] text-zinc-700">{signal.agent_id}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [briefsRes, signalsRes] = await Promise.all([
        fetch("/api/briefs"),
        fetch("/api/signals"),
      ]);
      const briefsData = await briefsRes.json();
      const signalsData = await signalsRes.json();
      const fetchedBriefs: Brief[] = briefsData.briefs ?? [];
      setBriefs(fetchedBriefs);
      setSignals(signalsData.signals ?? []);
      if (fetchedBriefs.length > 0 && !selectedCompany) {
        setSelectedCompany(fetchedBriefs[0].company);
      }
    } catch {
      setBriefs([]); setSignals([]);
    } finally {
      setLoading(false);
    }
  }

  // All companies from briefs + signals
  const companies = useMemo(() => {
    const fromBriefs = briefs.map((b) => b.company);
    const fromSignals = signals.map((s) => {
      const m = s.headline.match(/^([A-Z]+)\s*[\[—]/);
      return m?.[1] ?? null;
    }).filter(Boolean) as string[];
    return [...new Set([...fromBriefs, ...fromSignals])];
  }, [briefs, signals]);

  // Brief for selected company (most recent)
  const brief = useMemo(() =>
    briefs.filter((b) => b.company === selectedCompany).at(-1),
    [briefs, selectedCompany]
  );

  // Signals for selected company — filter by headline containing company name
  const companySignals = useMemo(() => {
    if (!selectedCompany) return signals;
    return signals.filter((s) =>
      s.headline.toLowerCase().includes(selectedCompany.toLowerCase())
    );
  }, [signals, selectedCompany]);

  const gtmSignals      = useMemo(() => companySignals.filter((s) => s.lens === "gtm"), [companySignals]);
  const financeSignals  = useMemo(() => companySignals.filter((s) => s.lens === "finance"), [companySignals]);
  const securitySignals = useMemo(() => companySignals.filter((s) => s.lens === "security"), [companySignals]);

  // Confidence chart: top signals by confidence
  const confidenceChart = useMemo(() =>
    companySignals
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
      .map((s, i) => ({
        idx: `#${i + 1}`,
        label: s.headline.replace(/^[A-Z]+\s*[\[—][^\]]*[\]:]?\s*/i, "").slice(0, 60),
        confidence: Math.round(s.confidence * 100),
        lens: s.lens,
      })),
    [companySignals]
  );

  // Risk score: from brief or computed from signal confidence
  const riskScore = useMemo(() => {
    if (brief?.riskScore) return brief.riskScore;
    if (companySignals.length === 0) return null;
    const high = companySignals.filter((s) => s.severity === "high" || s.severity === "critical").length;
    return Math.round((high / companySignals.length) * 100);
  }, [brief, companySignals]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="text-3xl">📡</div>
        <h1 className="font-bold text-base text-zinc-100">No Intelligence Reports Yet</h1>
        <p className="max-w-sm text-center text-xs text-zinc-500">
          Trigger a pipeline run from the Dashboard to collect signals across GTM, Finance, and Security lenses.
        </p>
        <button
          type="button"
          className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
          onClick={async () => {
            try {
              await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: "NVIDIA", mode: "live" }) });
            } catch {}
            setTimeout(load, 30_000);
          }}
        >
          Trigger Pipeline Run → NVIDIA
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-zinc-800 border-b bg-zinc-950 px-6 py-3">
        <div className="shrink-0">
          <div className="font-semibold text-sm text-zinc-100">Intelligence Reports</div>
          <div className="text-[10px] text-zinc-600">
            {companySignals.length} signals · {gtmSignals.length} GTM · {financeSignals.length} Finance · {securitySignals.length} Security
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Company tabs */}
        <div className="flex items-center gap-1.5">
          {companies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCompany(c)}
              className={`rounded px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                selectedCompany === c
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-zinc-600 border border-zinc-800 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={load}
          className="ml-auto rounded border border-zinc-800 px-3 py-1 text-[10px] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="mx-auto max-w-6xl space-y-4 px-6 py-5">

        {/* ── Executive Brief Block ──────────────────────────────────────────── */}
        {brief ? (
          <div className="border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
                    Executive Brief · {formatTime(brief.generatedAt)}
                  </span>
                  {riskScore !== null && (
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                      style={{
                        background: riskScore >= 75 ? "rgba(248,113,113,0.15)" : riskScore >= 50 ? "rgba(251,191,36,0.15)" : "rgba(52,211,153,0.15)",
                        color: riskScore >= 75 ? "#f87171" : riskScore >= 50 ? "#fbbf24" : "#34d399",
                      }}
                    >
                      Risk {riskScore}/100
                    </span>
                  )}
                </div>
                {/* Headline — strip any leading 'COMPANY: ' or 'COMPANY [LENS]:' prefix */}
                <h2 className="font-bold text-lg text-zinc-50 leading-snug tracking-tight">
                  {(() => {
                    const raw = brief.headline ?? "";
                    const isGeneric = raw.toLowerCase().includes("multiple intelligence lenses");
                    if (isGeneric) {
                      // Fallback to best signal headline
                      const best = financeSignals[0] ?? gtmSignals[0] ?? securitySignals[0];
                      return best
                        ? best.headline.replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "").trim()
                        : "Intelligence signals collected";
                    }
                    // Strip leading 'NVIDIA: ' or 'NVIDIA [FINANCE]: ' patterns from brief headline
                    return raw
                      .replace(/^[A-Z]{2,}\s*(?:\[[A-Z]+\])?\s*:\s*/i, "")
                      .trim();
                  })()}
                </h2>
              </div>
              {/* Risk bar */}
              {riskScore !== null && (
                <div className="shrink-0 text-right">
                  <div className="mb-1 text-[9px] text-zinc-600">RISK LEVEL</div>
                  <div
                    className="font-mono text-2xl font-bold tabular-nums"
                    style={{ color: riskScore >= 75 ? "#f87171" : riskScore >= 50 ? "#fbbf24" : "#34d399" }}
                  >
                    {riskScore}
                    <span className="text-sm text-zinc-600">/100</span>
                  </div>
                </div>
              )}
            </div>

            {/* Summary — only show if it's not generic */}
            {brief.summary && !brief.summary.toLowerCase().includes("multiple intelligence lenses have converged") && (
              <p className="mb-4 text-sm text-zinc-300 leading-relaxed border-t border-zinc-800 pt-3">
                {brief.summary}
              </p>
            )}

            {/* Key findings from brief — as a numbered list */}
            {(brief.keyFindings ?? []).filter((f) =>
              !f.toLowerCase().includes("— gtm analysis") &&
              !f.toLowerCase().includes("— finance analysis") &&
              !f.toLowerCase().includes("— security analysis")
            ).length > 0 && (
              <div className="mb-4 space-y-1.5 border-t border-zinc-800 pt-3">
                <div className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Key Findings</div>
                {brief.keyFindings
                  .filter((f) =>
                    !f.toLowerCase().includes("— gtm analysis") &&
                    !f.toLowerCase().includes("— finance analysis") &&
                    !f.toLowerCase().includes("— security analysis")
                  )
                  .slice(0, 6)
                  .map((f, i) => (
                    <div key={i} className="flex gap-2.5 text-xs text-zinc-300">
                      <span className="mt-0.5 shrink-0 font-mono text-[9px] text-zinc-600">{String(i + 1).padStart(2, "0")}</span>
                      <span className="leading-relaxed">{f.replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Recommendation */}
            {brief.recommendation && brief.recommendation !== "Monitor situation and await further intelligence." && (
              <div className="rounded border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-amber-500">⚡ Recommended Action</div>
                <p className="text-xs text-zinc-200 leading-relaxed">{brief.recommendation}</p>
              </div>
            )}
          </div>
        ) : companySignals.length > 0 ? (
          /* No brief yet but we have signals */
          <div className="border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Signal Summary · {selectedCompany}</div>
            <h2 className="font-bold text-base text-zinc-100">
              {companySignals.length} signals collected · {
                financeSignals.length > 0 ? financeSignals[0].headline.replace(/^[A-Z]+\s*[\[—][^\]]*[\]:]?\s*/i, "") : "Analysis in progress"
              }
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Executive brief will be generated when the full pipeline completes.</p>
          </div>
        ) : null}

        {/* ── Visualizations: Radar + Score Rings ──────────────────────────── */}
        {companySignals.length > 0 && (() => {
          const gtmAvg  = gtmSignals.length  > 0 ? Math.round(gtmSignals.reduce((s, x)  => s + x.confidence, 0) / gtmSignals.length  * 100) : 0;
          const finAvg  = financeSignals.length  > 0 ? Math.round(financeSignals.reduce((s, x)  => s + x.confidence, 0) / financeSignals.length  * 100) : 0;
          const secAvg  = securitySignals.length > 0 ? Math.round(securitySignals.reduce((s, x) => s + x.confidence, 0) / securitySignals.length * 100) : 0;
          const composite = riskScore ?? Math.round((gtmAvg + finAvg + secAvg) / 3);
          const radarData = [
            { lens: "GTM",      score: gtmAvg,  fullMark: 100 },
            { lens: "Finance",  score: finAvg,  fullMark: 100 },
            { lens: "Security", score: secAvg,  fullMark: 100 },
          ];
          return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Radar — lens coverage profile */}
              <div className="border border-zinc-800 bg-zinc-900/30 p-5">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Lens Coverage Profile</div>
                <div className="mb-2 text-[10px] text-zinc-700">Average signal confidence per lens — higher = stronger evidence base</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart cx="50%" cy="50%" data={radarData} outerRadius="68%">
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis
                      dataKey="lens"
                      tick={(props: Record<string, unknown>) => {
                        const x = Number(props["x"]);
                        const y = Number(props["y"]);
                        const value = String((props["payload"] as Record<string, unknown>)["value"] ?? "");
                        const colors: Record<string, string> = { GTM: "#d4a853", Finance: "#34d399", Security: "#f87171" };
                        return (
                          <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={colors[value] ?? "#71717a"} fontSize={11} fontFamily="monospace">
                            {value}
                          </text>
                        );
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload as typeof radarData[0];
                        return (
                          <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[10px]">
                            <span className="text-zinc-400">{d.lens}:</span>{" "}
                            <span className="font-mono font-bold text-zinc-100">{d.score}%</span>{" "}
                            <span className="text-zinc-600">avg confidence</span>
                          </div>
                        );
                      }}
                    />
                    <Radar dataKey="score" name="Avg Confidence" stroke="#d4a853" fill="#d4a853" fillOpacity={0.12} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Score rings */}
              <div className="border border-zinc-800 bg-zinc-900/30 p-5">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Lens Confidence Scores</div>
                <div className="mb-4 text-[10px] text-zinc-700">Based on {companySignals.length} collected signals</div>
                <div className="flex flex-wrap items-center justify-around gap-6 pt-1">
                  <AuditScoreRing
                    label="GTM"
                    score={gtmAvg}
                    verdict={gtmAvg >= 70 ? "high" : gtmAvg >= 40 ? "medium" : "low"}
                  />
                  <AuditScoreRing
                    label="Finance"
                    score={finAvg}
                    verdict={finAvg >= 70 ? "high" : finAvg >= 40 ? "medium" : "low"}
                  />
                  <AuditScoreRing
                    label="Security"
                    score={secAvg}
                    verdict={secAvg >= 70 ? "high" : secAvg >= 40 ? "medium" : "low"}
                  />
                  <AuditScoreRing
                    label="Composite"
                    score={composite}
                    verdict={composite >= 70 ? "high" : composite >= 40 ? "medium" : "low"}
                  />
                </div>
                {/* Lens signal count breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
                  {(["gtm", "finance", "security"] as const).map((l) => {
                    const count = l === "gtm" ? gtmSignals.length : l === "finance" ? financeSignals.length : securitySignals.length;
                    const meta = LENS_META[l];
                    return (
                      <div key={l} className="text-center">
                        <div className="font-mono font-bold text-lg tabular-nums" style={{ color: count > 0 ? meta.color : "#3f3f46" }}>{count}</div>
                        <div className="text-[9px] uppercase text-zinc-600">{l} signals</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── 3-Lens Signal Breakdown ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {(["gtm", "finance", "security"] as const).map((lens) => {
            const meta = LENS_META[lens];
            const lensSignals = lens === "gtm" ? gtmSignals : lens === "finance" ? financeSignals : securitySignals;
            const topConf = lensSignals.length > 0
              ? Math.round(lensSignals.reduce((s, x) => s + x.confidence, 0) / lensSignals.length * 100)
              : 0;

            return (
              <div
                key={lens}
                className="flex flex-col rounded border"
                style={{ borderColor: meta.border, background: meta.bg }}
              >
                {/* Lens header */}
                <div className="flex items-start justify-between border-b px-4 py-3" style={{ borderColor: meta.border }}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm" style={{ color: meta.color }}>{meta.icon}</span>
                      <span className="font-bold text-xs uppercase tracking-wider" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-zinc-600 leading-snug">{meta.desc}</p>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <div className="font-mono font-bold text-lg tabular-nums" style={{ color: lensSignals.length > 0 ? meta.color : "#3f3f46" }}>
                      {lensSignals.length}
                    </div>
                    <div className="text-[9px] text-zinc-600">signals</div>
                    {topConf > 0 && (
                      <div className="text-[9px] text-zinc-600">{topConf}% avg conf</div>
                    )}
                  </div>
                </div>

                {/* TOP SIGNAL SYNTHESIS — the actual LLM insight for this lens */}
                {lensSignals.length > 0 && lensSignals[0].synthesis &&
                  lensSignals[0].synthesis !== lensSignals[0].headline && (
                  <div
                    className="px-4 py-3 border-b text-[11px] leading-relaxed text-zinc-300"
                    style={{ borderColor: meta.border, background: `${meta.color}08` }}
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>Lens Analysis</span>
                      <span className="text-[8px] text-zinc-700">· {Math.round(lensSignals[0].confidence * 100)}% confidence</span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed">
                      {lensSignals[0].synthesis
                        .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
                        .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
                        .trim()}
                    </p>
                    {/* Additional signals' synthesis if they add new insight */}
                    {lensSignals.slice(1, 3).filter(s =>
                      s.synthesis && s.synthesis !== s.headline &&
                      s.synthesis !== lensSignals[0].synthesis
                    ).map((s, i) => (
                      <p key={i} className="mt-2 text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-2">
                        {s.synthesis
                          .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
                          .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
                          .trim()}
                      </p>
                    ))}
                  </div>
                )}

                {/* Signal cards — individual findings */}
                <div className="flex-1 divide-y divide-zinc-800/50 px-4">
                  {lensSignals.length > 0 ? (
                    lensSignals.slice(0, 8).map((s) => (
                      <SignalCard key={s.id} signal={s} color={meta.color} />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <div className="text-zinc-700 text-xs mb-1">No {meta.label} signals</div>
                      <p className="text-[10px] text-zinc-800 leading-relaxed max-w-[180px] mx-auto">
                        {lens === "gtm"
                          ? "Will surface when hiring spikes, product launches, or competitive moves are detected"
                          : lens === "finance"
                            ? "Will surface when price movements, filings, or supply chain stress are detected"
                            : "Will surface when regulatory actions, vendor risk, or key personnel changes are detected"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Signal Confidence Chart ─────────────────────────────────────────── */}
        {confidenceChart.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
              Top Signals by Confidence — click a lens column to see the signal
            </div>
            <div className="mb-3 flex gap-3 text-[9px]">
              {(["gtm", "finance", "security"] as const).map((l) => (
                <div key={l} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: LENS_META[l].color }} />
                  <span className="text-zinc-600 uppercase">{l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(140, confidenceChart.length * 28)}>
              <BarChart data={confidenceChart} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#3f3f46", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="idx" tick={{ fill: "#71717a", fontSize: 9 }} tickLine={false} axisLine={false} width={24} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload as (typeof confidenceChart)[0];
                    return (
                      <div className="max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[10px]">
                        <div
                          className="mb-1 text-[9px] uppercase font-bold"
                          style={{ color: LENS_META[d.lens as keyof typeof LENS_META]?.color ?? "#71717a" }}
                        >
                          {d.lens}
                        </div>
                        <div className="text-zinc-200 leading-snug">{d.label}</div>
                        <div className="mt-1 font-mono text-zinc-400">{d.confidence}% confidence</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="confidence" radius={[0, 3, 3, 0]}>
                  {confidenceChart.map((e, i) => (
                    <Cell
                      key={i}
                      fill={LENS_META[e.lens as keyof typeof LENS_META]?.color ?? "#71717a"}
                      fillOpacity={0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Source Evidence ─────────────────────────────────────────────────── */}
        {companySignals.length > 0 && (() => {
          const allSources = [...new Set(
            companySignals.flatMap((s) => s.source_urls).filter(Boolean)
          )].slice(0, 16);
          return allSources.length > 0 ? (
            <div className="border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
                Evidence Sources · {allSources.length} domains
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allSources.map((url, i) => {
                  const sig = companySignals.find((s) => s.source_urls.includes(url));
                  const color = sig ? LENS_META[sig.lens]?.color : "#71717a";
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[9px] text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                      title={url}
                      style={{ borderLeftColor: color, borderLeftWidth: "2px" }}
                    >
                      {safeHostname(url)}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null;
        })()}

      </div>
    </div>
  );
}
