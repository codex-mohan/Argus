import type { ProviderStatus } from "@argus/shared";

interface McpToolCall {
  tool: string;
  arguments: Record<string, unknown>;
}

interface McpToolResult {
  content: Array<{ type: string; text?: string; data?: string }>;
  isError?: boolean;
}

class CogneeClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
      provider: "cognee",
      available,
      degraded: !available,
      reason: available ? undefined : "Cognee MCP server unreachable — operating with degraded memory (in-session only)",
    };
  }

  async remember(args: {
    data: string;
    dataset_name?: string;
    session_id?: string;
    custom_prompt?: string;
  }): Promise<void> {
    try {
      await this.callTool("remember", {
        data: args.data,
        dataset_name: args.dataset_name ?? "main_dataset",
        session_id: args.session_id,
        custom_prompt: args.custom_prompt,
      });
    } catch (err) {
      console.warn("[cognee] remember failed — memory degraded:", err);
    }
  }

  async recall(args: {
    query: string;
    datasets?: string;
    session_id?: string;
    top_k?: number;
  }): Promise<string[]> {
    try {
      const result = await this.callTool("recall", {
        query: args.query,
        datasets: args.datasets,
        session_id: args.session_id,
        top_k: args.top_k ?? 10,
      });
      return result.content?.map((c) => c.text ?? "").filter(Boolean) ?? [];
    } catch (err) {
      console.warn("[cognee] recall failed:", err);
      return [];
    }
  }

  async improve(args: { dataset_name?: string; session_ids?: string }): Promise<void> {
    try {
      await this.callTool("improve", {
        dataset_name: args.dataset_name ?? "main_dataset",
        session_ids: args.session_ids,
      });
    } catch (err) {
      console.warn("[cognee] improve failed:", err);
    }
  }

  async forget(args: { dataset?: string; everything?: boolean }): Promise<void> {
    try {
      await this.callTool("forget", args);
    } catch (err) {
      console.warn("[cognee] forget failed:", err);
    }
  }

  private async callTool(tool: string, args: Record<string, unknown>): Promise<McpToolResult> {
    const response = await fetch(`${this.baseUrl}/tools/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tool, arguments: args }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Cognee tool ${tool} failed: ${response.status} ${await response.text()}`);
    }

    return response.json() as Promise<McpToolResult>;
  }
}

let _client: CogneeClient | null = null;

export function getCogneeClient(): CogneeClient {
  if (!_client) {
    const url = process.env.COGNEE_MCP_URL ?? "http://localhost:8000";
    _client = new CogneeClient(url);
  }
  return _client;
}
