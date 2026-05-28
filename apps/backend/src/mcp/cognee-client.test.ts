import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function resetModule() {
  vi.resetModules();
  delete process.env.COGNEE_MCP_URL;
}

describe("Cognee MCP Client", () => {
  beforeEach(resetModule);

  it("returns unavailable when health check fails", async () => {
    process.env.COGNEE_MCP_URL = "http://localhost:8000";
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    const { getCogneeClient } = await import("./cognee-client.ts");
    const client = getCogneeClient();
    const health = await client.health();

    expect(health.available).toBe(false);
    expect(health.degraded).toBe(true);
  });

  it("returns available when health check passes", async () => {
    process.env.COGNEE_MCP_URL = "http://localhost:8000";
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { getCogneeClient } = await import("./cognee-client.ts");
    const client = getCogneeClient();
    const health = await client.health();

    expect(health.available).toBe(true);
    expect(health.degraded).toBe(false);
  });

  it("recall returns empty array on failure", async () => {
    process.env.COGNEE_MCP_URL = "http://localhost:8000";
    mockFetch.mockRejectedValueOnce(new Error("Timeout"));

    const { getCogneeClient } = await import("./cognee-client.ts");
    const client = getCogneeClient();
    const results = await client.recall({ query: "NVIDIA prices" });

    expect(results).toEqual([]);
  });

  it("remember does not throw on failure", async () => {
    process.env.COGNEE_MCP_URL = "http://localhost:8000";
    mockFetch.mockRejectedValueOnce(new Error("Service down"));

    const { getCogneeClient } = await import("./cognee-client.ts");
    const client = getCogneeClient();

    await expect(
      client.remember({ data: "test", dataset_name: "test_dataset" })
    ).resolves.not.toThrow();
  });
});
