"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";
import Footer from "@/components/footer.tsx";
import LandingNav from "@/components/landing-nav.tsx";

/* ============================================
   ARGUS LANDING PAGE
   Dark editorial — cofounder.co rhythm
   ============================================ */

/* Collection chapters data */
const _collectionChapters = [
  {
    id: "market",
    title: "Market Data",
    description:
      "Real-time pricing, competitor product changes, and market positioning shifts scraped from across the web.",
    color: "#4ADE80",
  },
  {
    id: "filing",
    title: "Filing Data",
    description:
      "SEC filings, 10-Q/10-K divergence detection, and earnings call transcript extraction.",
    color: "#5B8BDA",
  },
  {
    id: "social",
    title: "Social Data",
    description:
      "LinkedIn profile changes, hiring surges, executive moves, and sentiment signals.",
    color: "#D4A74B",
  },
  {
    id: "supplier",
    title: "Supplier Data",
    description:
      "Vendor health monitoring, supply chain disruption signals, and procurement pattern analysis.",
    color: "#C45B5B",
  },
  {
    id: "news",
    title: "News Data",
    description:
      "Breaking news aggregation, regulatory action alerts, and media sentiment tracking.",
    color: "#2DD4BF",
  },
];

/* Lens feature data */
const lensFeatures = [
  {
    id: "gtm",
    title: "GTM Lens",
    points: [
      "Competitor moves detected before announcements",
      "Hiring signal correlation with product launches",
      "Buying intent extraction from procurement postings",
      "Account enrichment with live web evidence",
    ],
    color: "#C4973B",
    accent: "rgba(196, 151, 59, 0.12)",
  },
  {
    id: "finance",
    title: "Finance Lens",
    points: [
      "Filing divergence alerts — 10-Q vs. guidance drift",
      "Supply-chain stress indicators from vendor data",
      "Earnings surprise prediction from social signals",
      "Cross-referenced alpha grounded in scraped evidence",
    ],
    color: "#5B8BDA",
    accent: "rgba(91, 139, 218, 0.12)",
  },
  {
    id: "security",
    title: "Security Lens",
    points: [
      "Vendor risk scoring with continuous monitoring",
      "Regulatory action early warning system",
      "Brand exposure detection across all surfaces",
      "Threat intel correlated with supplier health",
    ],
    color: "#DA5B5B",
    accent: "rgba(218, 91, 91, 0.12)",
  },
];

