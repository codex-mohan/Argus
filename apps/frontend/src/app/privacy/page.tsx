"use client";

import Footer from "@/components/footer.tsx";
import LandingNav from "@/components/landing-nav.tsx";

/* ============================================
   ARGUS PRIVACY POLICY
   Dark editorial — cofounder.co rhythm
   Effective: May 29, 2026
   ============================================ */

const sectionDivider: React.CSSProperties = {
  width: "100%",
  height: "1px",
  background: "rgba(138, 154, 142, 0.08)",
  margin: "56px 0",
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "24px",
  fontWeight: 400,
  lineHeight: 1.3,
  letterSpacing: "-0.01em",
  color: "#F5F5F0",
  marginBottom: "20px",
};

const sectionSubheading: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: 1.4,
  color: "#C8D0CA",
  marginBottom: "12px",
  marginTop: "28px",
};

const bodyText: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "15px",
  fontWeight: 400,
  lineHeight: 1.75,
  color: "#8A9A8E",
  marginBottom: "16px",
};

const _bulletItem: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "15px",
  fontWeight: 400,
  lineHeight: 1.75,
  color: "#8A9A8E",
  paddingLeft: "20px",
  position: "relative" as const,
  marginBottom: "8px",
};

const inlineCode: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  color: "#4ADE80",
  background: "rgba(74, 222, 128, 0.08)",
  padding: "2px 6px",
  borderRadius: "4px",
};

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          background: "#4ADE80",
          marginTop: "10px",
          flexShrink: 0,
        }}
      />
      <p style={{ ...bodyText, marginBottom: 0 }}>{children}</p>
    </div>
  );
}

function Divider() {
  return <div style={sectionDivider} />;
}

