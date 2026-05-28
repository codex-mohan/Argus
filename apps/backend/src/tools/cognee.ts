import { type AgentTool, defineTool } from "@mohanscodex/spectra-agent";
import { z } from "zod";
import { callMcpTool } from "../mcp/bridge.ts";

const SERVER = "cognee";

function cogCall(tool: string, args: Record<string, unknown>): Promise<string> {
  return callMcpTool(SERVER, tool, args).then((r) => {
    const contents = r.content as
      | Array<{ type: string; text?: string }>
      | undefined;
    return (
      contents
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("\n") ?? ""
    );
  });
}

export const cogneeRememberTool = defineTool({
  name: "cognee_remember",
  description: "Store a finding in Cognee persistent memory graph",
  parameters: z.object({
    data: z
      .string()
      .describe(
        "JSON string of the memory entry: {source_url, scraped_at, agent_id, confidence, data_type, content}"
      ),
    dataset_name: z.string().default("main_dataset"),
  }),
  execute: async ({ data, dataset_name }) => {
    await cogCall("remember", { data, dataset_name });
    return { content: [{ type: "text", text: "Stored in memory" }] };
  },
});

export const cogneeRecallTool = defineTool({
  name: "cognee_recall",
  description: "Recall relevant context from Cognee memory",
  parameters: z.object({
    query: z.string().describe("Natural language search query"),
    datasets: z.string().optional().describe("Comma-separated dataset names"),
    top_k: z.number().default(5),
  }),
  execute: async ({ query, datasets, top_k }) => {
    const text = await cogCall("recall", { query, datasets, top_k });
    return { content: [{ type: "text", text }] };
  },
});

export const cogneeImproveTool = defineTool({
  name: "cognee_improve",
  description: "Enrich knowledge graph and bridge session to permanent memory",
  parameters: z.object({ dataset_name: z.string().default("main_dataset") }),
  execute: async ({ dataset_name }) => {
    await cogCall("improve", { dataset_name });
    return { content: [{ type: "text", text: "Graph enriched" }] };
  },
});

export const cogneeTools: AgentTool[] = [
  cogneeRememberTool,
  cogneeRecallTool,
  cogneeImproveTool,
];