/* Word scramble data */
const scrambleWords = ["GTM", "FINANCE", "SECURITY", "RISK", "ALPHA"];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Hero Title Reveal
      gsap.to(".hero-word", {
        y: 0,
        stagger: 0.03,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.1,
      });

      // 2. Hero Subtitle
      gsap.fromTo(
        ".hero-sub",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.5 }
      );

      // 3. Hero BG Parallax
      gsap.to(".hero-bg", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // 4. Platform Title Reveal
      gsap.fromTo(
        ".platform-title",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#platform",
            start: "top 80%",
          },
        }
      );

      // 5. Mockup Zoom & Lift (3D reveal on scroll)
      gsap.fromTo(
        ".mockup-container",
        {
          opacity: 0.5,
          scale: 0.88,
          rotationX: 8,
          transformPerspective: 1000,
        },
        {
          opacity: 1,
          scale: 1,
          rotationX: 0,
          ease: "power1.out",
          scrollTrigger: {
            trigger: ".mockup-container",
            start: "top 95%",
            end: "top 45%",
            scrub: 0.5,
          },
        }
      );

      // 6. Lenses Title Reveal
      gsap.fromTo(
        ".lenses-title",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#lenses",
            start: "top 80%",
          },
        }
      );

      // 7. Lenses Rows Reveal (Alternate Slide-ins)
      gsap.utils.toArray<HTMLElement>(".lens-row").forEach((row, i) => {
        const isEven = i % 2 === 0;
        const text = row.querySelector(".lens-text");
        const card = row.querySelector(".lens-card");
        const points = row.querySelectorAll(".lens-point");

        gsap.fromTo(
          text,
          { opacity: 0, x: isEven ? -40 : 40 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );

        gsap.fromTo(
          card,
          { opacity: 0, x: isEven ? 40 : -40 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );

        gsap.fromTo(
          points,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: row,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // 8. Scramble Title Reveal
      gsap.fromTo(
        ".scramble-title",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#scramble",
            start: "top 80%",
          },
        }
      );

      // 9. Scramble Grid Entry Stagger (High-tech assembly)
      gsap.fromTo(
        ".scramble-cell-anim",
        {
          opacity: 0,
          scale: 0.3,
          rotationX: -60,
          y: 40,
        },
        {
          opacity: 1,
          scale: 1,
          rotationX: 0,
          y: 0,
          duration: 0.8,
          stagger: {
            each: 0.02,
            grid: "auto",
            from: "random",
          },
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: ".scramble-grid",
            start: "top 85%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      style={
        {
          background: "#0A0F0D",
          minHeight: "100vh",
          overflowX: "hidden",
          "--font-serif": "var(--font-instrument-serif)",
          "--font-sans": "var(--font-instrument-sans)",
          "--font-mono": "var(--font-jetbrains-mono)",
        } as React.CSSProperties
      }
    >
      <LandingNav />

      {/* ============ HERO SECTION ============ */}
      <section
        id="hero"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          paddingTop: "64px",
        }}
      >
        {/* Hero background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <Image
            alt="Argus active background visualization"
            className="hero-bg"
            fill
            priority
            src="/forbgaros.gif"
            style={{ objectFit: "cover", objectPosition: "center 60%" }}
            unoptimized
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,15,13,0.5) 0%, rgba(10,15,13,0.3) 30%, rgba(10,15,13,0.6) 70%, rgba(10,15,13,0.95) 100%)",
            }}
          />
        </div>

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            maxWidth: "820px",
            padding: "0 32px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.5rem, 5vw, 56px)",
              fontWeight: 400,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "#F5F5F0",
              marginBottom: "24px",
            }}
          >
            {"Argus lets you see the entire web through one memory."
              .split(" ")
              .map((word) => (
                <span
                  key={word}
                  style={{
                    display: "inline-block",
                    overflow: "hidden",
                    verticalAlign: "bottom",
                  }}
                >
                  <span
                    className="hero-word"
                    style={{
                      display: "inline-block",
                      transform: "translateY(100%)",
                    }}
                  >
                    {word}&nbsp;
                  </span>
                </span>
              ))}
          </h1>
          <p
            className="hero-sub"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "18px",
              fontWeight: 400,
              lineHeight: 1.65,
              color: "#8A9A8E",
              marginBottom: "40px",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
              opacity: 0,
            }}
          >
            Five agents scrape continuously. Three lenses analyze. One
            persistent graph connects every signal.
          </p>
        </div>
      </section>

      {/* ============ PLATFORM SECTION ============ */}
      <section
        id="platform"
        style={{
          padding: "160px 48px 120px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          className="platform-title"
          style={{
            textAlign: "center",
            marginBottom: "64px",
            opacity: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.8rem, 3.5vw, 40px)",
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              color: "#F5F5F0",
              marginBottom: "24px",
              maxWidth: "700px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Argus is a unified intelligence platform that stores once and
            analyzes three ways.
          </h2>
        </div>

        {/* Dashboard mockup floating on sage card */}
        <div
          className="mockup-container animate-glow-pulse"
          style={{
            background: "#143D26",
            borderRadius: "24px",
            padding: "20px",
            maxWidth: "1000px",
            height: "500px",
            margin: "0 auto",
            boxShadow: "0 20px 60px rgba(74, 222, 128, 0.06)",
            opacity: 0,
          }}
        >
          <div
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              height: "100%",
            }}
          >
            <Image
              alt="Argus dark dashboard — intelligence command center"
              height={1100}
              src="/dashboard-dark.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              width={1800}
            />
          </div>
        </div>
      </section>

      {/* ============ THREE LENSES SECTION ============ */}
      <section
        id="lenses"
        style={{
          padding: "140px 48px 160px",
          background: "#0A0F0D",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            className="lenses-title"
            style={{ textAlign: "center", marginBottom: "80px", opacity: 0 }}
          >
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.8rem, 3vw, 36px)",
                fontWeight: 400,
                lineHeight: 1.2,
                color: "#F5F5F0",
              }}
            >
              All three lenses on the same truth.
            </h2>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "48px" }}
          >
            {lensFeatures.map((lens) => (
              <div
                className="lens-row"
                key={lens.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "48px",
                  alignItems: "center",
                }}
              >
                <div style={{ order: 0 }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "28px",
                      fontWeight: 400,
                      color: "#F5F5F0",
                      marginBottom: "20px",
                    }}
                  >
                    {lens.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {lens.points.map((point) => (
                      <p
                        className="lens-point"
                        key={point}
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "15px",
                          lineHeight: 1.6,
                          color: "#8A9A8E",
                          opacity: 0,
                        }}
                      >
                        {point}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="lens-card" style={{ order: 1 }}>
                  <div
                    className="lens-card-inner"
                    style={{
                      background: "#111815",
                      borderRadius: "24px",
                      border: `1px solid ${lens.color}18`,
                      padding: "28px",
                      boxShadow: `0 8px 32px ${lens.color}08`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "20px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid rgba(138, 154, 142, 0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#F5F5F0",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {lens.title.toUpperCase()}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "#8A9A8E",
                        }}
                      >
                        LIVE
                      </span>
                    </div>
                    {lens.points.slice(0, 3).map((point, j) => (
                      <div
                        key={point}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 0",
                          borderBottom:
                            j < 2
                              ? "1px solid rgba(138, 154, 142, 0.05)"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "2px",
                            background: lens.accent,
                            border: `1px solid ${lens.color}40`,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "13px",
                            color: "#8A9A8E",
                            flex: 1,
                          }}
                        >
                          {point.split("—")[0].trim()}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: lens.color,
                            opacity: 0.6,
                          }}
                        >
                          {`0.${85 + j * 4}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WORD SCRAMBLE SECTION ============ */}
      <section
        id="scramble"
        style={{
          padding: "140px 48px",
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div className="scramble-title" style={{ opacity: 0 }}>
          <div
            className="scramble-grid"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
              marginBottom: "48px",
            }}
          >
            {scrambleWords.map((word, wi) => (
              <div key={word} style={{ display: "flex", gap: "8px" }}>
                {word.split("").map((char, ci) => {
                  const isTerracotta = wi === 3;
                  return (
                    <div
                      className={`scramble-cell scramble-cell-anim ${
                        isTerracotta
                          ? "scramble-cell-terracotta"
                          : "scramble-cell-sage"
                      }`}
                      key={ci}
                      style={{ opacity: 0 }}
                    >
                      {char}
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 8 - word.length) }).map(
                  (_, fi) => (
                    <div
                      className="scramble-cell scramble-cell-anim scramble-cell-dim"
                      key={`fill-${word}-${fi}`}
                      style={{ opacity: 0 }}
                    >
                      {String.fromCharCode(65 + ((wi * 3 + fi) % 26))}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              color: "#8A9A8E",
              maxWidth: "500px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            One platform covers every enterprise persona. Same data, different
            truth for each team.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
