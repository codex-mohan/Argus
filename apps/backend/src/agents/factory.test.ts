import type { AgentTool } from "@mohanscodex/spectra-agent";
import { describe, expect, it } from "vitest";
import { createCollectionAgent } from "./factory.ts";

describe("Collection agent factory", () => {
  it("creates an agent without throwing", () => {
    expect(() =>
      createCollectionAgent({
        agentId: "test-bot",
        name: "TestBot",
        systemPrompt: ["You are a test agent."],
      })
    ).not.toThrow();
  });

  it("agent is defined after creation", () => {
    const agent = createCollectionAgent({
      agentId: "prompt-bot",
      name: "PromptBot",
      systemPrompt: ["You are helpful."],
    });
    expect(agent).toBeDefined();
  });

  it("accepts empty MCP server list", () => {
    const agent = createCollectionAgent({
      agentId: "no-source-bot",
      name: "NoSourceBot",
      systemPrompt: ["test"],
      mcpServers: [],
    });
    expect(agent).toBeDefined();
  });

  it("accepts extra tools", () => {
    const extraTool: AgentTool = {
      name: "custom_check",
      description: "A custom check tool",
      parameters: {},
      execute: async () => ({ content: [{ type: "text", text: "checked" }] }),
    };
    const agent = createCollectionAgent({
      agentId: "tool-bot",
      name: "ToolBot",
      systemPrompt: ["test"],
      mcpServers: [],
      extraTools: [extraTool],
    });
    expect(agent).toBeDefined();
  });
});
