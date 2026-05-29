/* ============================================
   ARGUS MOCK DATA
   Shared static data for all frontend pages
   ============================================ */

export interface AgentActivity {
  action: string;
  agentId: string;
  agentName: string;
  confidence: number;
  id: string;
  status: "success" | "degraded" | "error";
  targetUrl: string;
  timestamp: string;
}

export interface Signal {
  agentId: string;
  confidence: number;
  correlatedSignals?: string[];
  finding: string;
  id: string;
  lens: "gtm" | "finance" | "security";
  rawExtract?: string;
  scrapedAt: string;
  severity: "critical" | "high" | "medium" | "low";
  signalType: string;
  sourceUrl: string;
}

export interface AgentInfo {
  activityData: number[];
  id: string;
  lastAction: string;
  memoryEntries: number;
  name: string;
  role: string;
  status: "running" | "idle" | "error";
  type: "collection" | "lens";
}

export interface CogneeDataset {
  color: string;
  entries: number;
  name: string;
}

export interface LogEntry {
  agentId: string;
  level: "success" | "warning" | "error" | "info";
  message: string;
  timestamp: string;
}

// --- Agent Activity Feed ---
export const agentActivities: AgentActivity[] = [
  {
    id: "act-001",
    agentName: "MarketDataBot",
    agentId: "mkt-001",
    action: "Scraped product pricing",
    targetUrl: "https://amazon.com/dp/B0DGJFL2SJ",
    timestamp: "2026-05-28T23:08:12Z",
    confidence: 0.94,
    status: "success",
  },
  {
    id: "act-002",
    agentName: "FilingDataBot",
    agentId: "fil-001",
    action: "Parsed 8-K filing",
    targetUrl:
      "https://sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001318605",
    timestamp: "2026-05-28T23:07:45Z",
    confidence: 0.98,
    status: "success",
  },
  {
    id: "act-003",
    agentName: "SocialDataBot",
    agentId: "soc-001",
    action: "Monitored LinkedIn profile changes",
    targetUrl: "https://linkedin.com/company/openai",
    timestamp: "2026-05-28T23:06:33Z",
    confidence: 0.87,
    status: "success",
  },
  {
    id: "act-004",
    agentName: "SupplierDataBot",
    agentId: "sup-001",
    action: "Checked vendor status page",
    targetUrl: "https://status.cloudflare.com",
    timestamp: "2026-05-28T23:05:18Z",
    confidence: 0.91,
    status: "degraded",
  },
  {
    id: "act-005",
    agentName: "NewsDataBot",
    agentId: "nws-001",
    action: "Scraped breaking news",
    targetUrl: "https://reuters.com/technology",
    timestamp: "2026-05-28T23:04:55Z",
    confidence: 0.96,
    status: "success",
  },
  {
    id: "act-006",
    agentName: "MarketDataBot",
    agentId: "mkt-001",
    action: "Competitor price comparison",
    targetUrl: "https://bestbuy.com/site/nvidia-geforce-rtx-5090",
    timestamp: "2026-05-28T23:03:22Z",
    confidence: 0.89,
    status: "success",
  },
  {
    id: "act-007",
    agentName: "FilingDataBot",
    agentId: "fil-001",
    action: "10-Q divergence detected",
    targetUrl: "https://sec.gov/cgi-bin/browse-edgar?company=MSFT",
    timestamp: "2026-05-28T23:02:11Z",
    confidence: 0.95,
    status: "success",
  },
  {
    id: "act-008",
    agentName: "SocialDataBot",
    agentId: "soc-001",
    action: "Hiring surge detected",
    targetUrl: "https://linkedin.com/company/anthropic/jobs",
    timestamp: "2026-05-28T23:01:44Z",
    confidence: 0.82,
    status: "success",
  },
  {
    id: "act-009",
    agentName: "NewsDataBot",
    agentId: "nws-001",
    action: "Regulatory action flagged",
    targetUrl: "https://reuters.com/legal/ftc-action-2026",
    timestamp: "2026-05-28T23:00:30Z",
    confidence: 0.93,
    status: "success",
  },
  {
    id: "act-010",
    agentName: "SupplierDataBot",
    agentId: "sup-001",
    action: "Supply chain disruption alert",
    targetUrl: "https://tsmc.com/english/news",
    timestamp: "2026-05-28T22:59:15Z",
    confidence: 0.76,
    status: "error",
  },
];

