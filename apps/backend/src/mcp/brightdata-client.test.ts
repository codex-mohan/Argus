import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function resetModule() {
  vi.resetModules();
  delete process.env.BRIGHTDATA_API_KEY;
}

describe("BrightData MCP Client", () => {
  beforeEach(resetModule);

  it("throws when BRIGHTDATA_API_KEY is not set", async () => {
    delete process.env.BRIGHTDATA_API_KEY;
    const { getBrightDataClient } = await import("./brightdata-client.ts");
    expect(() => getBrightDataClient()).toThrow(
      "BRIGHTDATA_API_KEY is required"
    );
  });

  it("returns available when health check passes", async () => {
    process.env.BRIGHTDATA_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { getBrightDataClient } = await import("./brightdata-client.ts");
    const client = getBrightDataClient();
    const health = await client.health();

    expect(health.provider).toBe("brightdata");
    expect(health.available).toBe(true);
    expect(health.degraded).toBe(false);
  });

  it("returns unavailable when health check fails", async () => {
    process.env.BRIGHTDATA_API_KEY = "test-key";
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    const { getBrightDataClient } = await import("./brightdata-client.ts");
    const client = getBrightDataClient();
    const health = await client.health();

    expect(health.available).toBe(false);
  });

  it("scrapeAsMarkdown returns success on valid response", async () => {
    process.env.BRIGHTDATA_API_KEY = "test-key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "# Hello World" }],
      }),
    });

    const { getBrightDataClient } = await import("./brightdata-client.ts");
    const client = getBrightDataClient();
    const result = await client.scrapeAsMarkdown("https://example.com");

    expect(result.status).toBe("success");
    expect(result.data).toBe("# Hello World");
    expect(result.source).toBe("brightdata_mcp");
  });

  it("scrapeAsMarkdown returns unavailable on failure", async () => {
    process.env.BRIGHTDATA_API_KEY = "test-key";
    mockFetch.mockRejectedValueOnce(new Error("Timeout"));

    const { getBrightDataClient } = await import("./brightdata-client.ts");
    const client = getBrightDataClient();
    const result = await client.scrapeAsMarkdown("https://example.com");

    expect(result.status).toBe("unavailable");
    expect(result.suggestion).toContain("escalation");
  });
});
