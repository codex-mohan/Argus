import type { AgentTool } from "@mohanscodex/spectra-agent";
import { describe, expect, it } from "vitest";
import { createCollectionAgent } from "./factory.ts";

describe("Collection agent factory", () => {
  it("creates an agent without throwing", () => {
    expect(() =>
      createCollectionAgent({
        name: "TestBot",
        systemPrompt: ["You are a test agent."],
      })
    ).not.toThrow();
  });

  it("agent is defined after creation", () => {
    const agent = createCollectionAgent({
      name: "PromptBot",
      systemPrompt: ["You are helpful."],
    });
    expect(agent).toBeDefined();
  });

  it("accepts empty MCP server list", () => {
    const agent = createCollectionAgent({
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
      name: "ToolBot",
      systemPrompt: ["test"],
      mcpServers: [],
      extraTools: [extraTool],
    });
    expect(agent).toBeDefined();
  });
});
