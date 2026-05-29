"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [selectedLens, setSelectedLens] = useState("gtm");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate setting profile and direct to dashboard
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <main
      style={{
        background: "#0A0F0D",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#F5F5F0",
        padding: "48px 24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "480px",
        }}
      >
        <div style={{ width: "100%" }}>
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <div style={{ marginBottom: "16px" }}>
              <Link
                href="/"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "24px",
                  fontWeight: 400,
                  textDecoration: "none",
                  color: "#F5F5F0",
                }}
              >
                Argus
              </Link>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "32px",
                fontWeight: 400,
                color: "#F5F5F0",
                marginBottom: "8px",
              }}
            >
              Profile Setup
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: "#8A9A8E",
              }}
            >
              Tailor the swarm intelligence briefs to your parameters
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="fullName"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#8A9A8E",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "#111815",
                    border: "1px solid rgba(138, 154, 142, 0.12)",
                    borderRadius: "8px",
                    color: "#F5F5F0",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  type="text"
                  value={name}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="company"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#8A9A8E",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Company Name
                </label>
                <input
                  id="company"
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "#111815",
                    border: "1px solid rgba(138, 154, 142, 0.12)",
                    borderRadius: "8px",
                    color: "#F5F5F0",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  type="text"
                  value={company}
                />
              </div>
            </div>

            {/* INTERACTIVE LENS SELECTION */}
            <div style={{ marginBottom: "32px" }}>
              <p
                style={{
                  display: "block",
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#8A9A8E",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Primary Intel Lens
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* GTM Lens Option */}
                <button
                  onClick={() => setSelectedLens("gtm")}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "16px",
                    background: "#111815",
                    border: `1px solid ${selectedLens === "gtm" ? "#C4973B" : "rgba(138, 154, 142, 0.12)"}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      selectedLens === "gtm"
                        ? "0 0 16px rgba(196, 151, 59, 0.15)"
                        : "none",
                  }}
                  type="button"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "16px",
                        color: "#F5F5F0",
                        fontWeight: selectedLens === "gtm" ? 600 : 400,
                      }}
                    >
                      Go-To-Market (GTM)
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "12px",
                      color: "#8A9A8E",
                      margin: 0,
                    }}
                  >
                    Track competitor products, executive moves, hiring signals,
                    and intent data.
                  </p>
                </button>

                {/* Finance Lens Option */}
                <button
                  onClick={() => setSelectedLens("finance")}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "16px",
                    background: "#111815",
                    border: `1px solid ${selectedLens === "finance" ? "#5B8BDA" : "rgba(138, 154, 142, 0.12)"}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      selectedLens === "finance"
                        ? "0 0 16px rgba(91, 139, 218, 0.15)"
                        : "none",
                  }}
                  type="button"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "16px",
                        color: "#F5F5F0",
                        fontWeight: selectedLens === "finance" ? 600 : 400,
                      }}
                    >
                      Finance & Alpha
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "12px",
                      color: "#8A9A8E",
                      margin: 0,
                    }}
                  >
                    Correlate SEC filings, 10-Q/K divergence, earnings reports,
                    and supply-chain metrics.
                  </p>
                </button>

                {/* Security Lens Option */}
                <button
                  onClick={() => setSelectedLens("security")}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "16px",
                    background: "#111815",
                    border: `1px solid ${selectedLens === "security" ? "#DA5B5B" : "rgba(138, 154, 142, 0.12)"}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      selectedLens === "security"
                        ? "0 0 16px rgba(218, 91, 91, 0.15)"
                        : "none",
                  }}
                  type="button"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "16px",
                        color: "#F5F5F0",
                        fontWeight: selectedLens === "security" ? 600 : 400,
                      }}
                    >
                      Security & Vendor Risk
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "12px",
                      color: "#8A9A8E",
                      margin: 0,
                    }}
                  >
                    Monitor regulatory actions, vendor status shifts, cyber
                    alerts, and vulnerability intel.
                  </p>
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              style={{
                width: "100%",
                padding: "14px",
                background: "#4ADE80",
                color: "#0A0F0D",
                border: "none",
                borderRadius: "8px",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s ease",
              }}
              type="submit"
            >
              {loading ? "Spinning up swarm nodes..." : "Launch Swarm"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
