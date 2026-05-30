"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  Globe,
  Network,
  Radio,
  Search,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─── Lens color map ──────────────────────────────────────────────── */
const LENSES = [
  {
    id: "gtm",
    label: "GTM Lens",
    color: "#d4a853",
    glow: "rgba(212,168,83,0.18)",
    bg: "rgba(212,168,83,0.06)",
    border: "rgba(212,168,83,0.2)",
    icon: Target,
    tagline: "Revenue intelligence",
    points: [
      "Competitor moves before announcements",
      "Hiring surge → product launch correlation",
      "Buying intent from procurement postings",
      "Account enrichment with live web evidence",
    ],
    signal: { label: "ACCOUNT SIGNAL", value: "Series B detected", score: 92 },
  },
  {
    id: "finance",
    label: "Finance Lens",
    color: "#34d399",
    glow: "rgba(52,211,153,0.18)",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.2)",
    icon: TrendingUp,
    tagline: "Alpha intelligence",
    points: [
      "Filing divergence alerts — 10-Q vs guidance drift",
      "Supply-chain stress from vendor data",
      "Earnings surprise from social signals",
      "Cross-referenced alpha grounded in evidence",
    ],
    signal: { label: "ALPHA SIGNAL", value: "Guidance divergence +14%", score: 87 },
  },
  {
    id: "security",
    label: "Security Lens",
    color: "#f87171",
    glow: "rgba(248,113,113,0.18)",
    bg: "rgba(248,113,113,0.06)",
    border: "rgba(248,113,113,0.2)",
    icon: Shield,
    tagline: "Risk intelligence",
    points: [
      "Vendor risk scoring with continuous monitoring",
      "Regulatory action early warning system",
      "Brand exposure detection across all surfaces",
      "Threat intel correlated with supplier health",
    ],
    signal: { label: "RISK SIGNAL", value: "Vendor exposure: HIGH", score: 78 },
  },
];

const AGENTS = [
  { id: "market", label: "MarketDataBot", icon: BarChart3, color: "#d4a853", dataType: "PRICE" },
  { id: "filing", label: "FilingDataBot", icon: Database, color: "#34d399", dataType: "FILING" },
  { id: "social", label: "SocialDataBot", icon: Activity, color: "#a78bfa", dataType: "SOCIAL" },
  { id: "supplier", label: "SupplierDataBot", icon: Network, color: "#60a5fa", dataType: "SUPPLIER" },
  { id: "news", label: "NewsDataBot", icon: Radio, color: "#fb923c", dataType: "NEWS" },
];

/* ─── Typewriter ──────────────────────────────────────────────────── */
function Typewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "hold" | "erasing">("typing");

  useEffect(() => {
    const current = texts[idx]!;
    if (phase === "typing") {
      if (displayed.length < current.length) {
        const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("hold"), 1800);
        return () => clearTimeout(t);
      }
    } else if (phase === "hold") {
      const t = setTimeout(() => setPhase("erasing"), 200);
      return () => clearTimeout(t);
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
        return () => clearTimeout(t);
      } else {
        setIdx((i) => (i + 1) % texts.length);
        setPhase("typing");
      }
    }
  }, [displayed, phase, idx, texts]);

  return (
    <span style={{ color: "#a78bfa" }}>
      {displayed}
      <span
        style={{
          display: "inline-block",
          width: "2px",
          height: "0.9em",
          background: "#a78bfa",
          marginLeft: "2px",
          verticalAlign: "text-bottom",
          animation: "blink 1s step-end infinite",
        }}
      />
    </span>
  );
}

/* ─── Animated count-up ──────────────────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started.current) {
          started.current = true;
          const steps = 40;
          let i = 0;
          const inc = to / steps;
          const id = setInterval(() => {
            i++;
            setVal(Math.min(Math.round(inc * i), to));
            if (i >= steps) clearInterval(id);
          }, 30);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ─── Animated entry ─────────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Live pipeline mini-viz ─────────────────────────────────────── */
