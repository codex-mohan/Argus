import { getBrightDataClient, getCogneeClient } from "./tools/health";
import { createMarketDataBot } from "./agents/collection/market-data";

const port = Number(process.env.PORT ?? "3001");

async function main() {
  console.log("\n  ╔══════════════════════════════════╗");
  console.log("  ║        ARGUS — Agent Swarm        ║");
  console.log("  ╚══════════════════════════════════╝\n");

  const bd = getBrightDataClient();
  const cog = getCogneeClient();

  // Health check
  const [bdHealth, cogHealth] = await Promise.all([bd.health(), cog.health()]);
  console.log(`  Bright Data: ${bdHealth.available ? "✓ available" : "✗ unavailable — ${bdHealth.reason}"}`);
  console.log(`  Cognee:      ${cogHealth.available ? "✓ available" : "✗ unavailable — ${cogHealth.reason}"}`);

  if (cogHealth.available) {
    console.log("  Memory mode: persistent (cross-agent)");
  } else {
    console.log("  Memory mode: DEGRADED (in-session only, no cross-agent memory)");
  }

  // Start HTTP server for SSE streaming + REST endpoints
  const server = Bun.serve({
    port,
    routes: {
      "/health": async () => {
        const [bd, cog] = await Promise.all([getBrightDataClient().health(), getCogneeClient().health()]);
        return Response.json({ status: "ok", providers: { brightdata: bd, cognee: cog } });
      },

      "/api/signals": async () => {
        // TODO: stream signals from active agents
        return Response.json({ signals: [], cached: false });
      },

      "/api/agents/status": () => {
        return Response.json({
          agents: [
            { id: "market-data-bot", status: "idle", last_run: null },
            { id: "filing-data-bot", status: "idle", last_run: null },
            { id: "social-data-bot", status: "idle", last_run: null },
            { id: "supplier-data-bot", status: "idle", last_run: null },
            { id: "news-data-bot", status: "idle", last_run: null },
          ],
        });
      },
    },

    fetch(req) {
      return new Response("Not found", { status: 404 });
    },
  });

  console.log(`\n  ✓ Server running on http://localhost:${port}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
