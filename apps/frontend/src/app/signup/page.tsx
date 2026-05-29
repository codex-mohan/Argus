"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    // Simulate user creation and push to onboarding
    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 1500);
  };

  return (
    <main
      style={{
        background: "#0A0F0D",
        minHeight: "100vh",
        display: "flex",
        color: "#F5F5F0",
      }}
    >
      {/* LEFT SIDE: COVER IMAGE */}
      <section
        className="hidden md:flex"
        style={{
          position: "relative",
          width: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        >
          <Image
            alt="Argus Platform Illustration"
            fill
            priority
            src="/argus_auth_cover.png"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,15,13,0.3) 0%, rgba(10,15,13,0.85) 100%)",
            }}
          />
        </div>

        {/* LOGO */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "24px",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              color: "#F5F5F0",
            }}
          >
            Argus
          </Link>
        </div>

        {/* TAGLINE */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: "440px" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "36px",
              fontWeight: 400,
              lineHeight: 1.15,
              marginBottom: "16px",
            }}
          >
            A hundred eyes on the web.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#8A9A8E",
            }}
          >
            Five specialized agents continuously scrape the live web, persistent
            knowledge graph connects the signal, and three lenses deliver GTM,
            Finance, and Security intelligence.
          </p>
        </div>
      </section>

      {/* RIGHT SIDE: SIGNUP FORM */}
      <section
        className="md:w-1/2"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "36px",
                fontWeight: 400,
                color: "#F5F5F0",
                marginBottom: "8px",
              }}
            >
              Get started
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: "#8A9A8E",
              }}
            >
              Create your account to configure intelligence swarms
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(218, 91, 91, 0.1)",
                border: "1px solid rgba(218, 91, 91, 0.3)",
                color: "#DA5B5B",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="email"
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
                Email Address
              </label>
              <input
                id="email"
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(138, 154, 142, 0.12)";
                  e.target.style.boxShadow = "none";
                }}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4ADE80";
                  e.target.style.boxShadow =
                    "0 0 12px rgba(74, 222, 128, 0.12)";
                }}
                placeholder="you@domain.com"
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
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                }}
                type="email"
                value={email}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="password"
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
                Password
              </label>
              <input
                id="password"
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(138, 154, 142, 0.12)";
                  e.target.style.boxShadow = "none";
                }}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4ADE80";
                  e.target.style.boxShadow =
                    "0 0 12px rgba(74, 222, 128, 0.12)";
                }}
                placeholder="••••••••"
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
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                }}
                type="password"
                value={password}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="confirm-password"
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
                Confirm Password
              </label>
              <input
                id="confirm-password"
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(138, 154, 142, 0.12)";
                  e.target.style.boxShadow = "none";
                }}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4ADE80";
                  e.target.style.boxShadow =
                    "0 0 12px rgba(74, 222, 128, 0.12)";
                }}
                placeholder="••••••••"
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
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                }}
                type="password"
                value={confirmPassword}
              />
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
              {loading ? "Constructing graph..." : "Create Account"}
            </button>
          </form>

          {/* Social oauth dividers */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "32px 0 24px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(138, 154, 142, 0.08)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "#8A9A8E",
                padding: "0 16px",
                opacity: 0.5,
              }}
            >
              OR
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(138, 154, 142, 0.08)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(138, 154, 142, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(138, 154, 142, 0.12)",
                borderRadius: "8px",
                color: "#F5F5F0",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s ease",
              }}
              type="button"
            >
              Google
            </button>
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(138, 154, 142, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(138, 154, 142, 0.12)",
                borderRadius: "8px",
                color: "#F5F5F0",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s ease",
              }}
              type="button"
            >
              GitHub
            </button>
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: "#8A9A8E",
              }}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                style={{
                  color: "#4ADE80",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
