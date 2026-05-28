const port = Number(process.env.PORT ?? "3001");

async function main() {
  console.log("\n  ╔══════════════════════════════════╗");
  console.log("  ║        ARGUS — Agent Swarm        ║");
  console.log("  ╚══════════════════════════════════╝\n");

  const { getBrightDataClient } = await import("./mcp/brightdata-client.ts");
  const { getCogneeClient } = await import("./mcp/cognee-client.ts");
  const bd = getBrightDataClient();
  const cog = getCogneeClient();

  const [bdHealth, cogHealth] = await Promise.all([bd.health(), cog.health()]);
  const bdStatus = bdHealth.available
    ? "available"
    : `unavailable — ${bdHealth.reason ?? "unknown"}`;
  const cogStatus = cogHealth.available
    ? "available"
    : `unavailable — ${cogHealth.reason ?? "unknown"}`;
  console.log(`  Bright Data: ${bdHealth.available ? "✓" : "✗"} ${bdStatus}`);
  console.log(`  Cognee:      ${cogHealth.available ? "✓" : "✗"} ${cogStatus}`);

  if (cogHealth.available) {
    console.log("  Memory mode: persistent (cross-agent)");
  } else {
    console.log(
      "  Memory mode: DEGRADED (in-session only, no cross-agent memory)"
    );
  }

  Bun.serve({
    port,
    routes: {
      "/health": async () => {
        const [bdH, cogH] = await Promise.all([
          getBrightDataClient().health(),
          getCogneeClient().health(),
        ]);
        return Response.json({
          status: "ok",
          providers: { brightdata: bdH, cognee: cogH },
        });
      },

      "/api/signals": () => Response.json({ signals: [], cached: false }),

      "/api/agents/status": () =>
        Response.json({
          agents: [
            { id: "market-data-bot", status: "idle", last_run: null },
            { id: "filing-data-bot", status: "idle", last_run: null },
            { id: "social-data-bot", status: "idle", last_run: null },
            { id: "supplier-data-bot", status: "idle", last_run: null },
            { id: "news-data-bot", status: "idle", last_run: null },
          ],
        }),
    },

    fetch(_req) {
      return new Response("Not found", { status: 404 });
    },
  });

  console.log(`\n  ✓ Server running on http://localhost:${port}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
