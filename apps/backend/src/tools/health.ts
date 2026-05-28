import { getBrightDataClient } from "../mcp/brightdata-client";
import { getCogneeClient } from "../mcp/cognee-client";
import type { ProviderStatus } from "@argus/shared";

export async function runHealthCheck(): Promise<ProviderStatus[]> {
  const results: ProviderStatus[] = [];

  try {
    const bd = getBrightDataClient();
    results.push(await bd.health());
  } catch (err) {
    results.push({ provider: "brightdata", available: false, degraded: true, reason: String(err) });
  }

  try {
    const cog = getCogneeClient();
    results.push(await cog.health());
  } catch (err) {
    results.push({ provider: "cognee", available: false, degraded: true, reason: String(err) });
  }

  return results;
}

export { getBrightDataClient, getCogneeClient };
