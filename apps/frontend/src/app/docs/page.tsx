"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Footer from "@/components/footer";
import LandingNav from "@/components/landing-nav";

/* ─── Sidebar Section Data ─── */
const sidebarSections = [
  { id: "introduction", label: "Introduction" },
  { id: "quick-start", label: "Quick Start" },
  { id: "architecture", label: "Architecture" },
  { id: "collection-agents", label: "Collection Agents" },
  { id: "analysis-lenses", label: "Analysis Lenses" },
  { id: "api-reference", label: "API Reference" },
  { id: "memory-storage", label: "Memory & Storage" },
  { id: "configuration", label: "Configuration" },
  { id: "deployment", label: "Deployment" },
];

/* ─── Agent Data ─── */
const agents = [
  {
    name: "MarketDataBot",
    color: "#4ADE80",
    description:
      "Tracks real-time pricing, competitor product launches, market positioning changes, and promotional campaigns across e-commerce platforms and market aggregators.",
    sources: [
      "Amazon",
      "Yahoo Finance",
      "Google Shopping",
      "Competitor websites",
    ],
    output:
      "Structured price records, product metadata, competitor feature matrices",
    frequency:
      "Every 4 hours for tracked products, hourly during earnings season",
  },
  {
    name: "FilingDataBot",
    color: "#5B8BDA",
    description:
      "Monitors SEC filings (10-Q, 10-K, 8-K), earnings call transcripts, and regulatory disclosures. Detects divergence between public statements and filed numbers.",
    sources: ["SEC EDGAR", "Earnings transcripts", "Regulatory databases"],
    output:
      "Filing summaries, divergence alerts, key financial metrics extraction",
    frequency:
      "Real-time for 8-K filings, daily for 10-Q/10-K, post-earnings for transcripts",
  },
  {
    name: "SocialDataBot",
    color: "#C4973B",
    description:
      "Observes LinkedIn profile changes, hiring surges, executive departures, and organizational restructuring signals across social platforms.",
    sources: [
      "LinkedIn profiles",
      "Job postings",
      "Company pages",
      "GitHub activity",
    ],
    output:
      "Hiring velocity metrics, executive move alerts, team composition changes",
    frequency: "Every 6 hours for tracked companies, daily for broader scans",
  },
  {
    name: "SupplierDataBot",
    color: "#DA5B5B",
    description:
      "Monitors vendor health indicators, supply chain disruptions, procurement pattern shifts, and upstream dependency risks across supplier networks.",
    sources: [
      "Supplier websites",
      "Trade databases",
      "Shipping trackers",
      "News feeds",
    ],
    output:
      "Vendor health scores, disruption alerts, procurement anomaly flags",
    frequency:
      "Every 8 hours for critical suppliers, daily for secondary vendors",
  },
  {
    name: "NewsDataBot",
    color: "#2DD4BF",
    description:
      "Aggregates breaking news, regulatory actions, media sentiment shifts, and industry trend signals from global news sources and wire services.",
    sources: [
      "Reuters",
      "Bloomberg",
      "Industry publications",
      "Google News",
      "RSS feeds",
    ],
    output:
      "Sentiment-scored news summaries, regulatory action alerts, trend signals",
    frequency:
      "Continuous — every 15 minutes for breaking news, hourly for sentiment",
  },
];

/* ─── Lens Data ─── */
const lenses = [
  {
    name: "GTM Lens",
    color: "#C4973B",
    tag: "Go-to-Market",
    description:
      "Analyzes competitive intelligence for sales and marketing teams. Surfaces competitor moves, hiring signals that indicate product pivots, buying intent from procurement patterns, and account enrichment from cross-referencing social and market data.",
    signals: [
      "Competitor launched a new product line",
      "Target account increased engineering headcount 40%",
      "Procurement RFP detected matching our ICP",
      "Executive departure at key competitor",
    ],
  },
  {
    name: "Finance Lens",
    color: "#5B8BDA",
    tag: "Investment Intelligence",
    description:
      "Generates alpha signals for investment teams. Identifies filing divergence between earnings calls and SEC filings, supply-chain stress before it hits quarterly numbers, and early indicators of earnings surprises.",
    signals: [
      "10-K inventory figure diverges from earnings call guidance",
      "Supplier network showing 3+ disruption signals",
      "Insider trading pattern detected pre-earnings",
      "Revenue recognition methodology changed in latest filing",
    ],
  },
  {
    name: "Security Lens",
    color: "#DA5B5B",
    tag: "Risk & Compliance",
    description:
      "Provides continuous vendor risk assessment and threat monitoring. Tracks regulatory actions against vendors, brand exposure from data breaches, third-party risk indicators, and compliance posture changes across the supply chain.",
    signals: [
      "Vendor received FDA warning letter",
      "Third-party data breach affecting shared infrastructure",
      "Regulatory investigation opened in key market",
      "Critical CVE disclosed in vendor's product stack",
    ],
  },
];

