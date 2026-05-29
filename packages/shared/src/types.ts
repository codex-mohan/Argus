import { z } from "zod";

// ---------------------------------------------------------------------------
// Memory entry — every Cognee remember call must follow this schema
// ---------------------------------------------------------------------------
export const MemoryEntry = z.object({
  source_url: z.string().url(),
  scraped_at: z.string().datetime(),
  agent_id: z.string(),
  confidence: z.number().min(0).max(1),
  data_type: z.enum([
    "price",
    "filing",
    "social",
    "supplier",
    "news",
    "lens_finding",
    "correlation",
  ]),
  content: z.string().min(1),
  raw_extract: z.record(z.unknown()).optional(),
  ttl_hours: z.number().positive().optional(),
});
export type MemoryEntry = z.infer<typeof MemoryEntry>;

// ---------------------------------------------------------------------------
// Degradation — every external call returns one of these states
// ---------------------------------------------------------------------------
export const ScrapeStatus = z.enum(["success", "degraded", "unavailable"]);
export type ScrapeStatus = z.infer<typeof ScrapeStatus>;

export const ScrapeResult = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.unknown(),
    source: z.string(),
  }),
  z.object({
    status: z.literal("degraded"),
    data: z.unknown(),
    source: z.string(),
    originalUrl: z.string(),
  }),
  z.object({
    status: z.literal("unavailable"),
    reason: z.string(),
    suggestion: z.string(),
  }),
]);
export type ScrapeResult = z.infer<typeof ScrapeResult>;

// ---------------------------------------------------------------------------
// Provider health
// ---------------------------------------------------------------------------
export const ProviderStatus = z.object({
  provider: z.string(),
  available: z.boolean(),
  degraded: z.boolean().default(false),
  reason: z.string().optional(),
});
export type ProviderStatus = z.infer<typeof ProviderStatus>;

export const AgentStepStatus = z.enum(["pending", "running", "success", "failed", "skipped"]);
export type AgentStepStatus = z.infer<typeof AgentStepStatus>;

export const SignalLens = z.enum(["gtm", "finance", "security"]);
export type SignalLens = z.infer<typeof SignalLens>;

export const SignalSeverity = z.enum(["low", "medium", "high", "critical"]);
export type SignalSeverity = z.infer<typeof SignalSeverity>;

export const AgentStep = z.object({
  id: z.string(),
  agent: z.string(),
  step: z.number().min(1).max(20),
  label: z.string(),
  detail: z.string(),
  status: AgentStepStatus,
  progress: z.number().min(0).max(100).default(0),
  timestamp: z.string().datetime(),
  lens: SignalLens.optional(),
});
export type AgentStep = z.infer<typeof AgentStep>;

export const SignalDimension = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  description: z.string(),
});
export type SignalDimension = z.infer<typeof SignalDimension>;

export const SignalAnalysis = z.object({
  signal_id: z.string(),
  composite_score: z.number().min(0).max(100),
  verdict: z.enum(["approve", "flag", "block"]),
  dimensions: z.array(SignalDimension),
});
export type SignalAnalysis = z.infer<typeof SignalAnalysis>;

export const Signal = z.object({
  id: z.string(),
  lens: SignalLens,
  severity: SignalSeverity,
  headline: z.string(),
  synthesis: z.string(),
  source_urls: z
    .array(z.string().url())
    .min(1)
    .describe("Evidence URLs backing this signal"),
  confidence: z.number().min(0).max(1),
  agent_id: z.string(),
  detected_at: z.string().datetime(),
});
export type Signal = z.infer<typeof Signal>;

// ---------------------------------------------------------------------------
// Intelligence brief — the polished output
// ---------------------------------------------------------------------------
export const IntelligenceBrief = z.object({
  company: z.string(),
  generated_at: z.string().datetime(),
  lens: SignalLens,
  executive_summary: z.string(),
  key_signals: z.array(Signal),
  correlation_notes: z.array(
    z.object({
      signal_a_id: z.string(),
      signal_b_id: z.string(),
      relationship: z.string(),
      strength: z.number().min(0).max(1),
    })
  ),
  risk_score: z.number().min(0).max(100),
  recommendation: z.string(),
});
export type IntelligenceBrief = z.infer<typeof IntelligenceBrief>;

// ---------------------------------------------------------------------------
// Cognee dataset names — canonical list
// ---------------------------------------------------------------------------
export const DATASETS = {
  raw_market_data: "raw_market_data",
  raw_filing_data: "raw_filing_data",
  raw_social_data: "raw_social_data",
  raw_supplier_data: "raw_supplier_data",
  raw_news_data: "raw_news_data",
  lens_findings: "lens_findings",
  correlation_signals: "correlation_signals",
} as const;
