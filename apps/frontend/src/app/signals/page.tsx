"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardNav from "@/components/dashboard-nav.tsx";
import { agents, type Signal, signals } from "@/lib/mock-data.ts";

/* ─── signal type → badge config ─── */
const badgeConfig: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  raw: { label: "RAW", bg: "rgba(168, 168, 144, 0.14)", color: "#A8A890" },
  correlated: {
    label: "CORRELATED",
    bg: "rgba(196, 133, 106, 0.14)",
    color: "#C4856A",
  },
  "lens-gtm": {
    label: "LENS-GTM",
    bg: "rgba(196, 151, 59, 0.14)",
    color: "#C4973B",
  },
  "lens-finance": {
    label: "LENS-FINANCE",
    bg: "rgba(91, 123, 154, 0.14)",
    color: "#7B9AB5",
  },
  "lens-security": {
    label: "LENS-SECURITY",
    bg: "rgba(139, 91, 218, 0.14)",
    color: "#A87BD8",
  },
};

/* ─── map each signal to a badge type ─── */
function getSignalBadge(signal: Signal): {
  label: string;
  bg: string;
  color: string;
} {
  if (signal.correlatedSignals && signal.correlatedSignals.length > 0) {
    return badgeConfig.correlated;
  }
  const lensKey = `lens-${signal.lens}` as keyof typeof badgeConfig;
  if (badgeConfig[lensKey]) {
    return badgeConfig[lensKey];
  }
  return badgeConfig.raw;
}

/* ─── agent name from agentId ─── */
function getAgentName(agentId: string): string {
  const agent = agents.find((a) => a.id === agentId);
  return agent?.name ?? agentId;
}

/* ─── relative time from ISO string ─── */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) {
    return "just now";
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── format time for divider headers ─── */
function formatDividerTime(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

/* ─── generate a stable Cognee node ID ─── */
function cogneeNodeId(signalId: string): string {
  const hash = signalId.replace("sig-", "");
  return `cg-${hash}-${Math.abs(Number.parseInt(hash, 10) * 7919)
    .toString(16)
    .slice(0, 6)}`;
}

/* ─── Radar empty state SVG ─── */
function RadarEmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: "24px",
      }}
    >
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        {/* Outer ring */}
        <svg
          fill="none"
          height="120"
          style={{ position: "absolute", top: 0, left: 0 }}
          viewBox="0 0 120 120"
          width="120"
        >
          <title>Radar Grid Outer Rings</title>
          <circle
            cx="60"
            cy="60"
            opacity="0.4"
            r="56"
            stroke="#2A6B3F"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <circle
            cx="60"
            cy="60"
            opacity="0.3"
            r="40"
            stroke="#2A6B3F"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
          <circle
            cx="60"
            cy="60"
            opacity="0.2"
            r="24"
            stroke="#2A6B3F"
            strokeWidth="1"
          />
          {/* Crosshairs */}
          <line
            opacity="0.2"
            stroke="#2A6B3F"
            strokeWidth="0.5"
            x1="60"
            x2="60"
            y1="4"
            y2="116"
          />
          <line
            opacity="0.2"
            stroke="#2A6B3F"
            strokeWidth="0.5"
            x1="4"
            x2="116"
            y1="60"
            y2="60"
          />
          {/* Center dot */}
          <circle cx="60" cy="60" fill="#A8A890" opacity="0.6" r="3" />
          {/* Dish arm */}
          <line
            opacity="0.5"
            stroke="#8A9A8E"
            strokeLinecap="round"
            strokeWidth="1.5"
            x1="60"
            x2="88"
            y1="60"
            y2="28"
          />
          <circle
            cx="88"
            cy="28"
            fill="none"
            opacity="0.4"
            r="4"
            stroke="#8A9A8E"
            strokeWidth="1"
          />
        </svg>
        {/* Sweep line */}
        <div
          className="animate-radar-sweep"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "56px",
            height: "2px",
            background:
              "linear-gradient(90deg, rgba(168,168,144,0.5), transparent)",
            transformOrigin: "0 50%",
          }}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "20px",
            color: "#8A9A8E",
            marginBottom: "8px",
          }}
        >
          Waiting for signals...
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "rgba(138, 154, 142, 0.5)",
            lineHeight: 1.6,
          }}
        >
          The fleet is scanning. Signals will appear here as they arrive.
        </p>
      </div>
    </div>
  );
}

