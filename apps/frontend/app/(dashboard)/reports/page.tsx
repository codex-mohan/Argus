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
    glow: "rgba(212,168,83,0.12)",
    icon: "⌘",
    label: "GTM Lens",
    desc: "Competitor moves, hiring signals, product launches, buying intent, account expansion",
  },
  finance: {
    color: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.2)",
    glow: "rgba(52,211,153,0.12)",
    icon: "◈",
    label: "Finance Lens",
    desc: "Price action, filing anomalies, supply chain stress, earnings divergence, macro signals",
  },
  security: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.06)",
    border: "rgba(248,113,113,0.2)",
    glow: "rgba(248,113,113,0.12)",
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
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) {
    return `${s}s ago`;
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}m ago`;
  }
  return `${Math.floor(s / 3600)}h ago`;
}

function riskLabel(score: number): string {
  if (score >= 80) {
    return "CRITICAL";
  }
  if (score >= 60) {
    return "HIGH";
  }
  if (score >= 40) {
    return "MEDIUM";
  }
  return "LOW";
}

function riskColor(score: number): string {
  if (score >= 80) {
    return "#ef4444";
  }
  if (score >= 60) {
    return "#f87171";
  }
  if (score >= 40) {
    return "#fbbf24";
  }
  return "#34d399";
}

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({ signal, color }: { signal: Signal; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const conf = Math.round(signal.confidence * 100);

  return (
    <div
      className="cursor-pointer border-l-2 py-3 pl-3 transition-colors hover:bg-white/[0.02]"
      onClick={() => setExpanded((e) => !e)}
      style={{ borderColor: color }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 font-bold font-mono text-[9px] uppercase"
          style={{
            background: `${SEV_COLORS[signal.severity]}18`,
            color: SEV_COLORS[signal.severity],
          }}
        >
          {signal.severity}
        </span>
        <span className="text-[9px] text-zinc-700">
          {timeAgo(signal.detected_at)}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1 w-16 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full"
              style={{
                width: `${conf}%`,
                background:
                  conf >= 80 ? "#34d399" : conf >= 60 ? "#fbbf24" : "#f87171",
              }}
            />
          </div>
          <span className="font-mono text-[9px] text-zinc-500 tabular-nums">
            {conf}%
          </span>
        </div>
      </div>

      <div className="mb-1 font-semibold text-xs text-zinc-100 leading-snug">
        {signal.headline
          .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
          .replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")}
      </div>

      {signal.synthesis && signal.synthesis !== signal.headline && (
        <div
          className={`text-[11px] text-zinc-400 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
        >
          {signal.synthesis
            .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
            .trim()}
        </div>
      )}

      {expanded && signal.source_urls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {signal.source_urls.slice(0, 3).map((url, i) => (
            <a
              className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
              href={url}
              key={i}
              onClick={(e) => e.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
              title={url}
            >
              ↗ {safeHostname(url)}
            </a>
          ))}
        </div>
      )}

      <div className="mt-1 text-[9px] text-zinc-700">{signal.agent_id}</div>
    </div>
  );
}

