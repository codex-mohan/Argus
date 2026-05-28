import { describe, expect, it } from "vitest";
import {
  DATASETS,
  IntelligenceBrief,
  MemoryEntry,
  ScrapeResult,
  Signal,
} from "./types.ts";

describe("Zod schemas", () => {
  it("validates a correct MemoryEntry", () => {
    const entry = {
      source_url: "https://example.com/product",
      scraped_at: "2026-05-28T12:00:00Z",
      agent_id: "market-data-bot",
      confidence: 0.9,
      data_type: "price",
      content: "Product X is $999",
    };
    const result = MemoryEntry.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it("rejects MemoryEntry below confidence 0.0", () => {
    const entry = {
      source_url: "https://example.com",
      scraped_at: "2026-05-28T12:00:00Z",
      agent_id: "agent-1",
      confidence: -0.1,
      data_type: "price",
      content: "bad confidence",
    };
    const result = MemoryEntry.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it("validates ScrapeResult success", () => {
    const result: ScrapeResult = {
      status: "success",
      data: "some markdown",
      source: "brightdata_mcp",
    };
    const parsed = ScrapeResult.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("validates ScrapeResult unavailable", () => {
    const result = {
      status: "unavailable",
      reason: "Service down",
      suggestion: "Retry later",
    };
    const parsed = ScrapeResult.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("rejects ScrapeResult with unknown status", () => {
    const result = { status: "unknown", data: "x" };
    const parsed = ScrapeResult.safeParse(result);
    expect(parsed.success).toBe(false);
  });

  it("validates a complete Signal", () => {
    const signal = {
      id: "sig-001",
      lens: "finance",
      severity: "high",
      headline: "NVIDIA GPU prices dropping",
      synthesis:
        "Prices dropped 12% across 4 retailers indicating demand weakness",
      source_urls: ["https://amazon.com/dp/xyz"],
      confidence: 0.88,
      agent_id: "finance-lens",
      detected_at: "2026-05-28T14:00:00Z",
    };
    const result = Signal.safeParse(signal);
    expect(result.success).toBe(true);
  });

  it("validates an IntelligenceBrief with correlation", () => {
    const brief = {
      company: "NVIDIA",
      generated_at: "2026-05-28T15:00:00Z",
      lens: "finance",
      executive_summary: "Supply chain stress detected",
      key_signals: [
        {
          id: "sig-001",
          lens: "finance",
          severity: "high",
          headline: "Prices dropping",
          synthesis: "12% drop",
          source_urls: ["https://amazon.com/dp/xyz"],
          confidence: 0.88,
          agent_id: "finance-lens",
          detected_at: "2026-05-28T14:00:00Z",
        },
      ],
      correlation_notes: [
        {
          signal_a_id: "sig-001",
          signal_b_id: "sig-001",
          relationship: "self-check",
          strength: 1.0,
        },
      ],
      risk_score: 72,
      recommendation: "Monitor NVIDIA supplier ecosystem closely",
    };
    const result = IntelligenceBrief.safeParse(brief);
    expect(result.success).toBe(true);
  });

  it("DATASETS constant has all expected keys", () => {
    expect(DATASETS.raw_market_data).toBe("raw_market_data");
    expect(DATASETS.raw_filing_data).toBe("raw_filing_data");
    expect(DATASETS.raw_social_data).toBe("raw_social_data");
    expect(DATASETS.raw_supplier_data).toBe("raw_supplier_data");
    expect(DATASETS.raw_news_data).toBe("raw_news_data");
    expect(DATASETS.lens_findings).toBe("lens_findings");
    expect(DATASETS.correlation_signals).toBe("correlation_signals");
  });
});
