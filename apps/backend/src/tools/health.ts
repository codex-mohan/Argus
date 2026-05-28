import type { ProviderStatus } from "@argus/shared";
import { getBrightDataClient } from "../mcp/brightdata-client.ts";
import { getCogneeClient } from "../mcp/cognee-client.ts";

export async function runHealthCheck(): Promise<ProviderStatus[]> {
  const results: ProviderStatus[] = [];

  try {
    const bd = getBrightDataClient();
    results.push(await bd.health());
  } catch (err) {
    results.push({
      provider: "brightdata",
      available: false,
      degraded: true,
      reason: String(err),
    });
  }

  try {
    const cog = getCogneeClient();
    results.push(await cog.health());
  } catch (err) {
    results.push({
      provider: "cognee",
      available: false,
      degraded: true,
      reason: String(err),
    });
  }

  return results;
}
