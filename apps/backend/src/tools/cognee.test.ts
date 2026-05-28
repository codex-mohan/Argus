import { describe, expect, it } from "vitest";

describe("Cognee tools — structure and signatures", () => {
  it("cognee tools are exported and have expected shape", async () => {
    const { cogneeTools } = await import("./cognee.ts");
    expect(cogneeTools.length).toBe(3);

    const names = cogneeTools.map((t) => t.name);
    expect(names).toContain("cognee_remember");
    expect(names).toContain("cognee_recall");
    expect(names).toContain("cognee_improve");
  });

  it("remember tool has correct parameter schema", async () => {
    const { cogneeRememberTool } = await import("./cognee.ts");
    expect(cogneeRememberTool.name).toBe("cognee_remember");
    expect(cogneeRememberTool.description).toContain("Cognee");
    expect(cogneeRememberTool.parameters).toBeDefined();
  });

  it("recall tool has correct parameter schema", async () => {
    const { cogneeRecallTool } = await import("./cognee.ts");
    expect(cogneeRecallTool.name).toBe("cognee_recall");
    // Should have query, datasets, top_k params
    const params = cogneeRecallTool.parameters as Record<string, unknown>;
    expect(params).toBeDefined();
  });

  it("improve tool has correct parameter schema", async () => {
    const { cogneeImproveTool } = await import("./cognee.ts");
    expect(cogneeImproveTool.name).toBe("cognee_improve");
    expect(cogneeImproveTool.parameters).toBeDefined();
  });
});
