import { Agent, type AgentTool } from "@mohanscodex/spectra-agent";
import { resolveAgentModel } from "../config/store.ts";
import { createAllMcpAgentTools } from "../mcp/bridge.ts";
import { cogneeTools } from "../tools/cognee.ts";

export interface CollectionAgentConfig {
  agentId: string;
  extraTools?: AgentTool[];
  mcpServers?: string[];
  name: string;
  systemPrompt: string[];
}

export function createCollectionAgent(config: CollectionAgentConfig): Agent {
  const tools: AgentTool[] = [];

  for (const server of config.mcpServers ?? ["brightdata"]) {
    tools.push(...createAllMcpAgentTools(server));
  }

  tools.push(...cogneeTools);
  if (config.extraTools) {
    tools.push(...config.extraTools);
  }

  const model = resolveAgentModel(config.agentId);

  return new Agent({
    model,
    systemPrompt: config.systemPrompt.join("\n"),
    tools,
  });
}
