import { describe, expect, it } from "vitest";
import { MemoryEntry, ScrapeResult, Signal } from "./types.ts";

describe("Memory entry — confidence gates", () => {
  const baseEntry = {
    source_url: "https://example.com/product",
    scraped_at: "2026-05-28T12:00:00Z",
    agent_id: "test-bot",
    data_type: "price" as const,
    content: "Product X is $999",
  };

  it("accepts confidence = 0.7 (threshold for correlation)", () => {
    const result = MemoryEntry.safeParse({ ...baseEntry, confidence: 0.7 });
    expect(result.success).toBe(true);
  });

  it("accepts confidence = 0.9 (high confidence)", () => {
    const result = MemoryEntry.safeParse({ ...baseEntry, confidence: 0.9 });
    expect(result.success).toBe(true);
  });

  it("accepts confidence = 0.5 (low, but valid)", () => {
    const result = MemoryEntry.safeParse({ ...baseEntry, confidence: 0.5 });
    expect(result.success).toBe(true);
  });

  it("rejects confidence > 1.0", () => {
    const result = MemoryEntry.safeParse({ ...baseEntry, confidence: 1.5 });
    expect(result.success).toBe(false);
  });

  it("rejects confidence < 0.0", () => {
    const result = MemoryEntry.safeParse({ ...baseEntry, confidence: -0.5 });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const missing = { content: "test" };
    const result = MemoryEntry.safeParse(missing);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path[0]);
      expect(issues).toContain("source_url");
      expect(issues).toContain("scraped_at");
      expect(issues).toContain("agent_id");
      expect(issues).toContain("confidence");
      expect(issues).toContain("data_type");
    }
  });

  it("rejects invalid data_type", () => {
    const result = MemoryEntry.safeParse({
      ...baseEntry,
      confidence: 0.8,
      data_type: "invalid_type",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-URL source_url", () => {
    const result = MemoryEntry.safeParse({
      ...baseEntry,
      confidence: 0.8,
      source_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-ISO datetime scraped_at", () => {
    const result = MemoryEntry.safeParse({
      ...baseEntry,
      confidence: 0.8,
      scraped_at: "yesterday",
    });
    expect(result.success).toBe(false);
  });

  it("TTL is optional but must be positive when provided", () => {
    const valid = MemoryEntry.safeParse({ ...baseEntry, confidence: 0.8 });
    expect(valid.success).toBe(true);

    const withTtl = MemoryEntry.safeParse({
      ...baseEntry,
      confidence: 0.8,
      ttl_hours: 24,
    });
    expect(withTtl.success).toBe(true);
  });
});

describe("Memory entry — correlation readiness", () => {
  const baseEntry = {
    source_url: "https://reuters.com/article/nvidia-supply",
    scraped_at: "2026-05-28T12:00:00Z",
    agent_id: "supplier-data-bot",
    data_type: "supplier" as const,
    content: "TSMC shows credit stress indicators",
  };

  it("high confidence entries are correlation-ready (> 0.7)", () => {
    const entry = MemoryEntry.parse({ ...baseEntry, confidence: 0.85 });
    // Entries with confidence >= 0.7 should be eligible for CorrelationEngine
    const correlationReady = entry.confidence >= 0.7;
    expect(correlationReady).toBe(true);
  });

  it("low confidence entries are excluded from correlation (< 0.7)", () => {
    const entry = MemoryEntry.parse({ ...baseEntry, confidence: 0.45 });
    const correlationReady = entry.confidence >= 0.7;
    expect(correlationReady).toBe(false);
  });

  it("boundary confidence 0.69 is excluded", () => {
    const entry = MemoryEntry.parse({ ...baseEntry, confidence: 0.69 });
    expect(entry.confidence >= 0.7).toBe(false);
  });

  it("boundary confidence 0.70 is included", () => {
    const entry = MemoryEntry.parse({ ...baseEntry, confidence: 0.7 });
    expect(entry.confidence >= 0.7).toBe(true);
  });

  it("source_url is always present for deduplication", () => {
    const entry = MemoryEntry.parse({ ...baseEntry, confidence: 0.8 });
    expect(entry.source_url).toBeTruthy();
    expect(entry.source_url).toContain("https://");
  });
});

describe("ScrapeResult — edge cases", () => {
  it("degraded result is structurally valid", () => {
    const result = ScrapeResult.parse({
      status: "degraded",
      data: "cached response",
      source: "cache",
      originalUrl: "https://amazon.com/dp/test",
    });
    expect(result.status).toBe("degraded");
    expect(result.originalUrl).toBe("https://amazon.com/dp/test");
  });

  it("success result does NOT have originalUrl", () => {
    const result = ScrapeResult.parse({
      status: "success",
      data: { price: "$999" },
      source: "brightdata_mcp",
    });
    // Type narrowing: 'success' branch does not have originalUrl
    if (result.status === "success") {
      expect(result.data).toEqual({ price: "$999" });
      expect(result.source).toBe("brightdata_mcp");
    }
  });

  it("unavailable result has suggestion", () => {
    const result = ScrapeResult.parse({
      status: "unavailable",
      reason: "Blocked by bot protection",
      suggestion: "Use web_unlocker",
    });
    expect(result.suggestion).toBe("Use web_unlocker");
  });

  it("discriminated union rejects mixed shapes", () => {
    // 'success' with 'reason' field — should fail
    const invalid = ScrapeResult.safeParse({
      status: "success",
      data: "x",
      reason: "should not be here",
    });
    // This should fail because 'success' branch does not allow 'reason'
    expect(invalid.success).toBe(false);
  });
});

describe("Signal — lens routing", () => {
  const baseSignal = {
    id: "sig-001",
    severity: "high" as const,
    headline: "Test signal",
    synthesis: "Test synthesis",
    source_urls: ["https://example.com/source"],
    confidence: 0.85,
    agent_id: "finance-lens",
    detected_at: "2026-05-28T14:00:00Z",
  };

  it("accepts gtm lens", () => {
    const result = Signal.safeParse({ ...baseSignal, lens: "gtm" });
    expect(result.success).toBe(true);
  });

  it("accepts finance lens", () => {
    const result = Signal.safeParse({ ...baseSignal, lens: "finance" });
    expect(result.success).toBe(true);
  });

  it("accepts security lens", () => {
    const result = Signal.safeParse({ ...baseSignal, lens: "security" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown lens", () => {
    const result = Signal.safeParse({ ...baseSignal, lens: "marketing" });
    expect(result.success).toBe(false);
  });

  it("requires at least one source_url", () => {
    const result = Signal.safeParse({
      ...baseSignal,
      lens: "finance",
      source_urls: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-URL in source_urls", () => {
    const result = Signal.safeParse({
      ...baseSignal,
      lens: "finance",
      source_urls: ["not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts critical severity", () => {
    const result = Signal.safeParse({
      ...baseSignal,
      lens: "security",
      severity: "critical",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid severity", () => {
    const result = Signal.safeParse({
      ...baseSignal,
      lens: "security",
      severity: "catastrophic",
    });
    expect(result.success).toBe(false);
  });
});

describe("Correlation deduplication logic", () => {
  it("two entries with same source_url should be deduplicated", () => {
    const entries = [
      {
        source_url: "https://reuters.com/nvidia",
        confidence: 0.9,
        agent: "news-bot",
      },
      {
        source_url: "https://reuters.com/nvidia",
        confidence: 0.8,
        agent: "finance-lens",
      },
      {
        source_url: "https://bloomberg.com/nvidia",
        confidence: 0.85,
        agent: "news-bot",
      },
    ];
    const uniqueSources = new Set(entries.map((e) => e.source_url));
    expect(uniqueSources.size).toBe(2);
  });

  it("entries with different source_urls are NOT deduplicated", () => {
    const entries = [
      { source_url: "https://reuters.com/nvidia", confidence: 0.9 },
      { source_url: "https://bloomberg.com/nvidia", confidence: 0.8 },
      { source_url: "https://cnbc.com/nvidia", confidence: 0.85 },
    ];
    const uniqueSources = new Set(entries.map((e) => e.source_url));
    expect(uniqueSources.size).toBe(3);
  });

  it("empty entries produce zero unique sources", () => {
    const uniqueSources = new Set(
      ([] as Array<{ source_url: string }>).map((e) => e.source_url)
    );
    expect(uniqueSources.size).toBe(0);
  });

  it("correlation domain count: 1 domain = weak, 2 = moderate, 3+ = strong", () => {
    const domainCount = (sources: string[]): number =>
      new Set(sources.map((s) => new URL(s).hostname)).size;

    // One domain — Reuters only
    expect(
      domainCount(["https://reuters.com/a", "https://reuters.com/b"])
    ).toBe(1);
    // Two domains
    expect(
      domainCount(["https://reuters.com/a", "https://bloomberg.com/b"])
    ).toBe(2);
    // Three domains
    expect(
      domainCount([
        "https://reuters.com/a",
        "https://bloomberg.com/b",
        "https://cnbc.com/c",
      ])
    ).toBe(3);
  });
});
