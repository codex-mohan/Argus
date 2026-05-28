import { describe, expect, it } from "vitest";
import { mcpSchemaToZod } from "./bridge.ts";

// We can't test connectMcpServer without a real server, but we can test schema conversion
describe("MCP Bridge — schema conversion", () => {
  it("converts string properties", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string", description: "The name" } },
      required: ["name"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ name: "test" }).success).toBe(true);
    expect(zod.safeParse({}).success).toBe(false);
  });

  it("converts number properties", () => {
    const schema = {
      type: "object",
      properties: { count: { type: "number" } },
      required: [],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ count: 42 }).success).toBe(true);
    expect(zod.safeParse({ count: "wrong" }).success).toBe(false);
  });

  it("converts integer properties", () => {
    const schema = {
      type: "object",
      properties: { page: { type: "integer" } },
      required: ["page"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ page: 1 }).success).toBe(true);
    expect(zod.safeParse({ page: 1.5 }).success).toBe(false);
  });

  it("converts boolean properties", () => {
    const schema = {
      type: "object",
      properties: { active: { type: "boolean" } },
      required: [],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ active: true }).success).toBe(true);
    expect(zod.safeParse({ active: "yes" }).success).toBe(false);
  });

  it("converts enum properties", () => {
    const schema = {
      type: "object",
      properties: { status: { type: "string", enum: ["active", "inactive"] } },
      required: ["status"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ status: "active" }).success).toBe(true);
    expect(zod.safeParse({ status: "pending" }).success).toBe(false);
  });

  it("marks non-required properties as optional", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" }, age: { type: "integer" } },
      required: ["name"],
    };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({ name: "test" }).success).toBe(true);
    expect(zod.safeParse({ name: "test", age: 30 }).success).toBe(true);
    expect(zod.safeParse({ age: 30 }).success).toBe(false); // name required
  });

  it("handles empty schema gracefully", () => {
    const schema = { type: "object", properties: {}, required: [] };
    const zod = mcpSchemaToZod(schema);
    expect(zod.safeParse({}).success).toBe(true);
  });
});