// ─── Risk Gauge (SVG arc, strokeDasharray-based) ────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const color = riskColor(score);
  const label = riskLabel(score);

  // Geometry
  const r = 44;
  const cx = 68;
  const cy = 60;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  // strokeDasharray: fill = score% of the semicircle arc length
  const halfCircum = Math.PI * r;
  const filled = (score / 100) * halfCircum;
  const gap = halfCircum - filled;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg height="80" viewBox="0 0 136 80" width="136">
        <defs>
          <linearGradient id="risk-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeLinecap="round"
          strokeWidth="9"
        />
        {/* Fill */}
        {score > 0 && (
          <path
            d={arcPath}
            fill="none"
            stroke="url(#risk-gradient)"
            strokeDasharray={`${filled} ${gap + 1}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeWidth="9"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        )}
        <text
          fill={color}
          fontFamily="monospace"
          fontSize="22"
          fontWeight="700"
          textAnchor="middle"
          x={cx}
          y={cy - 4}
        >
          {score}
        </text>
        <text
          fill="rgba(255,255,255,0.2)"
          fontFamily="monospace"
          fontSize="9"
          textAnchor="middle"
          x={cx}
          y={cy + 12}
        >
          / 100
        </text>
      </svg>
      <span
        className="rounded px-2 py-0.5 font-bold font-mono text-[9px] tracking-widest"
        style={{
          color,
          background: `${color}15`,
          border: `1px solid ${color}28`,
        }}
      >
        {label} RISK
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [activeLens, setActiveLens] = useState<
    "all" | "gtm" | "finance" | "security"
  >("all");

  useEffect(() => {
    load();
  }, []);

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
      setBriefs([]);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }

  const companies = useMemo(() => {
    const fromBriefs = briefs.map((b) => b.company);
    const fromSignals = signals
      .map((s) => {
        const m = s.headline.match(/^([A-Z]+)\s*[[—]/);
        return m?.[1] ?? null;
      })
      .filter(Boolean) as string[];
    return [...new Set([...fromBriefs, ...fromSignals])];
  }, [briefs, signals]);

  const brief = useMemo(
    () => briefs.filter((b) => b.company === selectedCompany).at(-1),
    [briefs, selectedCompany]
  );

  const companySignals = useMemo(() => {
    if (!selectedCompany) {
      return signals;
    }
    return signals.filter((s) =>
      s.headline.toLowerCase().includes(selectedCompany.toLowerCase())
    );
  }, [signals, selectedCompany]);

  const gtmSignals = useMemo(
    () => companySignals.filter((s) => s.lens === "gtm"),
    [companySignals]
  );
  const financeSignals = useMemo(
    () => companySignals.filter((s) => s.lens === "finance"),
    [companySignals]
  );
  const securitySignals = useMemo(
    () => companySignals.filter((s) => s.lens === "security"),
    [companySignals]
  );

  const visibleSignals = useMemo(() => {
    if (activeLens === "all") {
      return companySignals;
    }
    if (activeLens === "gtm") {
      return gtmSignals;
    }
    if (activeLens === "finance") {
      return financeSignals;
    }
    return securitySignals;
  }, [activeLens, companySignals, gtmSignals, financeSignals, securitySignals]);

  const confidenceChart = useMemo(
    () =>
      companySignals
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)
        .map((s, i) => ({
          idx: `#${i + 1}`,
          label: s.headline
            .replace(/^[A-Z]+\s*[[—][^\]]*[\]:]?\s*/i, "")
            .slice(0, 60),
          confidence: Math.round(s.confidence * 100),
          lens: s.lens,
        })),
    [companySignals]
  );

  const riskScore = useMemo(() => {
    if (brief?.riskScore) {
      return brief.riskScore;
    }
    if (companySignals.length === 0) {
      return null;
    }
    const high = companySignals.filter(
      (s) => s.severity === "high" || s.severity === "critical"
    ).length;
    return Math.round((high / companySignals.length) * 100);
  }, [brief, companySignals]);

  const gtmAvg =
    gtmSignals.length > 0
      ? Math.round(
          (gtmSignals.reduce((s, x) => s + x.confidence, 0) /
            gtmSignals.length) *
            100
        )
      : 0;
  const finAvg =
    financeSignals.length > 0
      ? Math.round(
          (financeSignals.reduce((s, x) => s + x.confidence, 0) /
            financeSignals.length) *
            100
        )
      : 0;
  const secAvg =
    securitySignals.length > 0
      ? Math.round(
          (securitySignals.reduce((s, x) => s + x.confidence, 0) /
            securitySignals.length) *
            100
        )
      : 0;
  const composite = riskScore ?? Math.round((gtmAvg + finAvg + secAvg) / 3);

  const radarData = [
    { lens: "GTM", score: gtmAvg, fullMark: 100 },
    { lens: "Finance", score: finAvg, fullMark: 100 },
    { lens: "Security", score: secAvg, fullMark: 100 },
  ];

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
        <h1 className="font-bold text-base text-zinc-100">
          No Intelligence Reports Yet
        </h1>
        <p className="max-w-sm text-center text-xs text-zinc-500">
          Trigger a pipeline run from the Dashboard to collect signals across
          GTM, Finance, and Security lenses.
        </p>
        <button
          className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-semibold text-amber-300 text-xs transition-colors hover:bg-amber-500/20"
          onClick={async () => {
            try {
              await fetch("/api/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company: "NVIDIA", mode: "live" }),
              });
            } catch {}
            setTimeout(load, 30_000);
          }}
          type="button"
        >
          Trigger Pipeline Run → NVIDIA
        </button>
      </div>
    );
  }

  // Pick the best headline: highest-confidence signal per lens, prefer finance > gtm > security
  const briefHeadline = (() => {
    const raw = brief?.headline ?? "";
    const isGeneric =
      !raw ||
      raw.toLowerCase().includes("multiple intelligence lenses") ||
      raw.toLowerCase().includes("converged on signals");
    if (!isGeneric) {
      return raw.replace(/^[A-Z]{2,}\s*(?:\[[A-Z]+\])?\s*:\s*/i, "").trim();
    }
    // Fall back to highest-confidence signal headline
    const ranked = [...companySignals].sort(
      (a, b) => b.confidence - a.confidence
    );
    const best = ranked[0];
    return best
      ? best.headline
          .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
          .replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")
          .trim()
      : "Intelligence signals collected";
  })();

  // Build a rich description from top signal syntheses when brief summary is generic
  const derivedSummary = (() => {
    const isGeneric =
      !brief?.summary ||
      brief.summary.toLowerCase().includes("multiple intelligence lenses") ||
      brief.summary.toLowerCase().includes("converged on signals") ||
      brief.summary.trim().length < 40;
    if (!isGeneric) {
      return brief!.summary.trim();
    }
    // Synthesise from top signal per lens (finance first — most impactful for demos)
    const clean = (s: string) =>
      s
        .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
        .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
        .trim();
    const parts: string[] = [];
    const topFin = [...financeSignals].sort(
      (a, b) => b.confidence - a.confidence
    )[0];
    const topGtm = [...gtmSignals].sort(
      (a, b) => b.confidence - a.confidence
    )[0];
    const topSec = [...securitySignals].sort(
      (a, b) => b.confidence - a.confidence
    )[0];
    if (topFin?.synthesis && topFin.synthesis !== topFin.headline) {
      parts.push(clean(topFin.synthesis));
    }
    if (topGtm?.synthesis && topGtm.synthesis !== topGtm.headline) {
      parts.push(clean(topGtm.synthesis));
    }
    if (topSec?.synthesis && topSec.synthesis !== topSec.headline) {
      parts.push(clean(topSec.synthesis));
    }
    // Fall back to headlines if no synthesis
    if (parts.length === 0) {
      if (topFin) {
        parts.push(clean(topFin.headline));
      }
      if (topGtm) {
        parts.push(clean(topGtm.headline));
      }
      if (topSec) {
        parts.push(clean(topSec.headline));
      }
    }
    return parts.join("\n\n");
  })();

  const cleanFindings = (brief?.keyFindings ?? []).filter(
    (f) =>
      !(
        f.toLowerCase().includes("— gtm analysis") ||
        f.toLowerCase().includes("— finance analysis") ||
        f.toLowerCase().includes("— security analysis")
      )
  );

  const lensForFinding = (f: string): keyof typeof LENS_META | null => {
    const u = f.toLowerCase();
    if (u.includes("[gtm]")) {
      return "gtm";
    }
    if (u.includes("[finance]")) {
      return "finance";
    }
    if (u.includes("[security]")) {
      return "security";
    }
    return null;
  };

  const BORDER = "rgba(255,255,255,0.07)";
  const SURFACE = "rgba(18,18,22,0.9)";

  return (
    <div className="min-h-screen" style={{ background: "#0c0c0e" }}>
      {/* ── Sticky top bar ───────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 border-b px-6 py-3"
        style={{
          background: "rgba(12,12,14,0.92)",
          borderColor: BORDER,
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="shrink-0">
          <div className="font-semibold text-sm text-zinc-100">
            Intelligence Reports
          </div>
          <div className="text-[10px] text-zinc-600">
            {companySignals.length} signals · {gtmSignals.length} GTM ·{" "}
            {financeSignals.length} Finance · {securitySignals.length} Security
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Company tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {companies.map((c) => (
            <button
              className="rounded px-3 py-1 font-bold font-mono text-[10px] uppercase tracking-wider transition-all"
              key={c}
              onClick={() => setSelectedCompany(c)}
              style={
                selectedCompany === c
                  ? {
                      background: "rgba(212,168,83,0.12)",
                      color: "#d4a853",
                      border: "1px solid rgba(212,168,83,0.3)",
                      boxShadow: "0 0 10px rgba(212,168,83,0.1)",
                    }
                  : {
                      color: "#52525b",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }
              }
              type="button"
            >
              {c}
            </button>
          ))}
        </div>

        <button
          className="ml-auto rounded border border-zinc-800 px-3 py-1 text-[10px] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          onClick={load}
          type="button"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        {/* ── Executive Brief card ──────────────────────────────────────────── */}
        {brief ? (
          <div
            className="overflow-hidden rounded-xl"
            style={{
              border: `1px solid ${BORDER}`,
              background:
                "linear-gradient(140deg, rgba(26,26,31,0.95) 0%, rgba(15,15,19,0.98) 100%)",
              boxShadow:
                "0 2px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Brief title bar */}
            <div
              className="flex items-center gap-3 border-b px-5 py-2.5"
              style={{
                borderColor: BORDER,
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <span className="font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.18em]">
                Executive Brief
              </span>
              <span className="text-zinc-800">·</span>
              <span className="font-mono text-[9px] text-zinc-700">
                {formatTime(brief.generatedAt)}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {riskScore !== null && (
                  <span
                    className="rounded px-2 py-0.5 font-bold font-mono text-[9px] tracking-wider"
                    style={{
                      background: `${riskColor(riskScore)}15`,
                      color: riskColor(riskScore),
                      border: `1px solid ${riskColor(riskScore)}28`,
                    }}
                  >
                    Risk {riskScore}/100
                  </span>
                )}
                <span
                  className="rounded px-2 py-0.5 font-mono text-[9px]"
                  style={{
                    background: "rgba(212,168,83,0.08)",
                    color: "#d4a853",
                    border: "1px solid rgba(212,168,83,0.18)",
                  }}
                >
                  {selectedCompany}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Headline row + gauge */}
              <div className="flex items-start gap-6">
                <div className="min-w-0 flex-1">
                  {/* Eyebrow label */}
                  <div className="mb-2 font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.2em]">
                    Intelligence Assessment
                  </div>

                  {/* Title — the brief headline */}
                  <h2 className="mb-3 font-bold text-xl text-zinc-50 leading-snug tracking-tight">
                    {briefHeadline}
                  </h2>

                  {/* Description — derived from signals when brief summary is generic */}
                  {derivedSummary && (
                    <div className="mt-1 space-y-2">
                      {derivedSummary
                        .split(/\n\n+/)
                        .filter(Boolean)
                        .map((para, i) => (
                          <p
                            className="text-sm leading-relaxed"
                            key={i}
                            style={{ color: i === 0 ? "#b8b8c4" : "#7a7a90" }}
                          >
                            {para.trim()}
                          </p>
                        ))}
                    </div>
                  )}
                </div>

                {/* Risk gauge */}
                {riskScore !== null && (
                  <div
                    className="flex shrink-0 flex-col items-center rounded-xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${BORDER}`,
                      minWidth: "148px",
                    }}
                  >
                    <RiskGauge score={riskScore} />
                  </div>
                )}
              </div>

              {/* Key Findings grid */}
              {cleanFindings.length > 0 && (
                <div
                  className="mt-5 border-t pt-5"
                  style={{ borderColor: BORDER }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em]">
                      Key Findings
                    </span>
                    <span className="rounded bg-zinc-800/50 px-1.5 py-0.5 font-mono text-[9px] text-zinc-700">
                      {cleanFindings.length}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {cleanFindings.slice(0, 6).map((f, i) => {
                      const lens = lensForFinding(f);
                      const meta = lens ? LENS_META[lens] : null;
                      const cleaned = f
                        .replace(/^\[(?:GTM|FINANCE|SECURITY)\]\s*/i, "")
                        .trim();
                      return (
                        <div
                          className="flex gap-3 rounded-lg p-3"
                          key={i}
                          style={{
                            background: meta
                              ? meta.bg
                              : "rgba(255,255,255,0.02)",
                            border: `1px solid ${meta ? meta.border : BORDER}`,
                          }}
                        >
                          <div
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded font-bold font-mono text-[9px]"
                            style={{
                              background: meta
                                ? `${meta.color}18`
                                : "rgba(255,255,255,0.05)",
                              color: meta ? meta.color : "#52525b",
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div className="min-w-0">
                            {meta && (
                              <div
                                className="mb-0.5 font-mono text-[8px] uppercase tracking-widest"
                                style={{ color: meta.color }}
                              >
                                {meta.label}
                              </div>
                            )}
                            <p className="text-xs text-zinc-300 leading-snug">
                              {cleaned}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {brief.recommendation &&
                brief.recommendation !==
                  "Monitor situation and await further intelligence." && (
                  <div
                    className="mt-4 rounded-lg px-4 py-3"
                    style={{
                      background: "rgba(212,168,83,0.06)",
                      border: "1px solid rgba(212,168,83,0.18)",
                    }}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-amber-400 text-xs">⚡</span>
                      <span className="font-bold font-mono text-[9px] text-amber-500 uppercase tracking-[0.15em]">
                        Recommended Action
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {brief.recommendation}
                    </p>
                  </div>
                )}
            </div>
          </div>
        ) : companySignals.length > 0 ? (
          <div
            className="rounded-xl p-5"
            style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
          >
            <div className="mb-2 font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em]">
              Signal Summary · {selectedCompany}
            </div>
            <h2 className="font-bold text-base text-zinc-100">
              {companySignals.length} signals collected ·{" "}
              {financeSignals.length > 0
                ? financeSignals[0].headline.replace(
                    /^[A-Z]+\s*[[—][^\]]*[\]:]?\s*/i,
                    ""
                  )
                : "Analysis in progress"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Executive brief will be generated when the full pipeline
              completes.
            </p>
          </div>
        ) : null}

        {/* ── Analytics row: Score Rings + Radar ───────────────────────────── */}
        {companySignals.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Score rings */}
            <div
              className="rounded-xl p-5 lg:col-span-2"
              style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
            >
              <div className="mb-1 font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em]">
                Lens Confidence
              </div>
              <div className="mb-4 text-[10px] text-zinc-700">
                Based on {companySignals.length} collected signals
              </div>
              <div className="flex flex-wrap items-center justify-around gap-4">
                <AuditScoreRing
                  label="GTM"
                  score={gtmAvg}
                  verdict={
                    gtmAvg >= 70 ? "high" : gtmAvg >= 40 ? "medium" : "low"
                  }
                />
                <AuditScoreRing
                  label="Finance"
                  score={finAvg}
                  verdict={
                    finAvg >= 70 ? "high" : finAvg >= 40 ? "medium" : "low"
                  }
                />
                <AuditScoreRing
                  label="Security"
                  score={secAvg}
                  verdict={
                    secAvg >= 70 ? "high" : secAvg >= 40 ? "medium" : "low"
                  }
                />
                <AuditScoreRing
                  label="Composite"
                  score={composite}
                  verdict={
                    composite >= 70
                      ? "high"
                      : composite >= 40
                        ? "medium"
                        : "low"
                  }
                />
              </div>
              {/* Signal counts */}
              <div
                className="mt-4 grid grid-cols-3 gap-2 border-t pt-3"
                style={{ borderColor: BORDER }}
              >
                {(["gtm", "finance", "security"] as const).map((l) => {
                  const count =
                    l === "gtm"
                      ? gtmSignals.length
                      : l === "finance"
                        ? financeSignals.length
                        : securitySignals.length;
                  const meta = LENS_META[l];
                  return (
                    <div className="text-center" key={l}>
                      <div
                        className="font-bold font-mono text-lg tabular-nums"
                        style={{ color: count > 0 ? meta.color : "#3f3f46" }}
                      >
                        {count}
                      </div>
                      <div className="text-[9px] text-zinc-700 uppercase">
                        {l} signals
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar */}
            <div
              className="rounded-xl p-5 lg:col-span-3"
              style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
            >
              <div className="mb-1 font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em]">
                Lens Coverage Profile
              </div>
              <div className="mb-2 text-[10px] text-zinc-700">
                Average signal confidence per lens — higher = stronger evidence
                base
              </div>
              <ResponsiveContainer height={220} width="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  data={radarData}
                  outerRadius="68%"
                >
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis
                    dataKey="lens"
                    tick={(props: Record<string, unknown>) => {
                      const x = Number(props["x"]);
                      const y = Number(props["y"]);
                      const value = String(
                        (props["payload"] as Record<string, unknown>)[
                          "value"
                        ] ?? ""
                      );
                      const colors: Record<string, string> = {
                        GTM: "#d4a853",
                        Finance: "#34d399",
                        Security: "#f87171",
                      };
                      return (
                        <text
                          dominantBaseline="central"
                          fill={colors[value] ?? "#71717a"}
                          fontFamily="monospace"
                          fontSize={11}
                          textAnchor="middle"
                          x={x}
                          y={y}
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!(active && payload?.[0])) {
                        return null;
                      }
                      const d = payload[0].payload as (typeof radarData)[0];
                      return (
                        <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[10px]">
                          <span className="text-zinc-400">{d.lens}:</span>{" "}
                          <span className="font-bold font-mono text-zinc-100">
                            {d.score}%
                          </span>{" "}
                          <span className="text-zinc-600">avg confidence</span>
                        </div>
                      );
                    }}
                  />
                  <Radar
                    dataKey="score"
                    fill="#d4a853"
                    fillOpacity={0.12}
                    name="Avg Confidence"
                    stroke="#d4a853"
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Signal Confidence Bar Chart ───────────────────────────────────── */}
        {confidenceChart.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
          >
            <div className="mb-1 font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em]">
              Top Signals by Confidence — click a lens column to see the signal
            </div>
            <div className="mb-3 flex gap-4">
              {(["gtm", "finance", "security"] as const).map((l) => (
                <div className="flex items-center gap-1.5" key={l}>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: LENS_META[l].color }}
                  />
                  <span className="font-mono text-[9px] text-zinc-600 uppercase">
                    {l}
                  </span>
                </div>
              ))}
            </div>
            <ResponsiveContainer
              height={Math.max(140, confidenceChart.length * 28)}
              width="100%"
            >
              <BarChart
                data={confidenceChart}
                layout="vertical"
                margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
              >
                <XAxis
                  axisLine={false}
                  domain={[0, 100]}
                  tick={{ fill: "#3f3f46", fontSize: 9 }}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="idx"
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  tickLine={false}
                  type="category"
                  width={24}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!(active && payload?.[0])) {
                      return null;
                    }
                    const d = payload[0].payload as (typeof confidenceChart)[0];
                    return (
                      <div className="max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-[10px]">
                        <div
                          className="mb-1 font-bold text-[9px] uppercase"
                          style={{
                            color:
                              LENS_META[d.lens as keyof typeof LENS_META]
                                ?.color ?? "#71717a",
                          }}
                        >
                          {d.lens}
                        </div>
                        <div className="text-zinc-200 leading-snug">
                          {d.label}
                        </div>
                        <div className="mt-1 font-mono text-zinc-400">
                          {d.confidence}% confidence
                        </div>
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                />
                <Bar dataKey="confidence" radius={[0, 3, 3, 0]}>
                  {confidenceChart.map((e, i) => (
                    <Cell
                      fill={
                        LENS_META[e.lens as keyof typeof LENS_META]?.color ??
                        "#71717a"
                      }
                      fillOpacity={0.75}
                      key={i}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Signal Drill-down with lens tabs ─────────────────────────────── */}
        {companySignals.length > 0 && (
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
          >
            {/* Lens filter tabs */}
            <div
              className="flex items-center overflow-x-auto border-b"
              style={{ borderColor: BORDER }}
            >
              {(
                [
                  {
                    key: "all",
                    label: "All Signals",
                    count: companySignals.length,
                    color: "#71717a",
                  },
                  {
                    key: "gtm",
                    label: "GTM",
                    count: gtmSignals.length,
                    color: "#d4a853",
                  },
                  {
                    key: "finance",
                    label: "Finance",
                    count: financeSignals.length,
                    color: "#34d399",
                  },
                  {
                    key: "security",
                    label: "Security",
                    count: securitySignals.length,
                    color: "#f87171",
                  },
                ] as const
              ).map((tab) => (
                <button
                  className="flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 font-medium font-mono text-xs transition-all"
                  key={tab.key}
                  onClick={() => setActiveLens(tab.key)}
                  style={
                    activeLens === tab.key
                      ? {
                          color: tab.color,
                          borderBottomColor: tab.color,
                          background: `${tab.color}07`,
                        }
                      : { color: "#52525b", borderBottomColor: "transparent" }
                  }
                  type="button"
                >
                  {tab.label}
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[9px]"
                    style={{
                      background:
                        activeLens === tab.key
                          ? `${tab.color}18`
                          : "rgba(255,255,255,0.04)",
                      color: activeLens === tab.key ? tab.color : "#52525b",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Synthesis callout for single focused lens */}
            {activeLens !== "all" &&
              (() => {
                const meta = LENS_META[activeLens];
                const lsigs =
                  activeLens === "gtm"
                    ? gtmSignals
                    : activeLens === "finance"
                      ? financeSignals
                      : securitySignals;
                const top = lsigs[0];
                if (!top?.synthesis || top.synthesis === top.headline) {
                  return null;
                }
                return (
                  <div
                    className="border-b px-5 py-4"
                    style={{ borderColor: meta.border, background: meta.bg }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span
                        className="font-bold font-mono text-[9px] uppercase tracking-[0.15em]"
                        style={{ color: meta.color }}
                      >
                        {meta.label} — Top Insight
                      </span>
                      <span className="font-mono text-[9px] text-zinc-700">
                        · {Math.round(top.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {top.synthesis
                        .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
                        .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
                        .trim()}
                    </p>
                    {lsigs
                      .slice(1, 3)
                      .filter(
                        (s) =>
                          s.synthesis &&
                          s.synthesis !== s.headline &&
                          s.synthesis !== top.synthesis
                      )
                      .map((s, i) => (
                        <p
                          className="mt-2 border-t pt-2 text-xs text-zinc-400 leading-relaxed"
                          key={i}
                          style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        >
                          {s.synthesis
                            .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
                            .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
                            .trim()}
                        </p>
                      ))}
                  </div>
                );
              })()}

            {/* "All" → 3-column grid */}
            {activeLens === "all" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {(["gtm", "finance", "security"] as const).map((lens, idx) => {
                  const meta = LENS_META[lens];
                  const lsigs =
                    lens === "gtm"
                      ? gtmSignals
                      : lens === "finance"
                        ? financeSignals
                        : securitySignals;
                  return (
                    <div
                      className="flex flex-col"
                      key={lens}
                      style={{
                        borderRight: idx < 2 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      {/* Column header */}
                      <div
                        className="flex items-center justify-between border-b px-4 py-3"
                        style={{
                          borderColor: meta.border,
                          background: meta.bg,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: meta.color }}>{meta.icon}</span>
                          <span
                            className="font-bold font-mono text-[10px] uppercase tracking-wider"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div
                            className="font-bold font-mono text-lg tabular-nums"
                            style={{
                              color: lsigs.length > 0 ? meta.color : "#3f3f46",
                            }}
                          >
                            {lsigs.length}
                          </div>
                          <div className="text-[9px] text-zinc-700">
                            signals
                          </div>
                        </div>
                      </div>

                      {/* Top lens synthesis */}
                      {lsigs.length > 0 &&
                        lsigs[0].synthesis &&
                        lsigs[0].synthesis !== lsigs[0].headline && (
                          <div
                            className="border-b px-4 py-3 text-[11px] text-zinc-300 leading-relaxed"
                            style={{
                              borderColor: meta.border,
                              background: `${meta.color}05`,
                            }}
                          >
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <span
                                className="font-bold text-[8px] uppercase tracking-widest"
                                style={{ color: meta.color }}
                              >
                                Lens Analysis
                              </span>
                              <span className="text-[8px] text-zinc-700">
                                · {Math.round(lsigs[0].confidence * 100)}%
                                confidence
                              </span>
                            </div>
                            <p className="text-zinc-200 leading-relaxed">
                              {lsigs[0].synthesis
                                .replace(/\s*—\s*Source:\s*https?:\/\/\S+/g, "")
                                .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
                                .trim()}
                            </p>
                            {lsigs
                              .slice(1, 3)
                              .filter(
                                (s) =>
                                  s.synthesis &&
                                  s.synthesis !== s.headline &&
                                  s.synthesis !== lsigs[0].synthesis
                              )
                              .map((s, i) => (
                                <p
                                  className="mt-2 border-zinc-800/50 border-t pt-2 text-zinc-400 leading-relaxed"
                                  key={i}
                                >
                                  {s.synthesis
                                    .replace(
                                      /\s*—\s*Source:\s*https?:\/\/\S+/g,
                                      ""
                                    )
                                    .replace(/^[A-Z]+\s*\[[A-Z]+\]:\s*/i, "")
                                    .trim()}
                                </p>
                              ))}
                          </div>
                        )}

                      {/* Signal cards */}
                      <div className="flex-1 divide-y divide-zinc-800/50 px-4">
                        {lsigs.length > 0 ? (
                          lsigs
                            .slice(0, 8)
                            .map((s) => (
                              <SignalCard
                                color={meta.color}
                                key={s.id}
                                signal={s}
                              />
                            ))
                        ) : (
                          <div className="py-10 text-center">
                            <div className="mb-1 text-xs text-zinc-700">
                              No {meta.label} signals
                            </div>
                            <p className="mx-auto max-w-[180px] text-[10px] text-zinc-800 leading-relaxed">
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
            ) : (
              /* Single-lens focused list */
              <div className="divide-y divide-zinc-800/40 px-5">
                {visibleSignals.length > 0 ? (
                  visibleSignals
                    .slice(0, 20)
                    .map((s) => (
                      <SignalCard
                        color={LENS_META[s.lens]?.color ?? "#71717a"}
                        key={s.id}
                        signal={s}
                      />
                    ))
                ) : (
                  <div className="py-12 text-center text-xs text-zinc-700">
                    No signals for this lens
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Evidence Sources ──────────────────────────────────────────────── */}
        {companySignals.length > 0 &&
          (() => {
            const allSources = [
              ...new Set(
                companySignals.flatMap((s) => s.source_urls).filter(Boolean)
              ),
            ].slice(0, 16);
            return allSources.length > 0 ? (
              <div
                className="rounded-xl p-5"
                style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-bold font-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em]">
                    Evidence Sources
                  </span>
                  <span className="rounded bg-zinc-800/50 px-1.5 py-0.5 font-mono text-[9px] text-zinc-700">
                    {allSources.length} domains
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allSources.map((url, i) => {
                    const sig = companySignals.find((s) =>
                      s.source_urls.includes(url)
                    );
                    const color = sig ? LENS_META[sig.lens]?.color : "#71717a";
                    return (
                      <a
                        className="rounded border px-2 py-1 font-mono text-[9px] text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                        href={url}
                        key={i}
                        rel="noopener noreferrer"
                        style={{
                          borderColor: "rgba(255,255,255,0.08)",
                          borderLeftColor: color,
                          borderLeftWidth: "2px",
                          background: "rgba(255,255,255,0.02)",
                        }}
                        target="_blank"
                        title={url}
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
