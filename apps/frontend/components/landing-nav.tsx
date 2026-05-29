"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <nav
        id="landing-nav"
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 8px 8px 24px",
          height: "48px",
          background: "rgba(18, 18, 18, 0.75)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "9999px",
          transition: "all 0.4s ease",
          boxShadow: scrolled ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "none",
          gap: "24px",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#F5F5F0",
            fontFamily: "var(--font-serif)",
            fontSize: "20px",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          Argus
        </Link>

        <div
          style={{ display: "flex", alignItems: "center", padding: "0 16px" }}
        >
          <Link
            href="/docs"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F5F5F0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#8A9A8E";
            }}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#8A9A8E",
              textDecoration: "none",
              letterSpacing: "0.02em",
              fontFamily: "var(--font-sans)",
              transition: "color 0.2s ease",
            }}
          >
            Docs
          </Link>
        </div>

        <Link
          href="/login"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F0F0F0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
          }}
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#000000",
            textDecoration: "none",
            padding: "6px 20px",
            borderRadius: "9999px",
            background: "#FFFFFF",
            fontFamily: "var(--font-serif)",
            transition: "all 0.25s ease",
            letterSpacing: "0.02em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          Deploy
        </Link>
      </nav>
    </div>
  );
}
