"use client";

import { useMemo, useState } from "react";
import DashboardNav from "@/components/dashboard-nav.tsx";
import {
  type AgentActivity,
  type AgentInfo,
  agentActivities,
  agents as allAgents,
} from "@/lib/mock-data.ts";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONSTANTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* Collection-only agents (exclude lens agents from the tab bar) */
const collectionAgents = allAgents.filter((a) => a.type === "collection");

/* Signature color per agent */
const agentColors: Record<string, string> = {
  "mkt-001": "#A8A890", // sage — MarketDataBot
  "fil-001": "#7B9AB5", // blue-gray — FilingDataBot
  "soc-001": "#C4856A", // terracotta — SocialDataBot
  "sup-001": "#C4973B", // amber — SupplierDataBot
  "nws-001": "#A87BD8", // purple-gray — NewsDataBot
};

/* Timeline event types */
type TimelineEventType = "success" | "stale" | "blocked" | "correlated";

const timelineColors: Record<TimelineEventType, string> = {
  success: "#A8A890",
  stale: "#C4856A",
  blocked: "#C4973B",
  correlated: "#7B9AB5",
};

/* Fake config data per agent */
const agentConfigs: Record<
  string,
  {
    frequency: string;
    targets: string[];
    proxyPool: string;
    lenses: string[];
    costToday: string;
    healthScore: number;
  }
> = {
  "mkt-001": {
    frequency: "Every 15 minutes",
    targets: ["amazon.com/dp/*", "bestbuy.com/site/*", "newegg.com/p/*"],
    proxyPool: "Bright Data — Residential US/EU",
    lenses: ["GTM", "Finance"],
    costToday: "$4.20",
    healthScore: 94,
  },
  "fil-001": {
    frequency: "Every 30 minutes",
    targets: ["sec.gov/cgi-bin/browse-edgar", "sec.gov/cgi-bin/viewer"],
    proxyPool: "Bright Data — Datacenter US",
    lenses: ["Finance"],
    costToday: "$2.80",
    healthScore: 98,
  },
  "soc-001": {
    frequency: "Every 10 minutes",
    targets: ["linkedin.com/company/*/jobs", "linkedin.com/company/*/people"],
    proxyPool: "Bright Data — Residential Global",
    lenses: ["GTM", "Security"],
    costToday: "$6.50",
    healthScore: 87,
  },
  "sup-001": {
    frequency: "Every 20 minutes",
    targets: [
      "status.cloudflare.com",
      "tsmc.com/english/news",
      "status.aws.amazon.com",
    ],
    proxyPool: "Bright Data — Residential APAC/US",
    lenses: ["Finance", "Security"],
    costToday: "$3.10",
    healthScore: 62,
  },
  "nws-001": {
    frequency: "Every 5 minutes",
    targets: [
      "reuters.com/technology",
      "reuters.com/legal",
      "bloomberg.com/technology",
    ],
    proxyPool: "Bright Data — Datacenter Global",
    lenses: ["GTM", "Finance", "Security"],
    costToday: "$5.90",
    healthScore: 96,
  },
};

/* ─── derive timeline events from agentActivities ─── */
function getTimelineEvents(agentId: string): (AgentActivity & {
  eventType: TimelineEventType;
  extract: string;
  cogneeNode: string;
})[] {
  const activities = agentActivities.filter((a) => a.agentId === agentId);
  return activities.map((act, i) => {
    let eventType: TimelineEventType = "success";
    if (act.status === "degraded") {
      eventType = "stale";
    }
    if (act.status === "error") {
      eventType = "blocked";
    }
    // Mark every 3rd success as correlated for visual variety
    if (act.status === "success" && i % 3 === 2) {
      eventType = "correlated";
    }

    return {
      ...act,
      eventType,
      extract: `Extracted data from ${act.targetUrl.split("/").slice(0, 3).join("/")} — ${act.action.toLowerCase()}. Confidence: ${(act.confidence * 100).toFixed(0)}%.`,
      cogneeNode: `cg-${act.id.replace("act-", "")}-${Math.abs(
        Number.parseInt(act.id.replace("act-", ""), 10) * 7919
      )
        .toString(16)
        .slice(0, 6)}`,
    };
  });
}

