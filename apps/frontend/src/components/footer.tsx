"use client";

import Link from "next/link";

const footerLinks = [
  { label: "Docs", href: "/docs" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export default function Footer() {
  return (
    <footer
      id="site-footer"
      style={{
        background: "#0A0F0D",
        borderTop: "1px solid rgba(138, 154, 142, 0.08)",
        padding: "48px 48px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
        }}
      >
        {/* Left — Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "18px",
              fontWeight: 400,
              color: "#F5F5F0",
              letterSpacing: "-0.01em",
            }}
          >
            Argus
          </span>
        </div>

        {/* Center — Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            flexWrap: "wrap",
          }}
        >
          {footerLinks.map((link) => (
            <Link
              href={link.href}
              key={link.label}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#F5F5F0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8A9A8E";
              }}
              style={{
                fontSize: "13px",
                fontWeight: 400,
                color: "#8A9A8E",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                transition: "color 0.2s ease",
                letterSpacing: "0.02em",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