// --- Signals ---
export const signals: Signal[] = [
  {
    id: "sig-001",
    lens: "gtm",
    signalType: "Hiring Surge",
    finding:
      "Anthropic posted 47 new engineering roles in the last 72 hours — 3x their monthly average",
    sourceUrl: "https://linkedin.com/company/anthropic/jobs",
    scrapedAt: "2026-05-28T23:01:44Z",
    agentId: "soc-001",
    confidence: 0.88,
    severity: "high",
    rawExtract:
      "47 new postings detected: 18 ML Engineer, 12 Backend, 8 Security, 5 Product, 4 Design. Previous 30-day avg: 15.3 postings. Departments: Research (40%), Engineering (35%), Security (15%), Other (10%).",
    correlatedSignals: ["sig-003"],
  },
  {
    id: "sig-002",
    lens: "finance",
    signalType: "Filing Divergence",
    finding:
      "Tesla 10-Q shows 23% inventory buildup vs guidance of flat — potential demand softening",
    sourceUrl:
      "https://sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001318605",
    scrapedAt: "2026-05-28T23:07:45Z",
    agentId: "fil-001",
    confidence: 0.95,
    severity: "critical",
    rawExtract:
      "Finished goods inventory: $8.2B (Q1 2026) vs $6.7B (Q4 2025). Management guidance: 'stable inventory levels.' Delta: +23.4%. Historical avg quarterly change: ±5%.",
  },
  {
    id: "sig-003",
    lens: "security",
    signalType: "Vendor Risk",
    finding:
      "Cloudflare status page showing degraded performance in US-East region for 4+ hours",
    sourceUrl: "https://status.cloudflare.com",
    scrapedAt: "2026-05-28T23:05:18Z",
    agentId: "sup-001",
    confidence: 0.91,
    severity: "high",
    rawExtract:
      "Incident: Elevated error rates in US-East. Start: 18:45 UTC. Duration: 4h 20m. Affected services: CDN, Workers, R2. Customer impact: Estimated 12% of requests experiencing 5xx errors.",
  },
  {
    id: "sig-004",
    lens: "gtm",
    signalType: "Competitor Move",
    finding:
      "NVIDIA RTX 5090 price dropped to $1,849 at Best Buy — first discount since launch",
    sourceUrl: "https://bestbuy.com/site/nvidia-geforce-rtx-5090",
    scrapedAt: "2026-05-28T23:03:22Z",
    agentId: "mkt-001",
    confidence: 0.94,
    severity: "medium",
  },
  {
    id: "sig-005",
    lens: "finance",
    signalType: "Supply Chain Stress",
    finding:
      "TSMC fab utilization dropped to 78% — lowest since Q2 2024, signaling potential overcapacity",
    sourceUrl: "https://tsmc.com/english/news",
    scrapedAt: "2026-05-28T22:59:15Z",
    agentId: "sup-001",
    confidence: 0.76,
    severity: "high",
    rawExtract:
      "TSMC Q1 2026 utilization: 78.2%. Q4 2025: 89.1%. Historical avg (2023-2025): 85.4%. N3 node: 92% (stable). N5 node: 71% (significant decline). N7/older: 64%.",
    correlatedSignals: ["sig-004"],
  },
  {
    id: "sig-006",
    lens: "security",
    signalType: "Regulatory Action",
    finding:
      "FTC announces investigation into AI training data practices — subpoenas issued to 6 companies",
    sourceUrl: "https://reuters.com/legal/ftc-action-2026",
    scrapedAt: "2026-05-28T23:00:30Z",
    agentId: "nws-001",
    confidence: 0.93,
    severity: "critical",
    rawExtract:
      "FTC Chair Bedoya announced formal investigation. Subpoenas confirmed for: OpenAI, Anthropic, Google DeepMind, Meta AI, Stability AI, Midjourney. Focus: copyrighted material usage, consent mechanisms, opt-out compliance.",
    correlatedSignals: ["sig-001"],
  },
  {
    id: "sig-007",
    lens: "gtm",
    signalType: "Buying Intent",
    finding:
      "Microsoft Azure posted 3 RFPs for real-time web intelligence tools in the last week",
    sourceUrl: "https://linkedin.com/company/microsoft",
    scrapedAt: "2026-05-28T22:55:00Z",
    agentId: "soc-001",
    confidence: 0.72,
    severity: "medium",
  },
  {
    id: "sig-008",
    lens: "finance",
    signalType: "Alpha Signal",
    finding:
      "Unusual options activity on NVDA — $2.4B in put volume at $115 strike, expiring next Friday",
    sourceUrl: "https://finance.yahoo.com/quote/NVDA/options",
    scrapedAt: "2026-05-28T22:50:30Z",
    agentId: "mkt-001",
    confidence: 0.85,
    severity: "high",
  },
  {
    id: "sig-009",
    lens: "security",
    signalType: "Brand Exposure",
    finding:
      "Customer data leak discussion on forum mentions your client's API keys in public GitHub repos",
    sourceUrl: "https://github.com/search?q=ACME_API_KEY",
    scrapedAt: "2026-05-28T22:48:12Z",
    agentId: "nws-001",
    confidence: 0.97,
    severity: "critical",
  },
  {
    id: "sig-010",
    lens: "gtm",
    signalType: "Account Enrichment",
    finding:
      "Stripe expanded engineering team by 120 in Q1 — shifting focus to AI-powered fraud detection",
    sourceUrl: "https://linkedin.com/company/stripe",
    scrapedAt: "2026-05-28T22:45:00Z",
    agentId: "soc-001",
    confidence: 0.81,
    severity: "low",
  },
];

