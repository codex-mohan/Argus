"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Signals", href: "/signals" },
  { label: "Agents", href: "/agents" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      id="dashboard-nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "64px",
        background: "rgba(10, 15, 13, 0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(138, 154, 142, 0.1)",
      }}
    >
      {/* Left: Logo + Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            color: "#F5F5F0",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            Argus
          </span>
        </Link>

        {/* Page tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "#111815",
            borderRadius: "8px",
            padding: "3px",
            border: "1px solid rgba(138, 154, 142, 0.1)",
          }}
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                href={tab.href}
                key={tab.label}
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isActive ? "#000000" : "#8A9A8E",
                  fontFamily: "var(--font-sans)",
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: isActive ? "#FFFFFF" : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: Search + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#111815",
            border: "1px solid rgba(138, 154, 142, 0.1)",
            borderRadius: "8px",
            padding: "6px 14px",
            width: "260px",
          }}
        >
          <svg
            fill="none"
            height="14"
            style={{ flexShrink: 0 }}
            viewBox="0 0 16 16"
            width="14"
          >
            <title>Search Icon</title>
            <circle cx="7" cy="7" r="5.5" stroke="#8A9A8E" strokeWidth="1.5" />
            <line
              stroke="#8A9A8E"
              strokeLinecap="round"
              strokeWidth="1.5"
              x1="11"
              x2="14.5"
              y1="11"
              y2="14.5"
            />
          </svg>
          <input
            placeholder="Search signals, agents..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#F5F5F0",
              fontSize: "14px",
              width: "100%",
              fontFamily: "var(--font-sans)",
            }}
            type="text"
          />
          {/* Mic icon */}
          <svg
            fill="none"
            height="14"
            style={{ flexShrink: 0, cursor: "pointer", opacity: 0.5 }}
            viewBox="0 0 16 16"
            width="14"
          >
            <title>Microphone Icon</title>
            <rect
              height="9"
              rx="2.5"
              stroke="#8A9A8E"
              strokeWidth="1.2"
              width="5"
              x="5.5"
              y="1"
            />
            <path
              d="M3 8C3 10.76 5.24 13 8 13C10.76 13 13 10.76 13 8"
              stroke="#8A9A8E"
              strokeLinecap="round"
              strokeWidth="1.2"
            />
            <line
              stroke="#8A9A8E"
              strokeLinecap="round"
              strokeWidth="1.2"
              x1="8"
              x2="8"
              y1="13"
              y2="15"
            />
          </svg>
        </div>

        {/* User avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #143D26, #A8A890)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          PC
        </div>
      </div>
    </nav>
  );
}
