"use client";

import { useMemo, useState } from "react";
import DashboardNav from "@/components/dashboard-nav";
import {
  type AgentInfo,
  agents,
  type Signal,
  signals,
} from "@/lib/mock-data";

/* ============================================
   ARGUS COMMAND CENTER
   Dark editorial war room — calm & expensive
   ============================================ */

/* Agent health scores (deterministic from data) */
const agentHealthScores: Record<string, number> = {
  "mkt-001": 97,
  "fil-001": 94,
  "soc-001": 92,
  "sup-001": 43,
  "nws-001": 96,
};

/* Correlation events (synthesized from signals) */
const correlationEvents = [
  {
    id: "cor-001",
    time: "23:08",
    summary: "NVIDIA price drop ↔ TSMC utilization decline",
    agents: ["mkt-001", "sup-001"],
    confidence: 0.91,
  },
  {
    id: "cor-002",
    time: "23:06",
    summary: "Anthropic hiring surge ↔ FTC investigation scope",
    agents: ["soc-001", "nws-001"],
    confidence: 0.87,
  },
  {
    id: "cor-003",
    time: "23:03",
    summary: "Tesla inventory divergence ↔ supply chain stress",
    agents: ["fil-001", "sup-001"],
    confidence: 0.94,
  },
  {
    id: "cor-004",
    time: "22:58",
    summary: "Cloudflare degradation ↔ vendor risk escalation",
    agents: ["sup-001", "nws-001"],
    confidence: 0.82,
  },
  {
    id: "cor-005",
    time: "22:55",
    summary: "Microsoft RFPs ↔ competitor hiring pattern",
    agents: ["soc-001", "mkt-001"],
    confidence: 0.76,
  },
  {
    id: "cor-006",
    time: "22:50",
    summary: "NVDA options activity ↔ price drop signal",
    agents: ["mkt-001", "fil-001"],
    confidence: 0.88,
  },
  {
    id: "cor-007",
    time: "22:48",
    summary: "API key exposure ↔ brand risk assessment",
    agents: ["nws-001", "soc-001"],
    confidence: 0.97,
  },
];

/* Sparkline data — signals per hour over last 24h */
const sparklineData = [
  4, 6, 3, 5, 8, 7, 12, 9, 14, 11, 16, 13, 18, 15, 21, 17, 24, 19, 22, 20, 26,
  23, 28, 31,
];

/* Agent name to short initials mapping */
const agentInitials: Record<string, string> = {
  "mkt-001": "MD",
  "fil-001": "FD",
  "soc-001": "SD",
  "sup-001": "SP",
  "nws-001": "ND",
};

const agentIdToName: Record<string, string> = {
  "mkt-001": "MarketDataBot",
  "fil-001": "FilingDataBot",
  "soc-001": "SocialDataBot",
  "sup-001": "SupplierDataBot",
  "nws-001": "NewsDataBot",
};

