import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type {
  CallToolResult,
  Tool as McpToolDef,
} from "@modelcontextprotocol/sdk/types.js";
import { type AgentTool, defineTool } from "@mohanscodex/spectra-agent";
import { z } from "zod";

export interface McpServerConfig {
  enabled?: boolean;
  headers?: Record<string, string>;
  name: string;
  url: string;
}

interface ConnectedServer {
  client: Client;
  name: string;
  tools: McpToolDef[];
}

const servers = new Map<string, ConnectedServer>();

export async function connectMcpServer(
  config: McpServerConfig
): Promise<McpToolDef[]> {
  if (config.enabled === false) {
    return [];
  }
  if (servers.has(config.name)) {
    throw new Error(`MCP server "${config.name}" already connected`);
  }

  const client = new Client(
    { name: `argus-${config.name}`, version: "1.0.0" },
    { capabilities: {} }
  );

  const url = new URL(config.url);
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: config.headers ?? {} },
  });

  await client.connect(transport);

  let tools: McpToolDef[] = [];
  try {
    const result = await client.listTools();
    tools = result.tools ?? [];
  } catch {
    console.warn(`[mcp] ${config.name}: failed to list tools`);
  }

  servers.set(config.name, { name: config.name, client, tools });
  console.log(`[mcp] ${config.name}: ${tools.length} tools`);
  return tools;
}

export function callMcpTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const server = servers.get(serverName);
  if (!server) {
    throw new Error(`MCP server "${serverName}" not connected`);
  }
  return server.client.callTool({
    name: toolName,
    arguments: args,
  }) as Promise<CallToolResult>;
}

export function getMcpTools(serverName: string): McpToolDef[] {
  return servers.get(serverName)?.tools ?? [];
}

export async function disconnectAllMcp(): Promise<void> {
  for (const [name, server] of servers) {
    try {
      await server.client.close();
    } catch {
      /* cleanup */
    }
    servers.delete(name);
  }
}

// ---------------------------------------------------------------------------
// JSON Schema → Zod
// ---------------------------------------------------------------------------

export function mcpSchemaToZod(
  schema: Record<string, unknown>
): z.ZodObject<Record<string, z.ZodType>> {
  const js = schema as {
    type?: string;
    properties?: Record<
      string,
      { type?: string; description?: string; enum?: unknown[] }
    >;
    required?: string[];
  };
  const props = js.properties ?? {};
  const req = js.required ?? [];
  const shape: Record<string, z.ZodType> = {};

  for (const [key, prop] of Object.entries(props)) {
    let zodType: z.ZodType;
    const desc = prop.description ?? "";
    switch (prop.type ?? "string") {
      case "number":
        zodType = z.number().describe(desc);
        break;
      case "integer":
        zodType = z.number().int().describe(desc);
        break;
      case "boolean":
        zodType = z.boolean().describe(desc);
        break;
      case "array":
        zodType = z.array(z.unknown()).describe(desc);
        break;
      case "object":
        zodType = z.record(z.unknown()).describe(desc);
        break;
      default:
        zodType = z.string().describe(desc);
    }
    if (prop.enum) {
      zodType = z.enum(prop.enum as [string, ...string[]]).describe(desc);
    }
    if (!req.includes(key)) {
      zodType = zodType.optional();
    }
    shape[key] = zodType;
  }
  return z.object(shape);
}

function extractText(result: CallToolResult): string {
  const contents = result.content as
    | Array<{ type: string; text?: string }>
    | undefined;
  return (
    contents
      ?.filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n") || "(no output)"
  );
}

// ---------------------------------------------------------------------------
// Dynamic tool factory
// ---------------------------------------------------------------------------

export function createMcpAgentTool(
  serverName: string,
  mcpTool: McpToolDef
): AgentTool {
  const fullName = `mcp_${serverName}_${mcpTool.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const zodSchema = mcpSchemaToZod(
    (mcpTool.inputSchema as Record<string, unknown>) ?? {}
  );

  return defineTool({
    name: fullName,
    description: `[${serverName}] ${mcpTool.description ?? mcpTool.name}`,
    parameters: zodSchema,
    execute: async (args) => {
      try {
        const result = await callMcpTool(
          serverName,
          mcpTool.name,
          args as Record<string, unknown>
        );
        return { content: [{ type: "text", text: extractText(result) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Tool error: ${msg}` }],
          isError: true,
        };
      }
    },
  });
}

export function createAllMcpAgentTools(serverName: string): AgentTool[] {
  return getMcpTools(serverName).map((t) => createMcpAgentTool(serverName, t));
}