export default function PrivacyPolicy() {
  return (
    <div style={{ background: "#0A0F0D", minHeight: "100vh" }}>
      <LandingNav />

      {/* ============ HERO HEADER ============ */}
      <section
        style={{
          paddingTop: "160px",
          paddingBottom: "64px",
          paddingLeft: "32px",
          paddingRight: "32px",
          textAlign: "center",
          borderBottom: "1px solid rgba(138, 154, 142, 0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#4ADE80",
                boxShadow: "0 0 8px rgba(74, 222, 128, 0.4)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#4ADE80",
              }}
            >
              Legal
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2rem, 4vw, 48px)",
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#F5F5F0",
              marginBottom: "20px",
            }}
          >
            Privacy Policy
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "#8A9A8E",
              maxWidth: "520px",
              margin: "0 auto 16px",
            }}
          >
            How Argus collects, processes, and protects the data that powers
            enterprise intelligence.
          </p>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "rgba(138, 154, 142, 0.5)",
              letterSpacing: "0.06em",
            }}
          >
            Effective Date: May 29, 2026
          </p>
        </div>
      </section>

      {/* ============ POLICY CONTENT ============ */}
      <section
        style={{
          paddingTop: "80px",
          paddingBottom: "120px",
          paddingLeft: "32px",
          paddingRight: "32px",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          {/* Preamble */}
          <p style={bodyText}>
            Argus (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
            a unified enterprise intelligence platform that uses specialized
            agents to continuously collect publicly available web data, store it
            in a persistent knowledge graph, and analyze it through three
            distinct lenses — Go-to-Market (GTM), Finance, and Security. This
            Privacy Policy explains what information we collect, how we use it,
            and the choices you have regarding your data.
          </p>
          <p style={bodyText}>
            By accessing or using the Argus platform, you agree to the practices
            described in this policy. If you do not agree, please discontinue
            use of the platform.
          </p>

          <Divider />

          {/* 1. Information We Collect */}
          <h2 style={sectionHeading}>1. Information We Collect</h2>

          <h3 style={sectionSubheading}>Account Information</h3>
          <p style={bodyText}>
            When you create an Argus account or request access to the platform,
            we collect identifying information necessary to provision and secure
            your account:
          </p>
          <Bullet>Name, email address, and organization affiliation</Bullet>
          <Bullet>
            Authentication credentials (hashed and salted — never stored in
            plaintext)
          </Bullet>
          <Bullet>
            Role and permission level within your organization&apos;s workspace
          </Bullet>
          <Bullet>Billing and subscription details for paid plans</Bullet>

          <h3 style={sectionSubheading}>Platform Usage Data</h3>
          <p style={bodyText}>
            We collect data about how you interact with the Argus dashboard and
            its features to maintain service quality and improve the platform:
          </p>
          <Bullet>Pages visited, features used, and session duration</Bullet>
          <Bullet>
            Queries submitted to the intelligence lenses (GTM, Finance,
            Security)
          </Bullet>
          <Bullet>
            Agent configurations, watchlists, and alert preferences
          </Bullet>
          <Bullet>Dashboard layout customizations and saved views</Bullet>
          <Bullet>
            Device type, browser version, operating system, and IP address
          </Bullet>

          <h3 style={sectionSubheading}>Web-Scraped Intelligence Data</h3>
          <p style={bodyText}>
            Argus operates five specialized collection agents — MarketDataBot,
            FilingDataBot, SocialDataBot, SupplierDataBot, and NewsDataBot —
            that continuously gather publicly available information from the
            open web. This data is not personal data about you; it is
            third-party business intelligence collected from public sources.
            Details on this collection are covered in Section 3.
          </p>

          <h3 style={sectionSubheading}>Voice Input Data</h3>
          <p style={bodyText}>
            If you use the optional voice query feature, Argus processes audio
            input through Speechmatics for real-time speech-to-text conversion.
            Audio recordings are processed transiently and are not stored after
            transcription is complete. Only the resulting text transcript is
            retained as part of your query history.
          </p>

          <Divider />

          {/* 2. How We Use Your Information */}
          <h2 style={sectionHeading}>2. How We Use Your Information</h2>
          <p style={bodyText}>
            We use the information we collect for the following purposes:
          </p>

          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>
              Providing Intelligence Services
            </strong>{" "}
            — Routing your queries to the appropriate lens agents, generating
            briefs, alerts, and correlation signals tailored to your watchlists.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>
              Agent Memory Management
            </strong>{" "}
            — Storing and recalling contextual intelligence in the Cognee
            knowledge graph so that insights persist across sessions and agents
            can cross-reference findings.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Platform Improvement</strong> —
            Analyzing aggregated usage patterns to improve agent accuracy, lens
            relevance, and dashboard usability. We never use your individual
            queries to train third-party AI models.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>
              Security &amp; Fraud Prevention
            </strong>{" "}
            — Detecting unauthorized access, preventing abuse of scraping
            infrastructure, and maintaining platform integrity.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Communication</strong> —
            Sending service notifications, alert digests, and (with your
            consent) product updates.
          </Bullet>

          <Divider />

          {/* 3. Data Sources & Web Scraping */}
          <h2 style={sectionHeading}>3. Data Sources &amp; Web Scraping</h2>
          <p style={bodyText}>
            Argus collects business intelligence exclusively from publicly
            available web sources. We use Bright Data&apos;s infrastructure —
            including its SDK, SERP API, and pre-built MCP extractors — to
            gather structured data from public websites, search engine results,
            regulatory filing databases, news outlets, and publicly listed
            business profiles.
          </p>

          <h3 style={sectionSubheading}>What We Scrape</h3>
          <Bullet>
            Public product listings, pricing, and availability data
            (MarketDataBot)
          </Bullet>
          <Bullet>
            SEC filings, 10-Q/10-K reports, and earnings transcripts
            (FilingDataBot)
          </Bullet>
          <Bullet>
            Publicly visible LinkedIn profiles, job postings, and hiring trends
            (SocialDataBot)
          </Bullet>
          <Bullet>
            Supplier catalogs, vendor directories, and procurement notices
            (SupplierDataBot)
          </Bullet>
          <Bullet>
            News articles, press releases, and regulatory action announcements
            (NewsDataBot)
          </Bullet>

          <h3 style={sectionSubheading}>How Scraped Data Is Processed</h3>
          <p style={bodyText}>
            Raw scraped content is ingested, structured, and stored in the
            Cognee knowledge graph with full provenance — every data point
            includes its source URL, extraction timestamp, collecting agent ID,
            and confidence score. The three analysis lenses (GTM, Finance,
            Security) then query this shared graph to produce intelligence
            briefs. We do not scrape content behind authentication walls,
            paywalls, or access restrictions without explicit authorization.
          </p>

          <h3 style={sectionSubheading}>Compliance</h3>
          <p style={bodyText}>
            All web data collection is performed in compliance with applicable
            laws and the terms of service of target websites. We respect{" "}
            <span style={inlineCode}>robots.txt</span> directives and implement
            rate limiting through Spectra&apos;s CompositeRateLimiter to prevent
            excessive load on source servers. If a website operator believes
            their content is being collected improperly, they may contact us at{" "}
            <a
              href="mailto:privacy@argus.dev"
              style={{ color: "#4ADE80", textDecoration: "none" }}
            >
              privacy@argus.dev
            </a>{" "}
            and we will promptly review and address the concern.
          </p>

          <Divider />

          {/* 4. Agent Memory & Data Retention */}
          <h2 style={sectionHeading}>4. Agent Memory &amp; Data Retention</h2>
          <p style={bodyText}>
            Argus stores intelligence in a persistent knowledge graph powered by
            Cognee. This memory layer is what enables cross-agent context — a
            finding by one agent can inform analysis by another. Understanding
            how this memory works is central to understanding Argus&apos;s data
            practices.
          </p>

          <h3 style={sectionSubheading}>Knowledge Graph Structure</h3>
          <p style={bodyText}>
            Every piece of data stored in the Cognee graph includes mandatory
            metadata: the source URL, scrape timestamp, collecting agent
            identity, a confidence score (0.0–1.0), and a data type
            classification. Entries are organized into shared datasets by data
            source (e.g., <span style={inlineCode}>raw_market_data</span>,{" "}
            <span style={inlineCode}>raw_filing_data</span>,{" "}
            <span style={inlineCode}>lens_findings</span>,{" "}
            <span style={inlineCode}>correlation_signals</span>).
          </p>

          <h3 style={sectionSubheading}>
            TTL Policies &amp; Automatic Cleanup
          </h3>
          <p style={bodyText}>
            Not all data is kept indefinitely. Argus enforces time-to-live (TTL)
            policies to prevent stale intelligence from polluting analysis:
          </p>

          {/* TTL table */}
          <div
            style={{
              background: "#111815",
              borderRadius: "16px",
              border: "1px solid rgba(138, 154, 142, 0.08)",
              overflow: "hidden",
              marginBottom: "20px",
              marginTop: "16px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#8A9A8E",
                      textAlign: "left",
                      padding: "14px 20px",
                      borderBottom: "1px solid rgba(138, 154, 142, 0.08)",
                    }}
                  >
                    Data Category
                  </th>
                  <th
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#8A9A8E",
                      textAlign: "left",
                      padding: "14px 20px",
                      borderBottom: "1px solid rgba(138, 154, 142, 0.08)",
                    }}
                  >
                    Retention Period
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Raw price & market data", "7 days"],
                  ["SEC filings & financial data", "30 days"],
                  ["Social & hiring signals", "14 days"],
                  ["Supplier & vendor data", "14 days"],
                  ["News & regulatory alerts", "30 days"],
                  [
                    "Lens findings & briefs",
                    "Indefinite (until manual deletion)",
                  ],
                  ["Correlation signals", "Indefinite (until manual deletion)"],
                  ["Account & usage data", "Duration of account + 90 days"],
                ].map(([category, retention], i) => (
                  <tr key={category}>
                    <td
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "14px",
                        color: "#C8D0CA",
                        padding: "12px 20px",
                        borderBottom:
                          i < 7
                            ? "1px solid rgba(138, 154, 142, 0.05)"
                            : "none",
                      }}
                    >
                      {category}
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: "#8A9A8E",
                        padding: "12px 20px",
                        borderBottom:
                          i < 7
                            ? "1px solid rgba(138, 154, 142, 0.05)"
                            : "none",
                      }}
                    >
                      {retention}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={bodyText}>
            Automated cleanup runs via Cognee&apos;s{" "}
            <span style={inlineCode}>forget</span> operation, which removes
            entries from the knowledge graph once they exceed their TTL. You may
            also request manual deletion of any data associated with your
            account at any time.
          </p>

          <Divider />

          {/* 5. Third-Party Services */}
          <h2 style={sectionHeading}>5. Third-Party Services</h2>
          <p style={bodyText}>
            Argus relies on several third-party services to deliver its
            intelligence capabilities. Each provider processes data on our
            behalf and is bound by contractual obligations regarding data
            protection:
          </p>

          {/* Provider cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            {[
              {
                name: "Bright Data",
                role: "Web data collection infrastructure",
                detail:
                  "Provides the scraping SDK, SERP API, and pre-built data extractors used by collection agents. All data collection passes through Bright Data's compliant proxy network.",
                color: "#4ADE80",
              },
              {
                name: "AI/ML API",
                role: "Large language model access",
                detail:
                  "Provides access to 400+ AI models via an OpenAI-compatible endpoint. Used for analysis, report generation, and signal extraction. Queries are processed but not retained by the provider for model training.",
                color: "#5B8BDA",
              },
              {
                name: "Cognee",
                role: "Persistent knowledge graph & agent memory",
                detail:
                  "Runs as a self-hosted Docker service. All intelligence data is stored in your deployment — no data is sent to Cognee's external servers. Memory operations (remember, recall, improve, forget) execute locally.",
                color: "#D4A74B",
              },
              {
                name: "Speechmatics",
                role: "Real-time speech-to-text (optional)",
                detail:
                  "Processes voice input for the optional voice query feature. Audio is processed transiently via WebSocket connection and is not persisted by Speechmatics after transcription.",
                color: "#2DD4BF",
              },
              {
                name: "TriggerWare",
                role: "Workflow automation (optional)",
                detail:
                  "Connects agent outputs to external actions such as Slack notifications and email alerts. Only event metadata (signal type, severity, timestamp) is shared — not the full intelligence content.",
                color: "#C45B5B",
              },
            ].map((provider) => (
              <div
                key={provider.name}
                style={{
                  background: "#111815",
                  borderRadius: "16px",
                  border: "1px solid rgba(138, 154, 142, 0.08)",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: provider.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#F5F5F0",
                    }}
                  >
                    {provider.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "#8A9A8E",
                      marginLeft: "auto",
                    }}
                  >
                    {provider.role}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                    color: "#8A9A8E",
                    margin: 0,
                  }}
                >
                  {provider.detail}
                </p>
              </div>
            ))}
          </div>

          <Divider />

          {/* 6. Data Security */}
          <h2 style={sectionHeading}>6. Data Security</h2>
          <p style={bodyText}>
            We implement industry-standard security measures to protect your
            data and the intelligence stored within Argus:
          </p>

          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Encryption in Transit</strong>{" "}
            — All communications between your browser and Argus servers, between
            agents and third-party providers, and between internal services are
            encrypted using TLS 1.3.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Encryption at Rest</strong> —
            The Cognee knowledge graph, session database, and all stored
            intelligence data are encrypted at rest using AES-256.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Access Controls</strong> —
            Role-based access control (RBAC) restricts data visibility by user
            role and organization. API keys are scoped per service and rotated
            regularly.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Audit Logging</strong> — All
            agent actions, memory operations, and data access events are logged
            to an immutable audit trail via Spectra&apos;s SessionStore.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>
              Infrastructure Isolation
            </strong>{" "}
            — Cognee runs as a self-hosted Docker service within your
            deployment. Scraped data never leaves your infrastructure unless
            explicitly configured for external alerts.
          </Bullet>

          <p style={bodyText}>
            No security system is perfect. If you discover a vulnerability,
            please report it to{" "}
            <a
              href="mailto:privacy@argus.dev"
              style={{ color: "#4ADE80", textDecoration: "none" }}
            >
              privacy@argus.dev
            </a>{" "}
            and we will respond within 48 hours.
          </p>

          <Divider />

          {/* 7. Your Rights */}
          <h2 style={sectionHeading}>7. Your Rights</h2>
          <p style={bodyText}>
            Depending on your jurisdiction, you may have the following rights
            regarding your personal data:
          </p>

          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Access</strong> — Request a
            copy of all personal data we hold about you, including your query
            history, agent configurations, and account metadata.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Correction</strong> — Request
            correction of inaccurate personal data associated with your account.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Deletion</strong> — Request
            deletion of your account and all associated personal data. Note:
            aggregated, de-identified analytics data may be retained. Shared
            intelligence generated from public web scraping is not personal data
            and is not subject to individual deletion requests.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Data Export</strong> — Request
            a machine-readable export of your data, including saved queries,
            watchlists, alert configurations, and generated briefs.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Opt-Out</strong> — Opt out of
            non-essential communications at any time. You may also disable the
            voice input feature and TriggerWare integrations from your account
            settings.
          </Bullet>
          <Bullet>
            <strong style={{ color: "#C8D0CA" }}>Restriction</strong> — Request
            that we limit processing of your personal data while a concern is
            being investigated.
          </Bullet>

          <p style={bodyText}>
            To exercise any of these rights, contact us at{" "}
            <a
              href="mailto:privacy@argus.dev"
              style={{ color: "#4ADE80", textDecoration: "none" }}
            >
              privacy@argus.dev
            </a>
            . We will respond within 30 days of receiving your request.
          </p>

          <Divider />

          {/* 8. Cookies & Tracking */}
          <h2 style={sectionHeading}>8. Cookies &amp; Tracking</h2>
          <p style={bodyText}>
            Argus uses a minimal set of cookies strictly necessary for platform
            operation:
          </p>

          <div
            style={{
              background: "#111815",
              borderRadius: "16px",
              border: "1px solid rgba(138, 154, 142, 0.08)",
              overflow: "hidden",
              marginBottom: "20px",
              marginTop: "16px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Cookie", "Purpose", "Duration"].map((header) => (
                    <th
                      key={header}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#8A9A8E",
                        textAlign: "left",
                        padding: "14px 20px",
                        borderBottom: "1px solid rgba(138, 154, 142, 0.08)",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "argus_session",
                    "Authentication & session management",
                    "Session",
                  ],
                  [
                    "argus_prefs",
                    "Dashboard layout & display preferences",
                    "1 year",
                  ],
                  [
                    "argus_csrf",
                    "Cross-site request forgery protection",
                    "Session",
                  ],
                ].map(([cookie, purpose, duration], i) => (
                  <tr key={cookie}>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: "#C8D0CA",
                        padding: "12px 20px",
                        borderBottom:
                          i < 2
                            ? "1px solid rgba(138, 154, 142, 0.05)"
                            : "none",
                      }}
                    >
                      {cookie}
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "14px",
                        color: "#8A9A8E",
                        padding: "12px 20px",
                        borderBottom:
                          i < 2
                            ? "1px solid rgba(138, 154, 142, 0.05)"
                            : "none",
                      }}
                    >
                      {purpose}
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "13px",
                        color: "#8A9A8E",
                        padding: "12px 20px",
                        borderBottom:
                          i < 2
                            ? "1px solid rgba(138, 154, 142, 0.05)"
                            : "none",
                      }}
                    >
                      {duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={bodyText}>
            We do not use third-party advertising trackers, social media pixels,
            or fingerprinting techniques. Argus does not sell or share user data
            with advertisers.
          </p>

          <Divider />

          {/* 9. Changes to This Policy */}
          <h2 style={sectionHeading}>9. Changes to This Policy</h2>
          <p style={bodyText}>
            We may update this Privacy Policy to reflect changes in our
            practices, legal requirements, or platform capabilities. When we
            make material changes:
          </p>

          <Bullet>
            We will update the &quot;Effective Date&quot; at the top of this
            page.
          </Bullet>
          <Bullet>
            We will notify active users via email and an in-dashboard
            notification at least 14 days before changes take effect.
          </Bullet>
          <Bullet>
            For changes that materially affect data collection or sharing
            practices, we will request renewed consent where required by
            applicable law.
          </Bullet>

          <p style={bodyText}>
            Continued use of Argus after the effective date of a revised policy
            constitutes acceptance of the updated terms.
          </p>

          <Divider />

          {/* 10. Contact Information */}
          <h2 style={sectionHeading}>10. Contact Information</h2>
          <p style={bodyText}>
            If you have questions about this Privacy Policy, want to exercise
            your data rights, or need to report a privacy concern, reach out to
            us:
          </p>

          <div
            style={{
              background: "#111815",
              borderRadius: "16px",
              border: "1px solid rgba(138, 154, 142, 0.08)",
              padding: "28px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#8A9A8E",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </p>
                <a
                  href="mailto:privacy@argus.dev"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    color: "#4ADE80",
                    textDecoration: "none",
                  }}
                >
                  privacy@argus.dev
                </a>
              </div>
              <div
                style={{
                  height: "1px",
                  background: "rgba(138, 154, 142, 0.06)",
                }}
              />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#8A9A8E",
                    marginBottom: "6px",
                  }}
                >
                  Response Time
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    color: "#C8D0CA",
                    margin: 0,
                  }}
                >
                  Within 30 days for data rights requests. Within 48 hours for
                  security reports.
                </p>
              </div>
              <div
                style={{
                  height: "1px",
                  background: "rgba(138, 154, 142, 0.06)",
                }}
              />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#8A9A8E",
                    marginBottom: "6px",
                  }}
                >
                  Mailing Address
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    color: "#C8D0CA",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Argus Intelligence, Inc.
                  <br />
                  Privacy Team
                  <br />
                  548 Market Street, Suite 36879
                  <br />
                  San Francisco, CA 94104
                </p>
              </div>
            </div>
          </div>

          {/* End note */}
          <div
            style={{
              marginTop: "64px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "rgba(138, 154, 142, 0.2)",
                margin: "0 auto 24px",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "16px",
                fontStyle: "italic",
                color: "rgba(138, 154, 142, 0.4)",
                margin: 0,
              }}
            >
              A hundred eyes, one standard of care.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
