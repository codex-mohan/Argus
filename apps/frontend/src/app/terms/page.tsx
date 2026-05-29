"use client";

import Link from "next/link";
import Footer from "@/components/footer.tsx";
import LandingNav from "@/components/landing-nav.tsx";

const effectiveDate = "May 29, 2026";

const sections = [
  {
    number: 1,
    title: "Acceptance of Terms",
    content: `By accessing or using the Argus platform ("Service"), you ("User," "you," or "your") agree to be bound by these Terms & Conditions ("Terms"). If you are accepting these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity. If you do not agree to these Terms, you must not access or use the Service.

Your continued use of the Service following the posting of any changes to these Terms constitutes acceptance of those changes. We encourage you to review these Terms periodically.`,
  },
  {
    number: 2,
    title: "Description of Service",
    content: `Argus is a unified enterprise intelligence platform that deploys five specialized data-collection agents — MarketDataBot, FilingDataBot, SocialDataBot, SupplierDataBot, and NewsDataBot — to continuously gather publicly available information from the web. This data is stored in a persistent knowledge graph powered by Cognee.

The collected intelligence is analyzed through three distinct analytical lenses:

• GTM Lens — competitor intelligence, hiring signals, buying intent, and account enrichment.
• Finance Lens — alpha signal detection, supply-chain stress indicators, filing divergence analysis, and earnings intelligence.
• Security Lens — vendor risk scoring, regulatory action monitoring, brand exposure detection, and threat intelligence correlation.

Argus uses Bright Data for web data collection, AI/ML API for large language model access across 400+ models, and additional third-party services for voice input (Speechmatics) and workflow automation (TriggerWare). The platform delivers real-time intelligence briefs, signal feeds, and configurable alerts through a web-based dashboard.`,
  },
  {
    number: 3,
    title: "User Accounts & Registration",
    content: `To access certain features of the Service, you may be required to create an account. You agree to:

(a) Provide accurate, current, and complete information during registration;
(b) Maintain and promptly update your account information;
(c) Maintain the security and confidentiality of your login credentials;
(d) Accept responsibility for all activities that occur under your account;
(e) Notify Argus immediately of any unauthorized use of your account.

Argus reserves the right to suspend or terminate accounts that contain inaccurate information, violate these Terms, or remain inactive for an extended period. Each user account is for a single individual or authorized entity and may not be shared among multiple parties.`,
  },
  {
    number: 4,
    title: "Acceptable Use Policy",
    content: `You agree to use the Service and any intelligence derived from it only for lawful purposes and in accordance with these Terms. You shall not:

(a) Use scraped intelligence to harass, stalk, defame, or harm any individual or organization;
(b) Redistribute, resell, or sublicense raw scraped data obtained through the Service without prior written consent from Argus;
(c) Use the Service to conduct insider trading or any activity that violates securities laws or regulations;
(d) Attempt to reverse-engineer, decompile, or disassemble any part of the platform, its agents, or its analysis lenses;
(e) Circumvent, disable, or interfere with any security, rate-limiting, or access-control features of the Service;
(f) Use intelligence outputs to create competing products or services that substantially replicate Argus's core functionality;
(g) Input false or misleading data into the platform with the intent to corrupt the knowledge graph or degrade signal quality;
(h) Use the Service in any manner that could damage, disable, overburden, or impair Argus's infrastructure;
(i) Use automated scripts, bots, or crawlers to access the Service other than through Argus's own agent system.

Argus reserves the right to investigate and take appropriate action against any User who, in Argus's sole discretion, violates this policy, including without limitation removing content, suspending access, and reporting to law enforcement.`,
  },
  {
    number: 5,
    title: "Intellectual Property",
    content: `The Argus platform — including its agent architecture, analysis lenses, correlation engine, user interface, documentation, and all associated software — is the proprietary property of Argus and is protected by intellectual property laws. All rights not expressly granted herein are reserved.

User-created configurations, custom alert rules, saved queries, and analysis templates ("User Configurations") remain the intellectual property of the User. Argus claims no ownership over User Configurations and will not access, use, or distribute them except as necessary to provide the Service.

Intelligence outputs generated by the Service (briefs, signals, alerts) are licensed to the User for their internal business use. Users may share intelligence outputs within their organization but may not commercially redistribute Argus-generated reports as standalone products.

Feedback, suggestions, or ideas submitted to Argus regarding the Service may be used by Argus without restriction or compensation.`,
  },
  {
    number: 6,
    title: "Data & Intelligence Accuracy",
    content: `Argus collects data from publicly available sources across the web. While the platform employs confidence scoring, source verification, and cross-referencing through its knowledge graph, Argus does not guarantee the accuracy, completeness, timeliness, or reliability of any data or intelligence output.

Specifically:

(a) Web-scraped data may be incomplete, outdated, or inaccurate at the time of collection;
(b) Analysis lens outputs are generated by large language models and are grounded in scraped evidence, but may contain errors in interpretation or synthesis;
(c) Confidence scores assigned to signals are probabilistic indicators, not guarantees of accuracy;
(d) Cross-agent correlation may surface patterns that are coincidental rather than causal.

Users are solely responsible for independently verifying all intelligence before making business, investment, legal, or operational decisions. Argus intelligence outputs do not constitute financial advice, legal counsel, or professional recommendations of any kind.`,
  },
  {
    number: 7,
    title: "Third-Party Data Sources",
    content: `Argus relies on third-party services to collect and process web data. Users acknowledge and agree that:

(a) Bright Data provides the underlying web scraping infrastructure. Data collection is subject to Bright Data's terms of service, acceptable use policies, and the legal frameworks governing web scraping in applicable jurisdictions;
(b) AI/ML API provides access to large language models from multiple providers. Model availability, capabilities, and response quality may vary and are subject to the respective model providers' terms;
(c) Cognee provides the persistent knowledge graph. Data retention and processing within Cognee are subject to Cognee's operational terms;
(d) Argus collects only publicly available information. The platform does not access password-protected content, private databases, or restricted systems without proper authorization;
(e) Third-party service disruptions may affect the availability or quality of Argus intelligence outputs. Argus is not liable for failures, outages, or changes in third-party services.

Argus makes reasonable efforts to comply with the terms of service of all websites and platforms from which data is collected. Users are responsible for ensuring their use of Argus intelligence complies with applicable laws in their jurisdiction.`,
  },
  {
    number: 8,
    title: "Service Availability & SLA",
    content: `Argus is designed for continuous monitoring and operates its collection agents on a persistent basis. However, Argus does not guarantee uninterrupted or error-free operation.

The platform is engineered with graceful degradation capabilities:

(a) If Cognee memory becomes unavailable, agents fall back to in-session memory with reduced cross-agent correlation;
(b) If individual data sources are temporarily inaccessible, agents report the gap and continue with available sources;
(c) If voice input services are unavailable, the text-based interface remains fully functional;
(d) If workflow automation services are disrupted, alerts are retained in the dashboard without external notification delivery.

Argus will make commercially reasonable efforts to maintain platform availability and will provide notice of planned maintenance when possible. Argus shall not be liable for any service interruptions caused by circumstances beyond its reasonable control, including but not limited to network outages, third-party service failures, natural disasters, or government actions.`,
  },
  {
    number: 9,
    title: "Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ARGUS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:

(a) Loss of profits, revenue, data, or business opportunities;
(b) Investment losses or trading losses based on Argus intelligence outputs;
(c) Reputational damage arising from actions taken based on scraped data;
(d) Costs of procurement of substitute goods or services;
(e) Business interruption resulting from service unavailability.

ARGUS'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO ARGUS FOR THE SERVICE DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.

These limitations apply regardless of the theory of liability (contract, tort, strict liability, or otherwise) and even if Argus has been advised of the possibility of such damages.`,
  },
  {
    number: 10,
    title: "Indemnification",
    content: `You agree to defend, indemnify, and hold harmless Argus and its officers, directors, employees, contractors, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:

(a) Your use of, or inability to use, the Service;
(b) Your violation of these Terms;
(c) Your violation of any applicable law or regulation;
(d) Your violation of any rights of a third party;
(e) Any business, investment, or operational decisions made based on intelligence outputs from the Service;
(f) Any unauthorized access to or use of the Service through your account credentials.

This indemnification obligation shall survive termination of these Terms and your use of the Service.`,
  },
  {
    number: 11,
    title: "Termination",
    content: `Argus may suspend or terminate your access to the Service at any time, with or without cause and with or without notice, for conduct that Argus believes violates these Terms, is harmful to other users or third parties, or for any other reason at Argus's sole discretion.

You may terminate your account at any time by contacting Argus at legal@argus.dev. Upon termination:

(a) Your right to access and use the Service will cease immediately;
(b) Argus may delete your account data, including User Configurations, after a reasonable retention period;
(c) Data already stored in the knowledge graph that has been aggregated and anonymized may be retained;
(d) Any outstanding payment obligations survive termination;
(e) Provisions of these Terms that by their nature should survive termination shall remain in effect, including but not limited to intellectual property rights, limitation of liability, indemnification, and governing law.`,
  },
  {
    number: 12,
    title: "Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law provisions.

Any dispute arising out of or relating to these Terms or the Service shall be resolved exclusively in the state or federal courts located in the State of Delaware. You consent to the personal jurisdiction of such courts and waive any objection to venue in such courts.

If any provision of these Terms is held to be unenforceable or invalid, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.`,
  },
  {
    number: 13,
    title: "Changes to Terms",
    content: `Argus reserves the right to modify these Terms at any time. When changes are made, Argus will update the "Effective Date" at the top of this page and, for material changes, will provide notice through the platform dashboard or via email to the address associated with your account.

Changes become effective upon posting unless otherwise stated. Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree with any changes, you must discontinue use of the Service and terminate your account.`,
  },
  {
    number: 14,
    title: "Contact",
    content: `For questions, concerns, or requests regarding these Terms & Conditions, please contact:

Argus Legal
Email: legal@argus.dev

For security-related inquiries or vulnerability reports, please contact: security@argus.dev

We aim to respond to all inquiries within five (5) business days.`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ background: "#0A0F0D", minHeight: "100vh" }}>
      <LandingNav />

      {/* Hero header */}
      <section
        style={{
          paddingTop: "160px",
          paddingBottom: "64px",
          paddingLeft: "32px",
          paddingRight: "32px",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#4ADE80",
            marginBottom: "20px",
          }}
        >
          Legal
        </p>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2rem, 4vw, 48px)",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#F5F5F0",
            marginBottom: "24px",
          }}
        >
          Terms &amp; Conditions
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#8A9A8E",
            marginBottom: "8px",
          }}
        >
          Please read these terms carefully before using the Argus platform.
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "rgba(138, 154, 142, 0.6)",
          }}
        >
          Effective Date: {effectiveDate}
        </p>
      </section>

      {/* Divider */}
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        <div
          style={{
            height: "1px",
            background: "rgba(138, 154, 142, 0.12)",
          }}
        />
      </div>

      {/* Sections */}
      <section
        style={{
          paddingTop: "64px",
          paddingBottom: "80px",
          paddingLeft: "32px",
          paddingRight: "32px",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        {sections.map((section, index) => (
          <div
            key={section.number}
            style={{
              marginBottom: index < sections.length - 1 ? "56px" : "0",
            }}
          >
            {/* Section number + title */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "rgba(138, 154, 142, 0.4)",
                  minWidth: "28px",
                }}
              >
                {String(section.number).padStart(2, "0")}
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "24px",
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: "#F5F5F0",
                  letterSpacing: "-0.01em",
                }}
              >
                {section.title}
              </h2>
            </div>

            {/* Section body */}
            <div
              style={{
                paddingLeft: "44px",
              }}
            >
              {section.content.split("\n\n").map((paragraph, pi) => (
                <p
                  key={`${section.number}-p-${paragraph.slice(0, 20).replace(/\s+/g, "-")}`}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    lineHeight: 1.75,
                    color: "#8A9A8E",
                    marginBottom:
                      pi < section.content.split("\n\n").length - 1
                        ? "16px"
                        : "0",
                    whiteSpace: "pre-line",
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom contact card */}
        <div
          style={{
            marginTop: "80px",
            padding: "32px",
            background: "#111815",
            borderRadius: "24px",
            border: "1px solid rgba(138, 154, 142, 0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
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
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#4ADE80",
              }}
            >
              Questions?
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#8A9A8E",
              marginBottom: "16px",
            }}
          >
            If you have questions about these terms, reach out to our legal
            team. We aim to respond within five business days.
          </p>
          <Link
            href="mailto:legal@argus.dev"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4ADE80";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(138, 154, 142, 0.3)";
            }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              color: "#F5F5F0",
              textDecoration: "none",
              borderBottom: "1px solid rgba(138, 154, 142, 0.3)",
              paddingBottom: "2px",
              transition: "border-color 0.2s ease",
            }}
          >
            legal@argus.dev
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