// --- Agent Info ---
export const agents: AgentInfo[] = [
  {
    id: "mkt-001",
    name: "MarketDataBot",
    role: "Scrapes product pricing, competitor listings, and marketplace data",
    type: "collection",
    status: "running",
    lastAction: "Scraped NVIDIA RTX 5090 pricing from 4 retailers",
    memoryEntries: 2847,
    activityData: [
      12, 18, 15, 22, 19, 25, 30, 28, 35, 32, 27, 24, 29, 31, 26, 20, 23, 28,
      33, 36, 31, 27, 25, 22,
    ],
  },
  {
    id: "fil-001",
    name: "FilingDataBot",
    role: "Parses SEC filings, 8-K events, and quarterly reports for divergence",
    type: "collection",
    status: "running",
    lastAction: "Parsed Tesla 10-Q — detected inventory divergence",
    memoryEntries: 1523,
    activityData: [
      5, 3, 7, 4, 6, 8, 5, 9, 7, 4, 6, 3, 8, 5, 7, 4, 6, 9, 5, 7, 8, 4, 6, 3,
    ],
  },
  {
    id: "soc-001",
    name: "SocialDataBot",
    role: "Monitors LinkedIn profiles, job postings, and social media signals",
    type: "collection",
    status: "running",
    lastAction: "Detected 47 new Anthropic job postings",
    memoryEntries: 4102,
    activityData: [
      20, 25, 30, 28, 35, 40, 38, 42, 45, 40, 37, 33, 38, 42, 39, 35, 40, 44,
      48, 45, 42, 38, 35, 30,
    ],
  },
  {
    id: "sup-001",
    name: "SupplierDataBot",
    role: "Tracks vendor status pages, supply chain indicators, and fulfillment data",
    type: "collection",
    status: "error",
    lastAction: "TSMC scrape failed — retrying with scraping_browser",
    memoryEntries: 982,
    activityData: [
      8, 10, 7, 12, 9, 11, 8, 6, 10, 7, 9, 5, 0, 0, 3, 7, 9, 11, 8, 10, 7, 5, 3,
      0,
    ],
  },
  {
    id: "nws-001",
    name: "NewsDataBot",
    role: "Scrapes breaking news, regulatory announcements, and industry reports",
    type: "collection",
    status: "running",
    lastAction: "FTC regulatory action flagged — high severity",
    memoryEntries: 3291,
    activityData: [
      15, 18, 22, 20, 25, 28, 30, 27, 32, 35, 30, 28, 33, 36, 34, 30, 28, 32,
      35, 38, 34, 30, 27, 25,
    ],
  },
  {
    id: "gtm-lens",
    name: "GTM Lens",
    role: "Analyzes competitor moves, hiring signals, and buying intent from collected data",
    type: "lens",
    status: "running",
    lastAction: "Generated GTM brief — 4 high-confidence signals",
    memoryEntries: 847,
    activityData: [
      3, 5, 4, 6, 5, 7, 6, 8, 7, 5, 6, 4, 7, 8, 6, 5, 7, 9, 8, 7, 6, 5, 4, 3,
    ],
  },
  {
    id: "fin-lens",
    name: "Finance Lens",
    role: "Identifies alpha signals, filing divergence, and supply-chain stress indicators",
    type: "lens",
    status: "running",
    lastAction: "Flagged Tesla inventory divergence — critical severity",
    memoryEntries: 612,
    activityData: [
      2, 3, 4, 3, 5, 4, 6, 5, 4, 3, 5, 4, 6, 7, 5, 4, 6, 5, 7, 6, 5, 4, 3, 2,
    ],
  },
  {
    id: "sec-lens",
    name: "Security Lens",
    role: "Monitors vendor risk, regulatory actions, and brand exposure threats",
    type: "lens",
    status: "idle",
    lastAction: "Completed security risk assessment — 2 critical alerts",
    memoryEntries: 534,
    activityData: [
      1, 2, 3, 2, 4, 3, 2, 4, 3, 2, 3, 1, 4, 3, 2, 3, 4, 2, 3, 4, 3, 2, 1, 0,
    ],
  },
];