/* ─── relative time ─── */
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COMPONENTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ─── Health Score Ring ─── */
function HealthRing({ score, color }: { score: number; color: string }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      style={{
        position: "relative",
        width: "120px",
        height: "120px",
        flexShrink: 0,
      }}
    >
      <svg height="120" viewBox="0 0 120 120" width="120">
        <title>Health Score Ring</title>
        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke="rgba(42, 107, 63, 0.15)"
          strokeWidth="6"
        />
        {/* Score arc */}
        <circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="6"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "60px 60px",
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-serif)",
          fontSize: "36px",
          color: "#F5F5F0",
        }}
      >
        {score}
      </div>
    </div>
  );
}

/* ─── Sparkline (reusable) ─── */
function Sparkline({
  data,
  color,
  width = 120,
  height = 36,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const uid = `sparkline-${color.replace("#", "")}-${width}`;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg height={height} style={{ display: "block" }} width={width}>
      <title>Sparkline Chart</title>
      <defs>
        <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${uid})`}
        points={`0,${height} ${points} ${width},${height}`}
      />
      <polyline
        fill="none"
        points={points}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ─── Timeline Dot ─── */
function TimelineDot({
  event,
  isLast,
}: {
  event: ReturnType<typeof getTimelineEvents>[number];
  isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const dotColor = timelineColors[event.eventType];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", gap: "16px", position: "relative" }}
    >
      {/* Vertical line + dot */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "20px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: dotColor,
            border: `2px solid ${dotColor}`,
            boxShadow: hovered ? `0 0 8px ${dotColor}60` : "none",
            transition: "box-shadow 0.2s ease",
            zIndex: 2,
            flexShrink: 0,
          }}
        />
        {!isLast && (
          <div
            style={{
              width: "2px",
              flex: 1,
              minHeight: "40px",
              background: "#2A6B3F",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "20px" }}>
        {/* Summary line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#F5F5F0",
            }}
          >
            {event.action}
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              color: "#8A9A8E",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              background: `${dotColor}18`,
            }}
          >
            {event.eventType}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "#8A9A8E",
          }}
        >
          {relativeTime(event.timestamp)}
        </span>

        {/* Expanded card on hover */}
        {hovered && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: "10px",
              background: "#0F1A12",
              border: "1px solid #2A6B3F",
              borderRadius: "14px",
              padding: "16px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#8A9A8E",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                URL
              </span>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "#F5F5F0",
                  margin: "4px 0 0 0",
                  wordBreak: "break-all",
                }}
              >
                {event.targetUrl}
              </p>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#8A9A8E",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Raw Extract
              </span>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "#B0BFB5",
                  margin: "4px 0 0 0",
                  lineHeight: 1.6,
                }}
              >
                {event.extract}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid rgba(42, 107, 63, 0.2)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "#6B7A6F",
                }}
              >
                {event.cogneeNode}
              </span>
              <button
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(168, 168, 144, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
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
                }}
                type="button"
              >
                View in Lens →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Lens Card (for bottom section) ─── */
function LensCard({
  name,
  color,
  icon,
  signalData,
}: {
  name: string;
  color: string;
  icon: React.ReactNode;
  signalData: number[];
}) {
  return (
    <div
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 4px 24px ${color}15`;
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
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "16px",
          background: `${color}12`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      {/* Name */}
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "18px",
          color: "#F5F5F0",
        }}
      >
        {name}
      </span>

      {/* Sparkline */}
      <Sparkline color={color} data={signalData} height={28} width={100} />

      {/* Label */}
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#8A9A8E",
        }}
      >
        7-day signal flow
      </span>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | "all">("all");

  /* Resolve the selected agent */
  const selectedAgent: AgentInfo | null = useMemo(
    () =>
      selectedAgentId === "all"
        ? collectionAgents[0]
        : (collectionAgents.find((a) => a.id === selectedAgentId) ?? null),
    [selectedAgentId]
  );

  const agentColor = selectedAgent
    ? (agentColors[selectedAgent.id] ?? "#A8A890")
    : "#A8A890";

  const config = selectedAgent ? agentConfigs[selectedAgent.id] : null;
  const timelineEvents = selectedAgent
    ? getTimelineEvents(selectedAgent.id)
    : [];

  /* Per-lens signal counts for sparklines (mocked 7-day data) */
  const lensSignalData = useMemo(
    () => ({
      GTM: [4, 7, 5, 9, 6, 8, 11],
      Finance: [3, 5, 4, 6, 8, 5, 7],
      Security: [2, 3, 5, 4, 3, 6, 4],
    }),
    []
  );

  /* Tabs */
  const tabs: { label: string; id: string }[] = [
    { label: "All Agents", id: "all" },
    ...collectionAgents.map((a) => ({ label: a.name, id: a.id })),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F0D" }}>
      <DashboardNav />
      {/* Nav spacer */}
      <div style={{ height: "16px" }} />

      <main
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "32px 48px 120px",
        }}
      >
        {/* ═══════ Tab Switcher ═══════ */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "6px",
              padding: "4px",
              background: "rgba(15, 26, 18, 0.6)",
              borderRadius: "100px",
              border: "1px solid rgba(42, 107, 63, 0.15)",
            }}
          >
            {tabs.map((tab) => {
              const isActive = selectedAgentId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedAgentId(tab.id)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#F5F5F0";
                      e.currentTarget.style.background = "#162119";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#8A9A8E";
                      e.currentTarget.style.background = "#0F1A12";
                    }
                  }}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: "0.02em",
                    padding: "8px 20px",
                    borderRadius: "100px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    background: isActive ? "#FFFFFF" : "#0F1A12",
                    color: isActive ? "#000000" : "#8A9A8E",
                    whiteSpace: "nowrap",
                  }}
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════ "All Agents" overview ═══════ */}
        {selectedAgentId === "all" && (
          <div>
            {/* Agent grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "20px",
                marginBottom: "48px",
              }}
            >
              {collectionAgents.map((agent, i) => {
                const color = agentColors[agent.id] ?? "#A8A890";
                const cfg = agentConfigs[agent.id];
                return (
                  <div
                    className="animate-signal-in"
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedAgentId(agent.id);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color;
                      e.currentTarget.style.boxShadow = `0 8px 32px ${color}15`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${color} #2A6B3F #2A6B3F #2A6B3F`;
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    role="button"
                    style={{
                      background: "#0F1A12",
                      borderRadius: "24px",
                      borderWidth: "3px 1px 1px 1px",
                      borderStyle: "solid",
                      borderColor: `${color} #2A6B3F #2A6B3F #2A6B3F`,
                      padding: "28px",
                      cursor: "pointer",
                      transition:
                        "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
                      animationDelay: `${i * 80}ms`,
                    }}
                    tabIndex={0}
                  >
                    {/* Name + Status */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "20px",
                          color: "#F5F5F0",
                        }}
                      >
                        {agent.name}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          className={
                            agent.status === "running" ? "animate-radiate" : ""
                          }
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: (() => {
                              if (agent.status === "running") {
                                return "#A8A890";
                              }
                              if (agent.status === "error") {
                                return "#C4856A";
                              }
                              return "#8A9A8E";
                            })(),
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            color: (() => {
                              if (agent.status === "running") {
                                return "#A8A890";
                              }
                              if (agent.status === "error") {
                                return "#C4856A";
                              }
                              return "#8A9A8E";
                            })(),
                          }}
                        >
                          {agent.status}
                        </span>
                      </div>
                    </div>

                    {/* Role */}
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "13px",
                        color: "#8A9A8E",
                        lineHeight: 1.6,
                        margin: "0 0 16px 0",
                      }}
                    >
                      {agent.role}
                    </p>

                    {/* Stats row */}
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginBottom: "16px",
                      }}
                    >
                      {[
                        {
                          label: "Memory",
                          value: agent.memoryEntries.toLocaleString(),
                        },
                        { label: "Health", value: `${cfg?.healthScore ?? 0}%` },
                        { label: "Cost", value: cfg?.costToday ?? "—" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          style={{
                            background: "#143D26",
                            borderRadius: "8px",
                            padding: "6px 12px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-sans)",
                              fontSize: "11px",
                              color: "#8A9A8E",
                              display: "block",
                              marginBottom: "2px",
                            }}
                          >
                            {s.label}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "13px",
                              color: "#F5F5F0",
                              fontWeight: 600,
                            }}
                          >
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Sparkline */}
                    <Sparkline
                      color={color}
                      data={agent.activityData}
                      height={32}
                      width={280}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {selectedAgentId !== "all" && selectedAgent && config && (
          <>
            {/* ═══════ HERO CARD ═══════ */}
            <div
              className="animate-signal-in"
              style={{
                background: "#0F1A12",
                borderRadius: "24px",
                borderWidth: "3px 1px 1px 1px",
                borderStyle: "solid",
                borderColor: `${agentColor} #2A6B3F #2A6B3F #2A6B3F`,
                padding: "36px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "36px",
                  flexWrap: "wrap",
                }}
              >
                {/* Health ring */}
                <HealthRing color={agentColor} score={config.healthScore} />

                {/* Agent info */}
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "24px",
                      fontWeight: 400,
                      color: "#F5F5F0",
                      margin: "0 0 6px 0",
                    }}
                  >
                    {selectedAgent.name}
                  </h2>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "14px",
                      color: "#8A9A8E",
                      margin: "0 0 20px 0",
                      lineHeight: 1.6,
                    }}
                  >
                    {selectedAgent.role}
                  </p>

                  {/* Status pills */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      {
                        label: `Last Run: ${relativeTime(agentActivities.find((a) => a.agentId === selectedAgent.id)?.timestamp ?? new Date().toISOString())}`,
                      },
                      {
                        label: `Memory Nodes: ${selectedAgent.memoryEntries.toLocaleString()}`,
                      },
                      { label: `Cost Today: ${config.costToday}` },
                    ].map((pill) => (
                      <span
                        key={pill.label}
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "12px",
                          color: "#8A9A8E",
                          background: "#143D26",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pill.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════ Two Columns ═══════ */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60% 40%",
                gap: "28px",
                marginBottom: "48px",
              }}
            >
              {/* ─── Left: Recent Collection Timeline ─── */}
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "20px",
                    color: "#F5F5F0",
                    margin: "0 0 24px 0",
                  }}
                >
                  Recent Collection
                </h3>

                <div>
                  {timelineEvents.length > 0 ? (
                    timelineEvents.map((event, i) => (
                      <TimelineDot
                        event={event}
                        isLast={i === timelineEvents.length - 1}
                        key={event.id}
                      />
                    ))
                  ) : (
                    <p
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "14px",
                        color: "#8A9A8E",
                        padding: "32px 0",
                      }}
                    >
                      No recent collection events.
                    </p>
                  )}
                </div>
              </div>

              {/* ─── Right: Agent Configuration ─── */}
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "20px",
                    color: "#F5F5F0",
                    margin: "0 0 24px 0",
                  }}
                >
                  Agent Configuration
                </h3>

                <div
                  style={{
                    background: "#143D26",
                    borderRadius: "20px",
                    padding: "24px",
                  }}
                >
                  {[
                    {
                      label: "Scrape Frequency",
                      value: config.frequency,
                      type: "text",
                    },
                    {
                      label: "Target URLs",
                      value: config.targets.join("\n"),
                      type: "textarea",
                    },
                    {
                      label: "Proxy Pool",
                      value: config.proxyPool,
                      type: "text",
                    },
                    {
                      label: "Assigned Lenses",
                      value: config.lenses.join(", "),
                      type: "text",
                    },
                  ].map((field) => {
                    const fieldId = `config-${field.label.toLowerCase().replace(/\s+/g, "-")}`;
                    return (
                      <div key={field.label} style={{ marginBottom: "18px" }}>
                        <label
                          htmlFor={fieldId}
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "12px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            color: "#8A9A8E",
                            display: "block",
                            marginBottom: "6px",
                          }}
                        >
                          {field.label}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            id={fieldId}
                            readOnly
                            rows={config.targets.length}
                            style={{
                              width: "100%",
                              fontFamily: "var(--font-mono)",
                              fontSize: "13px",
                              color: "#F5F5F0",
                              background: "rgba(10, 15, 13, 0.5)",
                              border: "1px solid #2A6B3F",
                              borderRadius: "10px",
                              padding: "10px 14px",
                              resize: "none",
                              lineHeight: 1.8,
                              outline: "none",
                            }}
                            value={field.value}
                          />
                        ) : (
                          <input
                            id={fieldId}
                            readOnly
                            style={{
                              width: "100%",
                              fontFamily: "var(--font-mono)",
                              fontSize: "13px",
                              color: "#F5F5F0",
                              background: "rgba(10, 15, 13, 0.5)",
                              border: "1px solid #2A6B3F",
                              borderRadius: "10px",
                              padding: "10px 14px",
                              outline: "none",
                            }}
                            type="text"
                            value={field.value}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ═══════ Lens Assignment Section ═══════ */}
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "20px",
                  color: "#F5F5F0",
                  margin: "0 0 8px 0",
                  textAlign: "center",
                }}
              >
                Lens Assignment
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  color: "#8A9A8E",
                  textAlign: "center",
                  margin: "0 0 32px 0",
                }}
              >
                How {selectedAgent.name}&apos;s data flows through the analysis
                pipeline
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0",
                  justifyContent: "center",
                }}
              >
                {/* GTM Lens */}
                <LensCard
                  color="#C4973B"
                  icon={
                    <svg fill="none" height="28" viewBox="0 0 28 28" width="28">
                      <title>GTM Lens Icon</title>
                      <path
                        d="M14 3L25 9V19L14 25L3 19V9L14 3Z"
                        fill="none"
                        stroke="#C4973B"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="14"
                        cy="14"
                        r="4"
                        stroke="#C4973B"
                        strokeWidth="1.5"
                      />
                    </svg>
                  }
                  name="GTM"
                  signalData={lensSignalData.GTM}
                />

                {/* Connector → CorrelationEngine */}
                <div
                  style={{
                    width: "40px",
                    height: "2px",
                    background: "linear-gradient(90deg, #C4973B, #A8A890)",
                    flexShrink: 0,
                  }}
                />

                {/* CorrelationEngine (center) */}
                <div
                  style={{
                    background: "#0F1A12",
                    border: "1px solid #A8A890",
                    borderRadius: "20px",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #A8A890, #C4856A)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
                      <title>Correlation Engine Icon</title>
                      <circle cx="12" cy="12" fill="#0A0F0D" r="3" />
                      <circle
                        cx="12"
                        cy="12"
                        r="8"
                        stroke="#0A0F0D"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "#A8A890",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Correlation Engine
                  </span>
                </div>

                {/* Connector → Finance & Security */}
                <div
                  style={{
                    width: "40px",
                    height: "2px",
                    background: "linear-gradient(90deg, #A8A890, #7B9AB5)",
                    flexShrink: 0,
                  }}
                />

                {/* Finance Lens */}
                <LensCard
                  color="#7B9AB5"
                  icon={
                    <svg fill="none" height="28" viewBox="0 0 28 28" width="28">
                      <title>Finance Lens Icon</title>
                      <rect
                        height="16"
                        rx="3"
                        stroke="#7B9AB5"
                        strokeWidth="1.5"
                        width="22"
                        x="3"
                        y="6"
                      />
                      <path
                        d="M7 18L12 13L16 16L21 10"
                        stroke="#7B9AB5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  }
                  name="Finance"
                  signalData={lensSignalData.Finance}
                />

                {/* Connector */}
                <div
                  style={{
                    width: "40px",
                    height: "2px",
                    background: "linear-gradient(90deg, #7B9AB5, #A87BD8)",
                    flexShrink: 0,
                  }}
                />

                {/* Security Lens */}
                <LensCard
                  color="#A87BD8"
                  icon={
                    <svg fill="none" height="28" viewBox="0 0 28 28" width="28">
                      <title>Security Lens Icon</title>
                      <path
                        d="M14 3L23 7V13C23 19.075 19.25 24.425 14 26C8.75 24.425 5 19.075 5 13V7L14 3Z"
                        fill="none"
                        stroke="#A87BD8"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M10 14L13 17L18 11"
                        stroke="#A87BD8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  }
                  name="Security"
                  signalData={lensSignalData.Security}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