/* ─── API Endpoints ─── */
const endpoints = [
  {
    method: "GET",
    path: "/health",
    description: "System health check including MCP connection status",
    response: `{
  "status": "healthy",
  "uptime": 84200,
  "agents": { "active": 5, "total": 5 },
  "mcp": {
    "cognee": "connected",
    "brightdata": "connected"
  },
  "memory": { "entries": 12847 }
}`,
  },
  {
    method: "GET",
    path: "/api/signals",
    description:
      "Returns the live signal feed with optional lens and severity filters",
    response: `{
  "signals": [
    {
      "id": "sig_8x2k",
      "lens": "finance",
      "severity": "high",
      "title": "Filing divergence detected",
      "content": "NVDA 10-K inventory...",
      "confidence": 0.89,
      "source_url": "https://sec.gov/...",
      "created_at": "2026-05-28T14:32:00Z"
    }
  ],
  "total": 342,
  "page": 1
}`,
  },
  {
    method: "GET",
    path: "/api/agents/status",
    description: "Returns status of all collection agents and analysis lenses",
    response: `{
  "agents": [
    {
      "id": "market-data-bot",
      "name": "MarketDataBot",
      "status": "running",
      "last_run": "2026-05-28T14:00:00Z",
      "items_collected": 284,
      "health": 0.98
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/query",
    description:
      "Submit a natural language query to the agent swarm for cross-lens analysis",
    response: `// Request body:
{
  "query": "What is NVIDIA's supply chain risk?",
  "lenses": ["finance", "security"],
  "depth": "detailed"
}

// Response:
{
  "query_id": "qry_9f3a",
  "status": "streaming",
  "stream_url": "/api/query/qry_9f3a/stream"
}`,
  },
  {
    method: "GET",
    path: "/api/briefs/:type",
    description: "Retrieve the latest GTM, Finance, or Security brief",
    response: `{
  "type": "finance",
  "generated_at": "2026-05-28T15:00:00Z",
  "summary": "3 high-confidence signals...",
  "signals_used": 12,
  "sections": [
    {
      "title": "Filing Divergence",
      "content": "...",
      "confidence": 0.92,
      "sources": ["https://sec.gov/..."]
    }
  ]
}`,
  },
];

/* ─── Environment Variables ─── */
const envVars = [
  {
    name: "BRIGHT_DATA_API_KEY",
    required: true,
    description: "Bright Data SDK authentication key for web scraping",
  },
  {
    name: "AIML_API_KEY",
    required: true,
    description: "AI/ML API key for LLM access (400+ models)",
  },
  {
    name: "COGNEE_MCP_URL",
    required: true,
    description:
      "Cognee MCP Docker service URL (default: http://localhost:8000)",
  },
  {
    name: "SPEECHMATICS_API_KEY",
    required: false,
    description: "Speechmatics key for voice-to-text input",
  },
  {
    name: "TRIGGERWARE_API_KEY",
    required: false,
    description: "TriggerWare key for external alert workflows",
  },
  {
    name: "PORT",
    required: false,
    description: "Backend server port (default: 3001)",
  },
  {
    name: "FRONTEND_PORT",
    required: false,
    description: "Next.js frontend port (default: 3000)",
  },
  {
    name: "LOG_LEVEL",
    required: false,
    description: "Structured logging level: debug | info | warn | error",
  },
  {
    name: "SCRAPE_TTL_HOURS",
    required: false,
    description: "Default scrape cache TTL in hours (default: 24)",
  },
  {
    name: "RATE_LIMIT_RPM",
    required: false,
    description: "Bright Data requests per minute limit (default: 60)",
  },
];

/* ─── Code Block Component ─── */
function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div
      style={{
        position: "relative",
        background: "#0D1210",
        border: "1px solid rgba(138, 154, 142, 0.1)",
        borderRadius: "12px",
        overflow: "hidden",
        margin: "16px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 16px",
          borderBottom: "1px solid rgba(138, 154, 142, 0.08)",
          background: "rgba(138, 154, 142, 0.03)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#6B7A6F",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {language}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "1px solid rgba(138, 154, 142, 0.15)",
            borderRadius: "6px",
            padding: "4px 10px",
            color: copied ? "#4ADE80" : "#6B7A6F",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "16px 20px",
          overflowX: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          lineHeight: "1.7",
          color: "#C5D0C8",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Section Heading ─── */
function SectionHeading({
  id,
  children,
  level = 2,
}: {
  id: string;
  children: React.ReactNode;
  level?: 2 | 3;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag
      id={id}
      style={{
        fontFamily: "var(--font-serif)",
        fontSize: level === 2 ? "32px" : "22px",
        fontWeight: 400,
        color: "#F5F5F0",
        margin: level === 2 ? "64px 0 24px" : "40px 0 16px",
        paddingTop: level === 2 ? "24px" : "16px",
        letterSpacing: "-0.02em",
        lineHeight: 1.3,
        scrollMarginTop: "100px",
      }}
    >
      {children}
    </Tag>
  );
}

/* ─── Inline Badge ─── */
function Badge({
  children,
  color = "#4ADE80",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: `${color}18`,
        color,
      }}
    >
      {children}
    </span>
  );
}

/* ─── Method Badge ─── */
function MethodBadge({ method }: { method: string }) {
  const color = (() => {
    if (method === "GET") {
      return "#4ADE80";
    }
    if (method === "POST") {
      return "#5B8BDA";
    }
    return "#C4973B";
  })();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.03em",
        background: `${color}20`,
        color,
        minWidth: "48px",
      }}
    >
      {method}
    </span>
  );
}

/* ─── Main Docs Page ─── */
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headings = sidebarSections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    for (const el of headings) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{ background: "#0A0F0D", minHeight: "100vh" }}>
      <LandingNav />

      {/* Page wrapper */}
      <div
        style={{
          display: "flex",
          maxWidth: "1400px",
          margin: "0 auto",
          paddingTop: "96px",
          minHeight: "100vh",
        }}
      >
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside
          style={{
            width: "260px",
            flexShrink: 0,
            position: "sticky",
            top: "96px",
            height: "calc(100vh - 96px)",
            overflowY: "auto",
            padding: "32px 24px 48px 48px",
            borderRight: "1px solid rgba(138, 154, 142, 0.08)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              color: "#6B7A6F",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "20px",
            }}
          >
            Documentation
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {sidebarSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#8A9A8E";
                      e.currentTarget.style.background =
                        "rgba(138, 154, 142, 0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#6B7A6F";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                  style={{
                    background: isActive
                      ? "rgba(74, 222, 128, 0.06)"
                      : "transparent",
                    border: "none",
                    borderLeft: isActive
                      ? "2px solid #4ADE80"
                      : "2px solid transparent",
                    padding: "8px 12px",
                    borderRadius: "0 8px 8px 0",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "#F5F5F0" : "#6B7A6F",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.01em",
                  }}
                  type="button"
                >
                  {section.label}
                </button>
              );
            })}
          </nav>

          {/* Version pill */}
          <div
            style={{
              marginTop: "40px",
              padding: "12px 14px",
              background: "rgba(138, 154, 142, 0.04)",
              borderRadius: "10px",
              border: "1px solid rgba(138, 154, 142, 0.08)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "#4ADE80",
                marginBottom: "4px",
              }}
            >
              v1.0.0-beta
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                color: "#6B7A6F",
                lineHeight: 1.5,
              }}
            >
              Last updated May 28, 2026
            </div>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "32px 48px 120px 56px",
            maxWidth: "880px",
          }}
        >
          {/* ── INTRODUCTION ── */}
          <SectionHeading id="introduction">Introduction</SectionHeading>
          <p style={pStyle}>
            <strong style={{ color: "#F5F5F0" }}>Argus</strong> is a unified
            enterprise intelligence platform that collects live web data through
            specialized agents and analyzes it through three distinct lenses —
            Go-to-Market, Finance, and Security — connected by a persistent
            knowledge graph.
          </p>
          <div
            style={{
              background: "rgba(74, 222, 128, 0.04)",
              border: "1px solid rgba(74, 222, 128, 0.12)",
              borderRadius: "12px",
              padding: "24px 28px",
              margin: "24px 0",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "16px",
                color: "#F5F5F0",
                marginBottom: "12px",
              }}
            >
              One scrape, three analyses
            </div>
            <p style={{ ...pStyle, margin: 0 }}>
              A LinkedIn profile change is simultaneously a{" "}
              <span style={{ color: "#C4973B" }}>hiring signal</span> (GTM), a{" "}
              <span style={{ color: "#5B8BDA" }}>
                leadership risk indicator
              </span>{" "}
              (Finance), and a{" "}
              <span style={{ color: "#DA5B5B" }}>vendor stability signal</span>{" "}
              (Security) — stored once in the Cognee memory graph, queried three
              ways.
            </p>
          </div>
          <p style={pStyle}>
            Five collection agents continuously scrape the live web. Three
            analysis lenses interpret the same data for different enterprise
            personas. One persistent memory graph connects every signal,
            enabling cross-domain correlation that single-track platforms cannot
            achieve.
          </p>

          {/* Architecture preview boxes */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              margin: "28px 0",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                label: "5 Agents",
                sub: "Continuous collection",
                color: "#4ADE80",
              },
              {
                label: "3 Lenses",
                sub: "GTM · Finance · Security",
                color: "#5B8BDA",
              },
              { label: "1 Graph", sub: "Cognee memory", color: "#2DD4BF" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  flex: "1 1 160px",
                  background: "#111815",
                  border: "1px solid rgba(138, 154, 142, 0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                  borderTop: `2px solid ${item.color}`,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "20px",
                    color: "#F5F5F0",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    color: "#6B7A6F",
                    marginTop: "4px",
                  }}
                >
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── QUICK START ── */}
          <SectionHeading id="quick-start">Quick Start</SectionHeading>

          <SectionHeading id="prerequisites" level={3}>
            Prerequisites
          </SectionHeading>
          <ul style={ulStyle}>
            <li>
              <span style={{ color: "#F5F5F0" }}>Node.js 20+</span> — runtime
              for the agent backend and Next.js frontend
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>Bun</span> — package manager
              and build tool
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>
                Docker &amp; Docker Compose
              </span>{" "}
              — required for Cognee MCP service
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>Bright Data API key</span> —
              web scraping and structured extractors
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>AI/ML API key</span> — LLM
              access via <code style={inlineCodeStyle}>api.aimlapi.com</code>
            </li>
          </ul>

          <SectionHeading id="installation" level={3}>
            Installation
          </SectionHeading>
          <CodeBlock
            code={`# Clone the repository
git clone https://github.com/argus-platform/argus.git
cd argus

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Add your API keys to .env
# BRIGHT_DATA_API_KEY=your_key_here
# AIML_API_KEY=your_key_here`}
            language="bash"
          />

          <SectionHeading id="first-run" level={3}>
            First Run
          </SectionHeading>
          <CodeBlock
            code={`# Start the full stack (backend + frontend + Cognee MCP)
docker compose up -d

# Or run services individually:
# Terminal 1 — Backend agent server
cd apps/backend && bun run dev

# Terminal 2 — Frontend dashboard
cd apps/frontend && bun run dev

# Verify everything is running
curl http://localhost:3001/health`}
            language="bash"
          />

          {/* ── ARCHITECTURE ── */}
          <SectionHeading id="architecture">Architecture</SectionHeading>
          <p style={pStyle}>
            Argus follows a three-layer pipeline:{" "}
            <strong style={{ color: "#F5F5F0" }}>
              Collection → Memory → Analysis
            </strong>
            . Each layer is independently deployable, and all inter-agent
            communication flows through the Cognee knowledge graph — never
            through direct agent-to-agent calls.
          </p>

          {/* Data flow diagram */}
          <div
            style={{
              background: "#111815",
              border: "1px solid rgba(138, 154, 142, 0.1)",
              borderRadius: "16px",
              padding: "32px",
              margin: "24px 0",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              lineHeight: 2,
              color: "#6B7A6F",
              overflowX: "auto",
            }}
          >
            <pre style={{ margin: 0 }}>
              {`  ┌─────────────────── DATA COLLECTION ───────────────────┐
  │                                                        │
  │  MarketDataBot  FilingDataBot  SocialDataBot           │
  │  SupplierDataBot  NewsDataBot                          │
  │                                                        │
  └───────────────────────┬────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────── COGNEE MEMORY ────────────────────┐
  │                                                       │
  │  `}
              <span style={{ color: "#4ADE80" }}>remember</span>
              {" → "}
              <span style={{ color: "#5B8BDA" }}>recall</span>
              {" → "}
              <span style={{ color: "#C4973B" }}>improve</span>
              {" → "}
              <span style={{ color: "#DA5B5B" }}>forget</span>
              {`   │
  │  Persistent knowledge graph · Cross-referenced        │
  │                                                       │
  └───────────────────────┬───────────────────────────────┘
                          │
                          ▼
  ┌─────────────────── ANALYSIS LENSES ──────────────────┐
  │                                                       │
  │  `}
              <span style={{ color: "#C4973B" }}>GTM Lens</span>
              {"      "}
              <span style={{ color: "#5B8BDA" }}>Finance Lens</span>
              {"      "}
              <span style={{ color: "#DA5B5B" }}>Security Lens</span>
              {`  │
  │                                                       │
  └───────────────────────┬───────────────────────────────┘
                          │
                          ▼
  ┌─────────────────── SYNTHESIS ─────────────────────────┐
  │                                                       │
  │  CorrelationEngine → BriefWriter → Output Briefs      │
  │                                                       │
  └───────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          <SectionHeading id="tech-stack" level={3}>
            Technology Stack
          </SectionHeading>
          <div style={{ overflowX: "auto", margin: "16px 0" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Layer</th>
                  <th style={thStyle}>Technology</th>
                  <th style={thStyle}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Agent Framework",
                    "Spectra Agent + Spectra App",
                    "Agent loop, tool dispatch, rate limiting, circuit breaker",
                  ],
                  [
                    "LLM Access",
                    "AI/ML API (api.aimlapi.com)",
                    "400+ models — DeepSeek for reasoning, Claude for reports, Gemini for ingest",
                  ],
                  [
                    "Web Data",
                    "Bright Data SDK + MCP",
                    "Raw scrape, SERP, pre-built extractors (LinkedIn, Amazon, SEC)",
                  ],
                  [
                    "Agent Memory",
                    "Cognee MCP (Docker)",
                    "Persistent knowledge graph with 14 MCP tools",
                  ],
                  [
                    "Voice Input",
                    "Speechmatics REST/WebSocket",
                    "Real-time speech-to-text, 55+ languages",
                  ],
                  [
                    "Workflows",
                    "TriggerWare",
                    "Event-driven alert workflows (Slack, email, webhooks)",
                  ],
                  [
                    "Frontend",
                    "Next.js + Recharts",
                    "Dark-theme command center with SSE streaming",
                  ],
                  [
                    "Database",
                    "SQLite (better-sqlite3)",
                    "Audit trail, session persistence, health scores",
                  ],
                  ["Build", "Bun + Turborepo", "Fast monorepo orchestration"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td
                      style={{ ...tdStyle, color: "#F5F5F0", fontWeight: 500 }}
                    >
                      {row[0]}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "#4ADE80",
                      }}
                    >
                      {row[1]}
                    </td>
                    <td style={tdStyle}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── COLLECTION AGENTS ── */}
          <SectionHeading id="collection-agents">
            Collection Agents
          </SectionHeading>
          <p style={pStyle}>
            Five specialized agents continuously scrape the live web, each
            focused on a distinct data domain. All agents store their findings
            in the Cognee memory graph with source URLs, timestamps, confidence
            scores, and TTL metadata.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              margin: "24px 0",
            }}
          >
            {agents.map((agent) => (
              <div
                key={agent.name}
                style={{
                  background: "#111815",
                  border: "1px solid rgba(138, 154, 142, 0.1)",
                  borderRadius: "16px",
                  padding: "28px",
                  borderLeft: `3px solid ${agent.color}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: agent.color,
                      boxShadow: `0 0 8px ${agent.color}40`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#F5F5F0",
                    }}
                  >
                    {agent.name}
                  </span>
                </div>
                <p style={{ ...pStyle, margin: "0 0 16px 0" }}>
                  {agent.description}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={fieldLabelStyle}>Data Sources</div>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                    >
                      {agent.sources.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "#8A9A8E",
                            background: "rgba(138, 154, 142, 0.08)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={fieldLabelStyle}>Frequency</div>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "13px",
                        color: "#8A9A8E",
                      }}
                    >
                      {agent.frequency}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "12px" }}>
                  <div style={fieldLabelStyle}>Output Format</div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "13px",
                      color: "#8A9A8E",
                    }}
                  >
                    {agent.output}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── ANALYSIS LENSES ── */}
          <SectionHeading id="analysis-lenses">Analysis Lenses</SectionHeading>
          <p style={pStyle}>
            Each lens queries the same Cognee memory graph but interprets the
            data through a different enterprise persona. The same raw signal
            produces different insights depending on who is asking.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              margin: "24px 0",
            }}
          >
            {lenses.map((lens) => (
              <div
                key={lens.name}
                style={{
                  background: "#111815",
                  border: "1px solid rgba(138, 154, 142, 0.1)",
                  borderRadius: "16px",
                  padding: "28px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Top accent gradient */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: `linear-gradient(90deg, ${lens.color}, transparent)`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
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
                    {lens.name}
                  </span>
                  <Badge color={lens.color}>{lens.tag}</Badge>
                </div>
                <p style={{ ...pStyle, margin: "0 0 20px 0" }}>
                  {lens.description}
                </p>

                <div style={fieldLabelStyle}>Example Signals</div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {lens.signals.map((signal) => (
                    <div
                      key={signal}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 14px",
                        background: "rgba(138, 154, 142, 0.04)",
                        borderRadius: "8px",
                        border: "1px solid rgba(138, 154, 142, 0.06)",
                      }}
                    >
                      <span
                        style={{
                          color: lens.color,
                          fontSize: "14px",
                          lineHeight: "20px",
                          flexShrink: 0,
                        }}
                      >
                        →
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "13px",
                          color: "#8A9A8E",
                          lineHeight: "20px",
                        }}
                      >
                        {signal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── API REFERENCE ── */}
          <SectionHeading id="api-reference">API Reference</SectionHeading>
          <p style={pStyle}>
            The Argus backend exposes a REST API on{" "}
            <code style={inlineCodeStyle}>http://localhost:3001</code>. All
            endpoints return JSON. Streaming endpoints use Server-Sent Events
            (SSE).
          </p>
          <div
            style={{
              background: "rgba(91, 139, 218, 0.04)",
              border: "1px solid rgba(91, 139, 218, 0.12)",
              borderRadius: "10px",
              padding: "14px 18px",
              margin: "16px 0 28px",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "#5B8BDA",
              lineHeight: 1.6,
            }}
          >
            <strong>Authentication:</strong> All{" "}
            <code style={{ ...inlineCodeStyle, color: "#5B8BDA" }}>/api/*</code>{" "}
            endpoints require a Bearer token in the{" "}
            <code style={{ ...inlineCodeStyle, color: "#5B8BDA" }}>
              Authorization
            </code>{" "}
            header. The{" "}
            <code style={{ ...inlineCodeStyle, color: "#5B8BDA" }}>
              /health
            </code>{" "}
            endpoint is unauthenticated.
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {endpoints.map((ep) => (
              <div
                key={`${ep.method}-${ep.path}`}
                style={{
                  background: "#111815",
                  border: "1px solid rgba(138, 154, 142, 0.1)",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(138, 154, 142, 0.08)",
                  }}
                >
                  <MethodBadge method={ep.method} />
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      color: "#F5F5F0",
                      fontWeight: 500,
                    }}
                  >
                    {ep.path}
                  </code>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ ...pStyle, margin: "0 0 12px 0" }}>
                    {ep.description}
                  </p>
                  <div style={fieldLabelStyle}>Response</div>
                  <CodeBlock code={ep.response} language="json" />
                </div>
              </div>
            ))}
          </div>

          {/* ── MEMORY & STORAGE ── */}
          <SectionHeading id="memory-storage">
            Memory &amp; Storage
          </SectionHeading>
          <p style={pStyle}>
            Argus uses the Cognee knowledge graph as both persistent agent
            memory and a scrape cache. Every piece of collected data is stored
            as a node in the graph, cross-referenced by source, agent,
            timestamp, and confidence — enabling correlation queries across all
            agents.
          </p>

          <SectionHeading id="cognee-ops" level={3}>
            Core Operations
          </SectionHeading>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              margin: "16px 0",
            }}
          >
            {[
              {
                op: "remember",
                color: "#4ADE80",
                desc: "Store a finding with metadata (source, confidence, TTL)",
              },
              {
                op: "recall",
                color: "#5B8BDA",
                desc: "Query the graph by topic, agent, time range, or confidence",
              },
              {
                op: "improve",
                color: "#C4973B",
                desc: "Bridge session-scoped memory into the permanent graph",
              },
              {
                op: "forget",
                color: "#DA5B5B",
                desc: "Prune stale entries by dataset, age, or agent",
              },
            ].map((item) => (
              <div
                key={item.op}
                style={{
                  background: "#111815",
                  border: "1px solid rgba(138, 154, 142, 0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: item.color,
                  }}
                >
                  {item.op}()
                </code>
                <p style={{ ...pStyle, margin: "8px 0 0 0", fontSize: "13px" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <SectionHeading id="memory-schema" level={3}>
            Memory Entry Schema
          </SectionHeading>
          <CodeBlock
            code={`interface MemoryEntry {
  source_url: string;        // Required — the URL this data came from
  scraped_at: string;        // Required — ISO 8601 timestamp
  agent_id: string;          // Required — which agent stored this
  confidence: number;        // Required — 0.0-1.0 (< 0.7 = low_confidence)
  data_type: string;         // Required — "price" | "filing" | "social" | "supplier" | "news"
  content: string;           // Required — the actual finding text
  raw_extract?: object;      // Optional — original structured data
  ttl_hours?: number;        // Optional — staleness threshold
}`}
            language="typescript"
          />

          <SectionHeading id="ttl-policies" level={3}>
            TTL Policies
          </SectionHeading>
          <div style={{ overflowX: "auto", margin: "16px 0" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data Type</th>
                  <th style={thStyle}>TTL</th>
                  <th style={thStyle}>Dataset</th>
                  <th style={thStyle}>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Pricing",
                    "24 hours",
                    "raw_market_data",
                    "Prices change frequently; stale prices lead to bad signals",
                  ],
                  [
                    "SEC Filings",
                    "7 days",
                    "raw_filing_data",
                    "Filings are versioned; re-scrape on amendment",
                  ],
                  [
                    "Social / LinkedIn",
                    "7 days",
                    "raw_social_data",
                    "Profile changes are infrequent but meaningful",
                  ],
                  [
                    "Supplier Health",
                    "7 days",
                    "raw_supplier_data",
                    "Vendor status is semi-stable",
                  ],
                  [
                    "Company Profiles",
                    "30 days",
                    "raw_social_data",
                    "Slow-changing structural data",
                  ],
                  [
                    "News Articles",
                    "3 days",
                    "raw_news_data",
                    "News has a short relevance window",
                  ],
                  [
                    "Lens Findings",
                    "∞ (permanent)",
                    "lens_findings",
                    "Analysis results are historical record",
                  ],
                  [
                    "Correlation Signals",
                    "∞ (permanent)",
                    "correlation_signals",
                    "Cross-domain signals are unique artifacts",
                  ],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td
                      style={{ ...tdStyle, color: "#F5F5F0", fontWeight: 500 }}
                    >
                      {row[0]}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "#4ADE80",
                      }}
                    >
                      {row[1]}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                      }}
                    >
                      {row[2]}
                    </td>
                    <td style={tdStyle}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── CONFIGURATION ── */}
          <SectionHeading id="configuration">Configuration</SectionHeading>
          <p style={pStyle}>
            Argus is configured through environment variables. Copy{" "}
            <code style={inlineCodeStyle}>.env.example</code> to{" "}
            <code style={inlineCodeStyle}>.env</code> and fill in the required
            values.
          </p>

          <SectionHeading id="env-vars" level={3}>
            Environment Variables
          </SectionHeading>
          <div style={{ overflowX: "auto", margin: "16px 0" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Variable</th>
                  <th style={{ ...thStyle, width: "80px" }}>Required</th>
                  <th style={thStyle}>Description</th>
                </tr>
              </thead>
              <tbody>
                {envVars.map((v) => (
                  <tr key={v.name}>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "#F5F5F0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v.name}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {v.required ? (
                        <span style={{ color: "#4ADE80", fontWeight: 600 }}>
                          Yes
                        </span>
                      ) : (
                        <span style={{ color: "#6B7A6F" }}>No</span>
                      )}
                    </td>
                    <td style={tdStyle}>{v.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionHeading id="agent-config" level={3}>
            Agent Configuration
          </SectionHeading>
          <p style={pStyle}>
            Each collection agent can be individually configured for scrape
            frequency, target domains, and retry behavior:
          </p>
          <CodeBlock
            code={`// agents/market-data-bot.config.ts
export const config = {
  id: "market-data-bot",
  schedule: "*/4 * * * *",           // Every 4 hours
  targets: [
    "amazon.com",
    "finance.yahoo.com",
  ],
  retries: 3,
  backoff: "exponential",            // 1s → 2s → 4s
  timeout: 30_000,                   // 30 second timeout
  rateLimit: {
    requestsPerMinute: 15,
    burstSize: 5,
  },
  fallback: "cache",                 // Use Cognee cache on failure
};`}
            language="typescript"
          />

          <SectionHeading id="rate-limiting" level={3}>
            Rate Limiting
          </SectionHeading>
          <p style={pStyle}>
            Bright Data calls are rate-limited through Spectra&apos;s{" "}
            <code style={inlineCodeStyle}>CompositeRateLimiter</code> with
            per-domain token buckets. Default: 60 requests/minute globally, 15
            requests/minute per domain.
          </p>
          <CodeBlock
            code={`// Rate limiter configuration
const rateLimiter = new CompositeRateLimiter({
  global: { rpm: 60, burst: 20 },
  perDomain: {
    "amazon.com": { rpm: 15, burst: 5 },
    "linkedin.com": { rpm: 10, burst: 3 },
    "sec.gov": { rpm: 20, burst: 8 },
  },
  fallback: "queue",  // Queue excess requests instead of dropping
});`}
            language="typescript"
          />

          {/* ── DEPLOYMENT ── */}
          <SectionHeading id="deployment">Deployment</SectionHeading>
          <p style={pStyle}>
            Argus is designed to run as a Docker Compose stack. A single{" "}
            <code style={inlineCodeStyle}>docker compose up</code> brings up the
            backend, frontend, and Cognee MCP service.
          </p>

          <SectionHeading id="docker-compose" level={3}>
            Docker Compose
          </SectionHeading>
          <CodeBlock
            code={`# docker-compose.yml
version: "3.9"

services:
  backend:
    build: ./apps/backend
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      - cognee
    restart: unless-stopped

  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend
    restart: unless-stopped

  cognee:
    image: cognee/mcp:latest
    ports:
      - "8000:8000"
    volumes:
      - cognee_data:/data
    restart: unless-stopped

volumes:
  cognee_data:`}
            language="yaml"
          />

          <SectionHeading id="production" level={3}>
            Production Considerations
          </SectionHeading>
          <ul style={ulStyle}>
            <li>
              <span style={{ color: "#F5F5F0" }}>Reverse proxy:</span> Place
              NGINX or Caddy in front of the backend for TLS termination and
              request buffering.
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>Persistent volumes:</span>{" "}
              Mount Cognee data and SQLite database to durable storage. Data
              loss means losing the memory graph.
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>Resource limits:</span> Set
              Docker memory limits — backend agents can be memory-intensive
              during large scrapes (recommended: 2GB backend, 512MB frontend,
              1GB Cognee).
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>Monitoring:</span> Wire{" "}
              <code style={inlineCodeStyle}>/health</code> to your uptime
              monitor. Alert if any MCP connection drops.
            </li>
            <li>
              <span style={{ color: "#F5F5F0" }}>Log aggregation:</span> Forward
              structured logs from the backend to Datadog, Grafana Loki, or
              similar. All agent events are JSON-structured.
            </li>
          </ul>

          <SectionHeading id="health-endpoints" level={3}>
            Health Monitoring
          </SectionHeading>
          <CodeBlock
            code={`# Full health check
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "healthy",
#   "agents": { "active": 5, "total": 5 },
#   "mcp": { "cognee": "connected", "brightdata": "connected" },
#   "memory": { "entries": 12847, "datasets": 7 },
#   "uptime": 84200
# }

# Quick liveness probe (for k8s/Docker)
curl -f http://localhost:3001/health || exit 1`}
            language="bash"
          />

          {/* Bottom spacer */}
          <div style={{ height: "64px" }} />
        </main>
      </div>

      <Footer />
    </div>
  );
}

/* ─── Shared Inline Styles ─── */
const pStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "15px",
  lineHeight: 1.75,
  color: "#8A9A8E",
  margin: "0 0 16px 0",
  maxWidth: "680px",
};

const ulStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "14px",
  lineHeight: 1.8,
  color: "#8A9A8E",
  paddingLeft: "20px",
  margin: "12px 0",
  listStyleType: "none",
};

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.88em",
  background: "rgba(138, 154, 142, 0.1)",
  padding: "2px 7px",
  borderRadius: "5px",
  color: "#C5D0C8",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: "var(--font-sans)",
  fontSize: "13px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "1px solid rgba(138, 154, 142, 0.12)",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  fontWeight: 600,
  color: "#6B7A6F",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid rgba(138, 154, 142, 0.06)",
  color: "#8A9A8E",
  verticalAlign: "top",
};

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  fontWeight: 600,
  color: "#6B7A6F",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "8px",
};