// --- Cognee Datasets ---
export const cogneeDatasets: CogneeDataset[] = [
  { name: "raw_market_data", entries: 2847, color: "#C4973B" },
  { name: "raw_filing_data", entries: 1523, color: "#5B8BDA" },
  { name: "raw_social_data", entries: 4102, color: "#3BDC7E" },
  { name: "raw_supplier_data", entries: 982, color: "#DA5B5B" },
  { name: "raw_news_data", entries: 3291, color: "#D4A74B" },
  { name: "lens_findings", entries: 1993, color: "#8B5BDA" },
  { name: "correlation_signals", entries: 347, color: "#5BDAC4" },
];

// --- Agent Logs ---
export const agentLogs: LogEntry[] = [
  {
    timestamp: "23:08:12",
    level: "success",
    agentId: "mkt-001",
    message:
      "Scraped amazon.com/dp/B0DGJFL2SJ — price: $1,849.00, confidence: 0.94",
  },
  {
    timestamp: "23:07:45",
    level: "success",
    agentId: "fil-001",
    message:
      "Parsed 8-K filing for TSLA — inventory divergence detected (+23.4%)",
  },
  {
    timestamp: "23:06:33",
    level: "success",
    agentId: "soc-001",
    message:
      "LinkedIn profile changes detected for openai — 12 new hires confirmed",
  },
  {
    timestamp: "23:05:18",
    level: "warning",
    agentId: "sup-001",
    message: "Cloudflare status degraded — using cached response (age: 2h 15m)",
  },
  {
    timestamp: "23:04:55",
    level: "success",
    agentId: "nws-001",
    message: "Reuters technology feed scraped — 3 relevant articles found",
  },
  {
    timestamp: "23:03:22",
    level: "success",
    agentId: "mkt-001",
    message:
      "Best Buy price check complete — NVIDIA RTX 5090 at $1,849 (down from $1,999)",
  },
  {
    timestamp: "23:02:11",
    level: "success",
    agentId: "fil-001",
    message:
      "10-Q analysis complete for MSFT — no significant divergence detected",
  },
  {
    timestamp: "23:01:44",
    level: "success",
    agentId: "soc-001",
    message: "Hiring surge detected: Anthropic +47 roles (3x monthly avg)",
  },
  {
    timestamp: "23:00:30",
    level: "success",
    agentId: "nws-001",
    message: "Regulatory action flagged: FTC AI training data investigation",
  },
  {
    timestamp: "22:59:15",
    level: "error",
    agentId: "sup-001",
    message:
      "TSMC scrape failed — 403 Forbidden. Escalating to scraping_browser",
  },
  {
    timestamp: "22:58:00",
    level: "info",
    agentId: "gtm-lens",
    message: "GTM brief generated — 4 signals above 0.7 confidence threshold",
  },
  {
    timestamp: "22:57:30",
    level: "info",
    agentId: "fin-lens",
    message: "Finance analysis cycle complete — 3 alpha signals, 1 critical",
  },
  {
    timestamp: "22:56:45",
    level: "warning",
    agentId: "sup-001",
    message:
      "Cognee recall returned stale data (>24h) for tsmc.com — requesting fresh scrape",
  },
  {
    timestamp: "22:55:12",
    level: "success",
    agentId: "soc-001",
    message: "Microsoft Azure RFP signals detected — 3 procurement postings",
  },
  {
    timestamp: "22:54:00",
    level: "info",
    agentId: "sec-lens",
    message:
      "Security risk assessment complete — 2 critical, 1 high, 4 medium alerts",
  },
];

// --- Dashboard Metrics ---
export const dashboardMetrics = {
  totalSignals: 247,
  highConfidence: 89,
  activeAgents: 5,
  cogneeNodes: 12_847,
};
