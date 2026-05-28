import { z } from "zod";

// ---------------------------------------------------------------------------
// Memory entry — every Cognee remember call must follow this schema
// ---------------------------------------------------------------------------
export const MemoryEntry = z.object({
  source_url: z.string().url(),
  scraped_at: z.string().datetime(),
  agent_id: z.string(),
  confidence: z.number().min(0).max(1),
  data_type: z.enum(["price", "filing", "social", "supplier", "news", "lens_finding", "correlation"]),
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
  z.object({ status: z.literal("success"), data: z.unknown(), source: z.string() }),
  z.object({ status: z.literal("degraded"), data: z.unknown(), source: z.string(), originalUrl: z.string() }),
  z.object({ status: z.literal("unavailable"), reason: z.string(), suggestion: z.string() }),
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

// ---------------------------------------------------------------------------
// Signal — what an agent produces after analysis
// ---------------------------------------------------------------------------
export const SignalSeverity = z.enum(["low", "medium", "high", "critical"]);
export type SignalSeverity = z.infer<typeof SignalSeverity>;

export const SignalLens = z.enum(["gtm", "finance", "security"]);
export type SignalLens = z.infer<typeof SignalLens>;

export const Signal = z.object({
  id: z.string(),
  lens: SignalLens,
  severity: SignalSeverity,
  headline: z.string(),
  synthesis: z.string(),
  source_urls: z.array(z.string().url()),
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
  correlation_notes: z.array(z.object({
    signal_a_id: z.string(),
    signal_b_id: z.string(),
    relationship: z.string(),
    strength: z.number().min(0).max(1),
  })),
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