/* ─── Signal Card ─── */
function SignalCard({ signal, index }: { signal: Signal; index: number }) {
  const badge = getSignalBadge(signal);
  const agentName = getAgentName(signal.agentId);
  const nodeId = cogneeNodeId(signal.id);

  // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/noNoninteractiveElementInteractions: presentational hover
  return (
    <div
      className="animate-signal-in"
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "#3D8F56";
      e.currentTarget.style.boxShadow = "0 4px 24px rgba(42, 107, 63, 0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "#2A6B3F";
      e.currentTarget.style.boxShadow = "none";
    }}
    role="presentation"
    style={{
      background: "#0F1A12",
      border: "1px solid #2A6B3F",
      borderRadius: "20px",
      padding: "24px",
      animationDelay: `${index * 60}ms`,
      transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    }}
  >
    {/* ── Top Row: Avatar · Agent · Source · Timestamp ── */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
      }}
    >
      {/* Agent avatar */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #A8A890, #C4856A)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: 700,
          color: "#0A0F0D",
          flexShrink: 0,
          fontFamily: "var(--font-sans)",
        }}
      >
        {agentName.slice(0, 2).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              fontWeight: 600,
              color: "#F5F5F0",
            }}
          >
            {agentName}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "#8A9A8E",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "260px",
            }}
          >
            {signal.sourceUrl}
          </span>
        </div>
      </div>

      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          color: "#8A9A8E",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {relativeTime(signal.scrapedAt)}
      </span>
    </div>

    {/* ── Middle: Badge + Summary ── */}
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        {/* Signal type badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
            background: badge.bg,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>

        {/* Signal type name */}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#8A9A8E",
            letterSpacing: "0.02em",
          }}
        >
          {signal.signalType}
        </span>
      </div>

      {/* Finding text */}
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          color: "#F5F5F0",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {signal.finding}
      </p>
    </div>

    {/* ── Bottom: Metadata ── */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        paddingTop: "14px",
        borderTop: "1px solid rgba(42, 107, 63, 0.2)",
      }}
    >
      {/* Confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            color: "#8A9A8E",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Confidence
        </span>
        <div
          style={{
            width: "48px",
            height: "4px",
            borderRadius: "2px",
            background: "rgba(42, 107, 63, 0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${signal.confidence * 100}%`,
              borderRadius: "2px",
              background: (() => {
                if (signal.confidence > 0.85) {
                  return "#A8A890";
                }
                if (signal.confidence > 0.7) {
                  return "#C4856A";
                }
                return "#8A9A8E";
              })(),
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: (() => {
              if (signal.confidence > 0.85) {
                return "#A8A890";
              }
              if (signal.confidence > 0.7) {
                return "#C4856A";
              }
              return "#8A9A8E";
            })(),
          }}
        >
          {(signal.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Cognee Node */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#6B7A6F",
        }}
      >
        {nodeId}
      </span>

      {/* Trace link */}
      <button
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(168, 168, 144, 0.08)";
          e.currentTarget.style.borderColor = "rgba(168, 168, 144, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(168, 168, 144, 0.2)";
        }}
        style={{
          marginLeft: "auto",
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          fontWeight: 500,
          color: "#A8A890",
          background: "transparent",
          border: "1px solid rgba(168, 168, 144, 0.2)",
          borderRadius: "6px",
          padding: "4px 12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.02em",
        }}
        type="button"
      >
        Trace →
      </button>
    </div>
  );
}

/* ─── Time Divider ─── */
function TimeDivider({ time }: { time: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "8px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(138, 154, 142, 0.15), transparent)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#8A9A8E",
          whiteSpace: "nowrap",
        }}
      >
        {time}
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(138, 154, 142, 0.15), transparent)",
        }}
      />
    </div>
  );
}