/* ---- SVG Health Ring Component ---- */
function HealthRing({
  percent,
  size = 180,
  strokeWidth = 10,
  color,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg
      height={size}
      style={{ transform: "rotate(-90deg)" }}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <title>Health Score Ring</title>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={radius}
        stroke="rgba(138, 154, 142, 0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={radius}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

/* ---- Sparkline Component (SVG area chart) ---- */
function Sparkline({
  data,
  width = 800,
  height = 60,
  color = "#A8A890",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (v / max) * (height - 8),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
    >
      <title>Sparkline Chart</title>
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

/* ---- Mini Progress Bar ---- */
function ProgressBar({
  value,
  max = 100,
  color,
}: {
  value: number;
  max?: number;
  color: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "6px",
        borderRadius: "3px",
        background: "rgba(138, 154, 142, 0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${(value / max) * 100}%`,
          height: "100%",
          borderRadius: "3px",
          background: color,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const collectionAgents = agents.filter((a) => a.type === "collection");
  const [selectedAgentId, setSelectedAgentId] = useState(
    collectionAgents[0]?.id ?? "mkt-001"
  );

  const selectedAgent = collectionAgents.find((a) => a.id === selectedAgentId);
  const healthScore = agentHealthScores[selectedAgentId] ?? 0;
  const healthColor = healthScore >= 80 ? "#4ADE80" : "#C4704B";

  /* Coverage, Freshness, Correlation metrics per agent */
  const metrics = useMemo(() => {
    const agentSignals = signals.filter(
      (s: Signal) => s.agentId === selectedAgentId
    );
    const coverage = Math.min(
      100,
      Math.round(
        (selectedAgent?.memoryEntries ?? 0) / 50 + agentSignals.length * 5
      )
    );
    const freshness = healthScore >= 80 ? 94 : 61;
    const correlation = Math.round(
      (agentSignals.reduce((sum: number, s: Signal) => sum + s.confidence, 0) /
        Math.max(agentSignals.length, 1)) *
        100
    );
    return { coverage, freshness, correlation };
  }, [selectedAgentId, selectedAgent, healthScore]);

  return (
    <div style={{ background: "#0A0F0D", minHeight: "100vh" }}>
      <DashboardNav />

      {/* Spacer for fixed nav */}
      <div style={{ height: "16px" }} />

      {/* ============ MAIN WORKSPACE CANVAS ============ */}
      <section
        style={{
          padding: "24px 48px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#0F1A12",
            borderRadius: "24px",
            border: "1px solid #2A6B3F",
            padding: "28px",
            transition: "box-shadow 0.4s ease",
          }}
        >
          {/* ---- Three-Column Grid ---- */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr 320px",
              gap: "24px",
              minHeight: "480px",
            }}
          >
            {/* === LEFT: Agent List === */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#8A9A8E",
                  marginBottom: "12px",
                  paddingLeft: "8px",
                }}
              >
                Collection Agents
              </p>
              {collectionAgents.map((agent: AgentInfo) => {
                const isSelected = agent.id === selectedAgentId;
                const score = agentHealthScores[agent.id] ?? 0;
                const scoreColor = score >= 80 ? "#4ADE80" : "#C4704B";

                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background =
                          "rgba(138, 154, 142, 0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 12px",
                      borderRadius: "16px",
                      border: "none",
                      background: isSelected
                        ? "rgba(74, 222, 128, 0.06)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      textAlign: "left",
                      width: "100%",
                    }}
                    type="button"
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #A8A890, #C4704B)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0A0F0D",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {agentInitials[agent.id] ?? "??"}
                      </span>
                    </div>

                    {/* Name + status */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#F5F5F0",
                          marginBottom: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {agent.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "11px",
                          color: "#8A9A8E",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {(() => {
                          if (agent.status === "error") {
                            return "Retrying…";
                          }
                          if (agent.status === "running") {
                            return "Active";
                          }
                          return "Idle";
                        })()}
                      </p>
                    </div>

                    {/* Health % */}
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: scoreColor,
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                      }}
                    >
                      {score}%
                    </span>
                  </button>
                );
              })}
            </div>

            {/* === CENTER: Health Ring + Metrics === */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "32px",
                padding: "20px 0",
              }}
            >
              {/* Health Ring with label */}
              <div style={{ position: "relative" }}>
                <HealthRing
                  color={healthColor}
                  percent={healthScore}
                  size={180}
                  strokeWidth={10}
                />
                {/* Centered text inside the ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "40px",
                      fontWeight: 600,
                      color: healthColor,
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {healthScore}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#8A9A8E",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginTop: "4px",
                    }}
                  >
                    Health
                  </span>
                </div>
              </div>

              {/* Agent name */}
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "20px",
                  fontWeight: 400,
                  color: "#F5F5F0",
                  textAlign: "center",
                }}
              >
                {selectedAgent?.name ?? "Unknown Agent"}
              </p>

              {/* Three metric mini-cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                  width: "100%",
                  maxWidth: "420px",
                }}
              >
                {[
                  {
                    label: "Coverage",
                    value: metrics.coverage,
                    color: "#4ADE80",
                  },
                  {
                    label: "Freshness",
                    value: metrics.freshness,
                    color: "#5B8BDA",
                  },
                  {
                    label: "Correlation",
                    value: metrics.correlation,
                    color: "#A8A890",
                  },
                ].map((m) => {
                  // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/noNoninteractiveElementInteractions: presentational hover
                  return (
                    <div
                      key={m.label}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      style={{
                        background: "rgba(138, 154, 142, 0.04)",
                        borderRadius: "16px",
                        border: "1px solid rgba(138, 154, 142, 0.06)",
                        padding: "16px",
                        transition: "all 0.3s ease",
                        cursor: "default",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#8A9A8E",
                          marginBottom: "8px",
                        }}
                      >
                        {m.label}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "24px",
                          fontWeight: 600,
                          color: "#F5F5F0",
                          marginBottom: "10px",
                          fontVariantNumeric: "tabular-nums",
                          lineHeight: 1,
                        }}
                      >
                        {m.value}%
                      </p>
                      <ProgressBar color={m.color} value={m.value} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* === RIGHT: Correlation Feed === */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#8A9A8E",
                  }}
                >
                  Correlation Feed
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4ADE80",
                      animation: "pulse-live 2s infinite",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "#8A9A8E",
                    }}
                  >
                    LIVE
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                {correlationEvents.map((event) => {
                  // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/noNoninteractiveElementInteractions: presentational hover
                  return (
                    <div
                      key={event.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(138, 154, 142, 0.06)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(138, 154, 142, 0.03)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      style={{
                        padding: "14px 12px",
                        borderRadius: "12px",
                        background: "rgba(138, 154, 142, 0.03)",
                        border: "1px solid rgba(138, 154, 142, 0.04)",
                        transition: "all 0.25s ease",
                        cursor: "default",
                      }}
                    >
                      {/* Top row: time + confidence */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "#8A9A8E",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {event.time}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: (() => {
                              if (event.confidence >= 0.9) {
                                    return "#4ADE80";
                                  }
                              if (event.confidence >= 0.8) {
                                    return "#A8A890";
                                  }
                              return "#C4704B";
                            })(),
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {(event.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* Summary */}
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#F5F5F0",
                          lineHeight: 1.45,
                          marginBottom: "8px",
                        }}
                      >
                        {event.summary}
                      </p>

                      {/* Agent tags */}
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {event.agents.map((agentId) => (
                          <span
                            key={agentId}
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "10px",
                              fontWeight: 500,
                              color: "#8A9A8E",
                              background: "rgba(138, 154, 142, 0.08)",
                              padding: "3px 8px",
                              borderRadius: "100px",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {agentIdToName[agentId]?.replace("DataBot", "") ??
                              agentId}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---- Quick Actions Bar ---- */}
          <div
            style={{
              marginTop: "24px",
              background:
                "linear-gradient(135deg, #143D26 0%, rgba(20, 61, 38, 0.4) 100%)",
              borderRadius: "16px",
              border: "1px solid rgba(42, 107, 63, 0.15)",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#8A9A8E",
              }}
            >
              Quick Actions
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {[
                "Run Correlation",
                "Refresh Memory",
                "View Lenses",
                "Export Brief",
              ].map((action) => (
                <button
                  key={action}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F0F0F0";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#000000",
                    background: "#FFFFFF",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "100px",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    letterSpacing: "0.02em",
                  }}
                  type="button"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Sparkline Strip ---- */}
          <div
            style={{
              marginTop: "20px",
              borderRadius: "12px",
              overflow: "hidden",
              background: "rgba(138, 154, 142, 0.02)",
              padding: "16px 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#8A9A8E",
                }}
              >
                Signals Correlated — Last 24h
              </p>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#F5F5F0",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {sparklineData.reduce((a, b) => a + b, 0)}
              </span>
            </div>
            <Sparkline color="#A8A890" data={sparklineData} height={56} />
          </div>
        </div>
  </section>

  {
    /* Small bottom spacer */
  }
  <div style={{ height: "48px" }} />;
  </div>
  )
}
