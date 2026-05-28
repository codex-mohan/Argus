import type { ProviderStatus, ScrapeResult } from "@argus/shared";

class McpClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async health(): Promise<ProviderStatus> {
    const available = await this.isAvailable();
    return {
      provider: "brightdata",
      available,
      degraded: false,
      reason: available ? undefined : "Bright Data MCP server unreachable",
    };
  }

  async scrapeAsMarkdown(url: string): Promise<ScrapeResult> {
    try {
      const result = await this.call("scrape_as_markdown", { url });
      const text = result.content?.[0]?.text ?? "";
      return { status: "success", data: text, source: "brightdata_mcp" };
    } catch (err) {
      return {
        status: "unavailable",
        reason: String(err),
        suggestion:
          "Retry with escalation: scrape_as_markdown → scraping_browser → web_unlocker",
      };
    }
  }

  async search(query: string): Promise<ScrapeResult> {
    try {
      const result = await this.call("search_engine", { query });
      return { status: "success", data: result, source: "brightdata_serp" };
    } catch (err) {
      return {
        status: "unavailable",
        reason: String(err),
        suggestion: "SERP API unavailable — try direct URL scraping",
      };
    }
  }

  async structuredScrape(
    toolName: string,
    params: Record<string, unknown>
  ): Promise<ScrapeResult> {
    try {
      const result = await this.call(toolName, params);
      return {
        status: "success",
        data: result,
        source: `brightdata_${toolName}`,
      };
    } catch (err) {
      return {
        status: "unavailable",
        reason: String(err),
        suggestion: `Structured extractor ${toolName} unavailable — fall back to scrape_as_markdown`,
      };
    }
  }

  private async call(
    tool: string,
    args: Record<string, unknown>
  ): Promise<{ content?: Array<{ text?: string }> }> {
    const response = await fetch(`${this.baseUrl}/tools/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ name: tool, arguments: args }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new Error(
        `MCP tool ${tool} failed: ${response.status} ${await response.text()}`
      );
    }

    return response.json() as Promise<{ content?: Array<{ text?: string }> }>;
  }
}

let _client: McpClient | null = null;

export function getBrightDataClient(): McpClient {
  if (!_client) {
    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      throw new Error("BRIGHTDATA_API_KEY is required");
    }
    _client = new McpClient("https://mcp.brightdata.com/mcp", apiKey);
  }
  return _client;
}