/* ─── Sidebar Summary Card ─── */
function SidebarSummary({
  totalSignals,
  correlatedEvents,
  fleetHealth,
}: {
  totalSignals: number;
  correlatedEvents: number;
  fleetHealth: number;
}) {
  const stats = [
    { value: totalSignals, label: "TOTAL SIGNALS" },
    { value: correlatedEvents, label: "CORRELATED EVENTS" },
    { value: `${fleetHealth}%`, label: "FLEET HEALTH" },
  ];

  return (
    <div
      style={{
        position: "sticky",
        top: "96px",
        background: "#0F1A12",
        border: "1px solid #2A6B3F",
        borderRadius: "20px",
        padding: "28px",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#8A9A8E",
          margin: "0 0 24px 0",
        }}
      >
        Signal Summary
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "28px",
                color: "#F5F5F0",
                lineHeight: 1.1,
                marginBottom: "4px",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#8A9A8E",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div
        style={{
          marginTop: "28px",
          paddingTop: "20px",
          borderTop: "1px solid rgba(42, 107, 63, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          className="animate-radiate"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#A8A890",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "#8A9A8E",
          }}
        >
          Feed is live
        </span>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function SignalsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [feedSignals, setFeedSignals] = useState<Signal[]>([]);
  const [loaded, setLoaded] = useState(false);

  /* Simulate signals loading in */
  useEffect(() => {
    const timer = setTimeout(() => {
      setFeedSignals(signals);
      setLoaded(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  /* Auto-refresh simulation */
  useEffect(() => {
    if (!(autoRefresh && loaded)) {
      return;
    }
    const interval = setInterval(() => {
      /* In production this would be an SSE or poll. Here we just bump a timestamp. */
      setFeedSignals((prev) => [...prev]);
    }, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, loaded]);

  /* Stats */
  const correlatedCount = useMemo(
    () =>
      feedSignals.filter(
        (s) => s.correlatedSignals && s.correlatedSignals.length > 0
      ).length,
    [feedSignals]
  );
  const fleetHealth = 87; // Mock — production reads from agent health endpoint

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F0D" }}>
      <DashboardNav />
      {/* Spacer for fixed nav */}
      <div style={{ height: "16px" }} />

      <main
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "32px 48px 80px",
        }}
      >
        {/* ═══════ Header Bar ═══════ */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "36px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "32px",
                fontWeight: 400,
                color: "#F5F5F0",
                margin: "0 0 6px 0",
                letterSpacing: "-0.01em",
              }}
            >
              Live Signals
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: "#8A9A8E",
                margin: 0,
              }}
            >
              Raw collection and correlated intelligence as it happens
            </p>
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            onMouseEnter={(e) => {
              if (!autoRefresh) {
                e.currentTarget.style.borderColor = "#3D8F56";
                e.currentTarget.style.color = "#F5F5F0";
              }
            }}
            onMouseLeave={(e) => {
              if (!autoRefresh) {
                e.currentTarget.style.borderColor = "#2A6B3F";
                e.currentTarget.style.color = "#8A9A8E";
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              padding: "8px 20px",
              borderRadius: "100px",
              cursor: "pointer",
              transition: "all 0.25s ease",
              border: autoRefresh
                ? "1px solid transparent"
                : "1px solid #2A6B3F",
              background: autoRefresh ? "#FFFFFF" : "transparent",
              color: autoRefresh ? "#000000" : "#8A9A8E",
            }}
            type="button"
          >
            <div
              className={autoRefresh ? "" : "animate-subtle-pulse"}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: autoRefresh ? "#0A0F0D" : "#8A9A8E",
                transition: "background 0.2s ease",
              }}
            />
            Auto-refresh
          </button>
        </div>

        {/* ═══════ Content: Feed + Sidebar ═══════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* ─── Signal Feed ─── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {!loaded || feedSignals.length === 0 ? (
              <RadarEmptyState />
            ) : (
              feedSignals.map((signal, i) => (
                <div key={signal.id}>
                  {/* Every 5th card, insert a time divider */}
                  {i > 0 && i % 5 === 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <TimeDivider time={formatDividerTime(signal.scrapedAt)} />
                    </div>
                  )}
                  <SignalCard index={i} signal={signal} />
                </div>
              ))
            )}
          </div>

          {/* ─── Sidebar ─── */}
          <SidebarSummary
            correlatedEvents={correlatedCount}
            fleetHealth={fleetHealth}
            totalSignals={feedSignals.length}
          />
        </div>
      </main>
    </div>
  );
}