function PipelineViz() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        background: "#0c0c0e",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "20px",
        fontFamily: "var(--font-mono, 'Commit Mono', monospace)",
        fontSize: "11px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
        <span style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>COGNEE GRAPH</span>
        <span style={{ color: "#34d399", fontSize: "10px" }}>
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#34d399",
              marginRight: "6px",
              animation: "blink 1.2s ease-in-out infinite",
            }}
          />
          LIVE
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {AGENTS.map((agent, i) => {
          const pct = 45 + ((tick * 7 + i * 23) % 45);
          return (
            <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: "rgba(255,255,255,0.35)", width: "80px", flexShrink: 0, fontSize: "10px" }}>
                {agent.label.replace("DataBot", "")}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "4px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: agent.color,
                    borderRadius: "2px",
                    transition: "width 0.8s ease",
                    opacity: 0.8,
                  }}
                />
              </div>
              <span style={{ color: agent.color, fontSize: "10px", width: "32px", textAlign: "right" }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: "14px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          color: "rgba(255,255,255,0.3)",
          fontSize: "10px",
        }}
      >
        <span>{(tick * 3 + 847).toLocaleString()} facts stored</span>
        <span>3 lenses active</span>
      </div>
    </div>
  );
}

/* ─── Signal card ─────────────────────────────────────────────────── */
function SignalCard({
  lens,
  animated,
}: {
  lens: (typeof LENSES)[0];
  animated: boolean;
}) {
  return (
    <div
      style={{
        background: lens.bg,
        border: `1px solid ${lens.border}`,
        borderRadius: "14px",
        padding: "16px 18px",
        transition: "all 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "9px",
            color: lens.color,
            letterSpacing: "0.1em",
            opacity: 0.8,
          }}
        >
          {lens.signal.label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px",
            color: lens.color,
            background: `${lens.color}1a`,
            padding: "2px 8px",
            borderRadius: "100px",
          }}
        >
          {lens.signal.score}
        </span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-body, system-ui)",
          fontSize: "13px",
          color: "#f0f0f3",
          marginBottom: "10px",
        }}
      >
        {lens.signal.value}
      </p>
      <div
        style={{
          height: "3px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: animated ? `${lens.signal.score}%` : "0%",
            background: `linear-gradient(90deg, ${lens.color}80, ${lens.color})`,
            borderRadius: "2px",
            transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [activeLens, setActiveLens] = useState(0);
  const [signalAnimated, setSignalAnimated] = useState(false);

  // Rotate active lens every 3s
  useEffect(() => {
    const id = setInterval(() => setActiveLens((l) => (l + 1) % 3), 3000);
    return () => clearInterval(id);
  }, []);

  // Animate signal bars after a beat
  useEffect(() => {
    const id = setTimeout(() => setSignalAnimated(true), 600);
    return () => clearTimeout(id);
  }, []);

  const lens = LENSES[activeLens]!;

  return (
    <div
      style={{
        background: "#070708",
        minHeight: "100vh",
        overflowX: "hidden",
        color: "#f0f0f3",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
      }}
    >
      {/* blink keyframe */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes scanline {
          0% { transform: translateY(-100%) }
          100% { transform: translateY(100vh) }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: "60px",
          background: "rgba(7,7,8,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Eye style={{ width: "18px", height: "18px", color: "#a78bfa" }} />
          <span
            style={{
              fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
              fontWeight: 600,
              fontSize: "15px",
              letterSpacing: "0.04em",
              color: "#f0f0f3",
            }}
          >
            ARGUS
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/login"
            style={{
              padding: "7px 18px",
              fontSize: "13px",
              color: "rgba(240,240,243,0.6)",
              textDecoration: "none",
              borderRadius: "8px",
              transition: "color 0.2s",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            style={{
              padding: "7px 18px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#070708",
              background: "#f0f0f3",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            Get access
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Live pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 14px",
            borderRadius: "100px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            marginBottom: "32px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "11px",
            color: "rgba(240,240,243,0.5)",
            letterSpacing: "0.06em",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#34d399",
              animation: "blink 1.2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          ENTERPRISE INTELLIGENCE PLATFORM · CONTINUOUS MONITORING
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
            fontSize: "clamp(2.6rem, 5.5vw, 64px)",
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            textAlign: "center",
            maxWidth: "860px",
            marginBottom: "24px",
            color: "#f0f0f3",
          }}
        >
          A hundred eyes on the web.
          <br />
          <span style={{ color: "rgba(240,240,243,0.35)" }}>Three lenses,</span>{" "}
          <Typewriter texts={["one truth.", "one graph.", "one platform."]} />
        </h1>

        {/* Subhead */}
        <p
          style={{
            fontSize: "17px",
            lineHeight: 1.65,
            color: "rgba(240,240,243,0.5)",
            maxWidth: "540px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          Five collection agents scrape continuously. Cognee stores every signal
          in a persistent knowledge graph. GTM, Finance, and Security teams each
          see a different truth from the same data.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 500,
              background: "#f0f0f3",
              color: "#070708",
              borderRadius: "10px",
              textDecoration: "none",
              transition: "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Start monitoring
            <ArrowRight style={{ width: "15px", height: "15px" }} />
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              color: "rgba(240,240,243,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              textDecoration: "none",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              e.currentTarget.style.color = "#f0f0f3";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(240,240,243,0.6)";
            }}
          >
            <Eye style={{ width: "15px", height: "15px" }} />
            View dashboard
          </Link>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "64px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { n: 5, s: "", label: "Collection agents" },
            { n: 3, s: "", label: "Analysis lenses" },
            { n: 400, s: "+", label: "LLM models via AI/ML API" },
            { n: 24, s: "/7", label: "Continuous monitoring" },
          ].map(({ n, s, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#f0f0f3",
                  lineHeight: 1,
                }}
              >
                <CountUp to={n} suffix={s} />
              </div>
              <div style={{ fontSize: "12px", color: "rgba(240,240,243,0.35)", marginTop: "4px" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          background: "#0c0c0e",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeUp>
            <div style={{ marginBottom: "64px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                  color: "rgba(240,240,243,0.35)",
                  letterSpacing: "0.1em",
                }}
              >
                ARCHITECTURE
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                  fontSize: "clamp(1.8rem, 3vw, 38px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  marginTop: "12px",
                  color: "#f0f0f3",
                  maxWidth: "500px",
                }}
              >
                One scrape.
                <br />
                Three analyses.
              </h2>
            </div>
          </FadeUp>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Step 1 — Collect */}
            <FadeUp delay={0}>
              <div
                style={{
                  background: "#131316",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "18px",
                  padding: "28px",
                  height: "100%",
                  transition: "border-color 0.3s, transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "10px",
                      color: "rgba(240,240,243,0.3)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    01
                  </span>
                  <Globe style={{ width: "16px", height: "16px", color: "rgba(240,240,243,0.2)" }} />
                </div>

                {/* Agents mini-list */}
                <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {AGENTS.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div
                        key={agent.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <Icon style={{ width: "13px", height: "13px", color: agent.color, flexShrink: 0 }} />
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "11px",
                            color: "rgba(240,240,243,0.5)",
                            flex: 1,
                          }}
                        >
                          {agent.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "9px",
                            color: agent.color,
                            opacity: 0.6,
                          }}
                        >
                          {agent.dataType}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                    fontSize: "17px",
                    fontWeight: 500,
                    color: "#f0f0f3",
                    marginBottom: "8px",
                  }}
                >
                  Collect
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(240,240,243,0.4)", lineHeight: 1.65 }}>
                  Five specialized agents scrape the live web continuously via Bright Data. Market prices, SEC filings, LinkedIn signals, supplier health, and breaking news.
                </p>
              </div>
            </FadeUp>

            {/* Step 2 — Remember */}
            <FadeUp delay={120}>
              <div
                style={{
                  background: "#131316",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "18px",
                  padding: "28px",
                  height: "100%",
                  transition: "border-color 0.3s, transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "10px",
                      color: "rgba(240,240,243,0.3)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    02
                  </span>
                  <Brain style={{ width: "16px", height: "16px", color: "rgba(167,139,250,0.4)" }} />
                </div>

                <PipelineViz />

                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                    fontSize: "17px",
                    fontWeight: 500,
                    color: "#f0f0f3",
                    margin: "20px 0 8px",
                  }}
                >
                  Remember
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(240,240,243,0.4)", lineHeight: 1.65 }}>
                  Every fact is stored in a Cognee knowledge graph with source URL, timestamp, and confidence score. Agents recall before acting. No duplicate scrapes, no stale data.
                </p>
              </div>
            </FadeUp>

            {/* Step 3 — Analyze */}
            <FadeUp delay={240}>
              <div
                style={{
                  background: "#131316",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "18px",
                  padding: "28px",
                  height: "100%",
                  transition: "border-color 0.3s, transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "10px",
                      color: "rgba(240,240,243,0.3)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    03
                  </span>
                  <Search style={{ width: "16px", height: "16px", color: "rgba(240,240,243,0.2)" }} />
                </div>

                {/* Lens switcher */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                  {LENSES.map((l, i) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActiveLens(i)}
                      style={{
                        flex: 1,
                        padding: "5px",
                        borderRadius: "8px",
                        border: `1px solid ${i === activeLens ? l.color + "50" : "rgba(255,255,255,0.06)"}`,
                        background: i === activeLens ? l.bg : "transparent",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "9px",
                        color: i === activeLens ? l.color : "rgba(255,255,255,0.3)",
                        transition: "all 0.3s",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {l.id.toUpperCase()}
                    </button>
                  ))}
                </div>

                <SignalCard lens={lens} animated={signalAnimated} />

                <h3
                  style={{
                    fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                    fontSize: "17px",
                    fontWeight: 500,
                    color: "#f0f0f3",
                    margin: "20px 0 8px",
                  }}
                >
                  Analyze
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(240,240,243,0.4)", lineHeight: 1.65 }}>
                  The same graph is queried three ways. GTM sees buying intent. Finance sees alpha. Security sees vendor risk. One truth, three lenses.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── THREE LENSES ─────────────────────────────────────── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                  color: "rgba(240,240,243,0.35)",
                  letterSpacing: "0.1em",
                }}
              >
                THREE PERSPECTIVES
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                  fontSize: "clamp(1.8rem, 3vw, 38px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  marginTop: "12px",
                  color: "#f0f0f3",
                }}
              >
                All three lenses on the same truth.
              </h2>
            </div>
          </FadeUp>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {LENSES.map((l, i) => {
              const Icon = l.icon;
              return (
                <FadeUp key={l.id} delay={i * 100}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px",
                      alignItems: "center",
                      background: "#0c0c0e",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "20px",
                      padding: "36px",
                      transition: "border-color 0.4s, box-shadow 0.4s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${l.color}30`;
                      e.currentTarget.style.boxShadow = `0 0 40px ${l.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Text */}
                    <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "10px",
                            background: l.bg,
                            border: `1px solid ${l.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon style={{ width: "16px", height: "16px", color: l.color }} />
                        </div>
                        <div>
                          <p
                            style={{
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: "10px",
                              color: "rgba(240,240,243,0.3)",
                              letterSpacing: "0.08em",
                              marginBottom: "2px",
                            }}
                          >
                            {l.tagline.toUpperCase()}
                          </p>
                          <h3
                            style={{
                              fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                              fontSize: "20px",
                              fontWeight: 600,
                              color: "#f0f0f3",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {l.label}
                          </h3>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {l.points.map((pt) => (
                          <div key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <CheckCircle2
                              style={{
                                width: "14px",
                                height: "14px",
                                color: l.color,
                                flexShrink: 0,
                                marginTop: "2px",
                                opacity: 0.7,
                              }}
                            />
                            <span style={{ fontSize: "13px", color: "rgba(240,240,243,0.5)", lineHeight: 1.55 }}>
                              {pt}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card viz */}
                    <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                      <div
                        style={{
                          background: l.bg,
                          border: `1px solid ${l.border}`,
                          borderRadius: "16px",
                          padding: "24px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                            paddingBottom: "12px",
                            borderBottom: `1px solid ${l.color}15`,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: "10px",
                              color: l.color,
                              letterSpacing: "0.08em",
                            }}
                          >
                            {l.label.toUpperCase()}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: "10px",
                              color: "rgba(240,240,243,0.3)",
                            }}
                          >
                            LIVE
                          </span>
                        </div>

                        {l.points.slice(0, 3).map((pt, j) => (
                          <div
                            key={pt}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 0",
                              borderBottom:
                                j < 2 ? `1px solid rgba(255,255,255,0.04)` : "none",
                            }}
                          >
                            <div
                              style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "2px",
                                background: l.color,
                                opacity: 0.5,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: "12px", color: "rgba(240,240,243,0.4)", flex: 1 }}>
                              {pt.split("—")[0]?.trim()}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: "10px",
                                color: l.color,
                                opacity: 0.5,
                              }}
                            >
                              0.{85 + j * 4}
                            </span>
                          </div>
                        ))}

                        <SignalCard lens={l} animated={signalAnimated} />
                      </div>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW STEPS ───────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          background: "#0c0c0e",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeUp>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "56px",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "11px",
                    color: "rgba(240,240,243,0.35)",
                    letterSpacing: "0.1em",
                  }}
                >
                  PIPELINE · EVENT-DRIVEN
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                    fontSize: "clamp(1.8rem, 3vw, 36px)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    marginTop: "12px",
                    color: "#f0f0f3",
                    maxWidth: "380px",
                  }}
                >
                  From raw web to intelligence brief.
                </h2>
              </div>
              <p style={{ maxWidth: "280px", fontSize: "13px", color: "rgba(240,240,243,0.4)", lineHeight: 1.7 }}>
                No manual steps. No sequential coupling. Each agent independently reacts to events and stores findings in shared memory.
              </p>
            </div>
          </FadeUp>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              {
                n: "01",
                title: "Tick fires",
                desc: "Scheduler emits a MonitorTick for each company in your watchlist.",
                icon: Radio,
                color: "#a78bfa",
              },
              {
                n: "02",
                title: "Agents collect",
                desc: "All 5 collection agents react in parallel. Bright Data scrapes live URLs.",
                icon: Globe,
                color: "#60a5fa",
              },
              {
                n: "03",
                title: "Normalizer extracts",
                desc: "LLM normalizes raw HTML into structured facts with confidence scores.",
                icon: Zap,
                color: "#d4a853",
              },
              {
                n: "04",
                title: "Lenses analyze",
                desc: "GTM, Finance, and Security lenses each query Cognee and produce a finding.",
                icon: Eye,
                color: "#34d399",
              },
              {
                n: "05",
                title: "Brief delivered",
                desc: "CorrelationEngine cross-references all signals. Brief is written and surfaced.",
                icon: CheckCircle2,
                color: "#f87171",
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeUp key={step.n} delay={i * 80}>
                  <div
                    style={{
                      background: "#131316",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "16px",
                      padding: "22px",
                      height: "100%",
                      position: "relative",
                      transition: "border-color 0.3s, transform 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${step.color}30`;
                      e.currentTarget.style.transform = "translateY(-3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Connector line on desktop */}
                    {i < 4 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "28px",
                          right: "-7px",
                          width: "14px",
                          height: "1px",
                          background: "rgba(255,255,255,0.08)",
                          zIndex: 1,
                        }}
                      />
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: "10px",
                          color: "rgba(240,240,243,0.25)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {step.n}
                      </span>
                      <Icon style={{ width: "14px", height: "14px", color: step.color, opacity: 0.6 }} />
                    </div>

                    {/* Visual area */}
                    <div
                      style={{
                        height: "44px",
                        borderRadius: "10px",
                        background: `${step.color}0a`,
                        border: `1px solid ${step.color}18`,
                        marginBottom: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: "10px",
                          color: step.color,
                          opacity: 0.6,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {step.n === "01"
                          ? "monitor_tick →"
                          : step.n === "02"
                            ? "evidence_collected →"
                            : step.n === "03"
                              ? "fact_classified →"
                              : step.n === "04"
                                ? "lens_analysis_complete →"
                                : "brief_ready ✓"}
                      </div>
                    </div>

                    <h3
                      style={{
                        fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#f0f0f3",
                        marginBottom: "6px",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(240,240,243,0.38)", lineHeight: 1.6 }}>
                      {step.desc}
                    </p>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY ARGUS WINS ──────────────────────────────────── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                  color: "rgba(240,240,243,0.35)",
                  letterSpacing: "0.1em",
                }}
              >
                COMPETITIVE ADVANTAGE
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                  fontSize: "clamp(1.8rem, 3vw, 38px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  marginTop: "12px",
                  color: "#f0f0f3",
                }}
              >
                Why Argus is different.
              </h2>
            </div>
          </FadeUp>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                tag: "MEMORY",
                title: "Persistent knowledge graph",
                desc: "Competitors run one-shot reports. Argus watches continuously and alerts when the story changes.",
                highlight: "Cognee stores, correlates, and recalls across sessions.",
                color: "#a78bfa",
              },
              {
                tag: "DATA",
                title: "One scrape, three analyses",
                desc: "A LinkedIn profile change is a hiring signal (GTM), leadership risk (Finance), and vendor stability indicator (Security) — stored once, queried three ways.",
                highlight: "No duplicate scrapes. No stale context.",
                color: "#34d399",
              },
              {
                tag: "COVERAGE",
                title: "All three tracks, genuinely",
                desc: "Cortex does finance-only. CompeteIQ does GTM-only. Keiretsu Radar does security-only.",
                highlight: "Argus covers all three with equal depth from shared evidence.",
                color: "#d4a853",
              },
            ].map((item, i) => (
              <FadeUp key={item.tag} delay={i * 100}>
                <div
                  style={{
                    background: "#0c0c0e",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "18px",
                    padding: "28px",
                    height: "100%",
                    transition: "border-color 0.3s, transform 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${item.color}25`;
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ marginBottom: "16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "10px",
                        color: item.color,
                        letterSpacing: "0.1em",
                        opacity: 0.7,
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                      fontSize: "18px",
                      fontWeight: 500,
                      color: "#f0f0f3",
                      marginBottom: "10px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "rgba(240,240,243,0.4)", lineHeight: 1.65, marginBottom: "14px" }}>
                    {item.desc}
                  </p>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: `${item.color}0a`,
                      border: `1px solid ${item.color}18`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "11px",
                        color: item.color,
                        opacity: 0.8,
                      }}
                    >
                      {item.highlight}
                    </span>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          background: "#0c0c0e",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <FadeUp>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                background: "#131316",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                padding: "64px 48px",
                textAlign: "center",
              }}
            >
              {/* Corner glows */}
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  left: "-40px",
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-40px",
                  right: "-40px",
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* Floating icons */}
              <div
                style={{
                  position: "absolute",
                  top: "24px",
                  left: "24px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "float 5s ease-in-out infinite",
                }}
              >
                <Target style={{ width: "14px", height: "14px", color: "#d4a853", opacity: 0.5 }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "float 5s ease-in-out infinite 1.5s",
                }}
              >
                <TrendingUp style={{ width: "14px", height: "14px", color: "#34d399", opacity: 0.5 }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "float 5s ease-in-out infinite 0.8s",
                }}
              >
                <Shield style={{ width: "14px", height: "14px", color: "#f87171", opacity: 0.5 }} />
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                    fontSize: "clamp(2rem, 4vw, 46px)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    color: "#f0f0f3",
                    marginBottom: "16px",
                    lineHeight: 1.1,
                  }}
                >
                  Intelligence that
                  <br />
                  never sleeps.
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "rgba(240,240,243,0.45)",
                    maxWidth: "420px",
                    margin: "0 auto 36px",
                    lineHeight: 1.65,
                  }}
                >
                  Join the platform where every web signal is stored, correlated, and surfaced through the lens that matters to your team.
                </p>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link
                    href="/register"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "13px 28px",
                      fontSize: "14px",
                      fontWeight: 500,
                      background: "#f0f0f3",
                      color: "#070708",
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Get access
                    <ArrowRight style={{ width: "15px", height: "15px" }} />
                  </Link>
                  <Link
                    href="/dashboard"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "13px 28px",
                      fontSize: "14px",
                      color: "rgba(240,240,243,0.55)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      textDecoration: "none",
                    }}
                  >
                    View demo
                    <ChevronRight style={{ width: "15px", height: "15px" }} />
                  </Link>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer
        style={{
          padding: "40px 32px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Eye style={{ width: "16px", height: "16px", color: "#a78bfa" }} />
          <span
            style={{
              fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.04em",
              color: "rgba(240,240,243,0.5)",
            }}
          >
            ARGUS
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Dashboard", "Signals", "Reports", "Agents"].map((link) => (
            <Link
              key={link}
              href={`/dashboard`}
              style={{
                fontSize: "13px",
                color: "rgba(240,240,243,0.3)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,240,243,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,240,243,0.3)")}
            >
              {link}
            </Link>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(240,240,243,0.2)", fontFamily: "var(--font-mono, monospace)" }}>
          © 2026 ARGUS · A hundred eyes on the web
        </p>
      </footer>
    </div>
  );
}
