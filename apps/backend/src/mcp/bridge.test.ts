import { describe, expect, it } from "vitest";

const SANITIZED_NAME_RE = /^mcp_[a-zA-Z0-9_]+$/;
const AMAZON_TOOL_RE = /^mcp_brightdata_web_data_amazon_product$/;

describe("MCP Bridge — schema conversion", () => {
  it("converts string properties", async () => {
    const { mcpSchemaToZod } = await import("./bridge.ts");
    const schema = {
      type: "object",
      properties: { name: { type: "string", description: "The name" } },
      required: ["name"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ name: "test" }).success).toBe(true);
    expect(zod.safeParse({}).success).toBe(false);
  });

  it("converts number properties", async () => {
    const { mcpSchemaToZod } = await import("./bridge.ts");
    const schema = {
      type: "object",
      properties: { count: { type: "number" } },
      required: [],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ count: 42 }).success).toBe(true);
    expect(zod.safeParse({ count: "wrong" }).success).toBe(false);
  });

  it("converts integer properties", async () => {
    const { mcpSchemaToZod } = await import("./bridge.ts");
    const schema = {
      type: "object",
      properties: { page: { type: "integer" } },
      required: ["page"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ page: 1 }).success).toBe(true);
    expect(zod.safeParse({ page: 1.5 }).success).toBe(false);
  });

  it("converts enum properties", async () => {
    const { mcpSchemaToZod } = await import("./bridge.ts");
    const schema = {
      type: "object",
      properties: { status: { type: "string", enum: ["active", "inactive"] } },
      required: ["status"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ status: "active" }).success).toBe(true);
    expect(zod.safeParse({ status: "pending" }).success).toBe(false);
  });

  it("marks non-required as optional", async () => {
    const { mcpSchemaToZod } = await import("./bridge.ts");
    const schema = {
      type: "object",
      properties: { name: { type: "string" }, age: { type: "integer" } },
      required: ["name"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ name: "test" }).success).toBe(true);
    expect(zod.safeParse({ name: "test", age: 30 }).success).toBe(true);
    expect(zod.safeParse({ age: 30 }).success).toBe(false);
  });

  it("handles empty schema", async () => {
    const { mcpSchemaToZod } = await import("./bridge.ts");
    const schema = { type: "object", properties: {}, required: [] };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({}).success).toBe(true);
  });
});

describe("MCP Bridge — tool creation", () => {
  it("creates AgentTool from MCP tool definition", async () => {
    const { createMcpAgentTool } = await import("./bridge.ts");
    const tool = createMcpAgentTool("test-server", {
      name: "scrape_as_markdown",
      description: "Scrape a webpage as markdown",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    });

    expect(tool.name).toContain("test-server");
    expect(tool.name).toContain("scrape_as_markdown");
    expect(tool.description).toContain("Scrape a webpage");
  });

  it("tool name sanitizes special characters", async () => {
    const { createMcpAgentTool } = await import("./bridge.ts");
    const tool = createMcpAgentTool("brightdata", {
      name: "web_data_amazon_product",
      description: "Amazon product data",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    });
    expect(tool.name).toMatch(AMAZON_TOOL_RE);
  });

  it("tool name does not contain special characters", async () => {
    const { createMcpAgentTool } = await import("./bridge.ts");
    const tool = createMcpAgentTool("brightdata", {
      name: "tool-name.with.dots",
      description: "test",
      inputSchema: { type: "object", properties: {} },
    });
    const name = tool.name;
    expect(name).not.toContain("-");
    expect(name).not.toContain(".");
    expect(name).toMatch(SANITIZED_NAME_RE);
  });

  it("getMcpTools returns empty for unknown server", async () => {
    const { getMcpTools } = await import("./bridge.ts");
    const tools = getMcpTools("nonexistent");
    expect(tools).toEqual([]);
  });
});
