import { createServer } from "node:http";
import {
  connectMcpServer,
  disconnectAllMcp,
  type McpServerConfig,
} from "./mcp/bridge.ts";
import { registerAimlApiProvider } from "./providers/aimlapi.ts";

const PORT = Number(process.env.PORT ?? "3001");

async function main() {
  console.log("\n  ╔══════════════════════════════════╗");
  console.log("  ║      ARGUS — Agent Swarm         ║");
  console.log("  ╚══════════════════════════════════╝\n");

  // 1. Register AI/ML API provider
  registerAimlApiProvider();
  console.log("  model: moonshotai/kimi-k2.6 (AI/ML API)");

  // 2. Connect MCP servers
  const brightDataKey = process.env.BRIGHTDATA_API_KEY;
  const cogneeUrl = process.env.COGNEE_MCP_URL ?? "http://localhost:8000";

  const mcpServers: McpServerConfig[] = [];

  if (brightDataKey) {
    mcpServers.push({
      name: "brightdata",
      url: `https://mcp.brightdata.com/mcp?token=${brightDataKey}`,
    });
  } else {
    console.warn("  ✗ BRIGHTDATA_API_KEY not set — Bright Data MCP disabled");
  }

  mcpServers.push({
    name: "cognee",
    url: cogneeUrl,
  });

  let brightDataTools = 0;
  let cogneeTools = 0;

  for (const cfg of mcpServers) {
    try {
      const tools = await connectMcpServer(cfg);
      if (cfg.name === "brightdata") {
        brightDataTools = tools.length;
      }
      if (cfg.name === "cognee") {
        cogneeTools = tools.length;
      }
    } catch (err) {
      console.error(
        `  ✗ ${cfg.name}: connection failed — ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  console.log(
    `  Bright Data: ${brightDataTools > 0 ? `✓ ${brightDataTools} tools` : "✗ unavailable"}`
  );
  console.log(
    `  Cognee:      ${cogneeTools > 0 ? `✓ ${cogneeTools} tools` : "✗ unavailable"}`
  );

  // 3. Start HTTP server
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "", `http://localhost:${PORT}`);
    res.setHeader("Content-Type", "application/json");

    if (url.pathname === "/health") {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          status: "ok",
          model: "moonshotai/kimi-k2.6",
          mcp: {
            brightdata: {
              connected: brightDataTools > 0,
              tools: brightDataTools,
            },
            cognee: { connected: cogneeTools > 0, tools: cogneeTools },
          },
        })
      );
      return;
    }

    if (url.pathname === "/api/signals") {
      res.writeHead(200);
      res.end(JSON.stringify({ signals: [], cached: false }));
      return;
    }

    if (url.pathname === "/api/agents/status") {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          agents: [
            { id: "market-data-bot", status: "idle" },
            { id: "filing-data-bot", status: "idle" },
            { id: "social-data-bot", status: "idle" },
            { id: "supplier-data-bot", status: "idle" },
            { id: "news-data-bot", status: "idle" },
            { id: "gtm-lens", status: "idle" },
            { id: "finance-lens", status: "idle" },
            { id: "security-lens", status: "idle" },
            { id: "correlation-engine", status: "idle" },
            { id: "brief-writer", status: "idle" },
          ],
        })
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  server.listen(PORT, () => {
    console.log(`\n  ✓ Server running on http://localhost:${PORT}\n`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await disconnectAllMcp();
  process.exit(0);
});
