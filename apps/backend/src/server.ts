/// <reference types="bun" />

import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from project root (this file is at apps/backend/src/server.ts)
const envPath = resolve(import.meta.dir, "../../../.env");
dotenv.config({ path: envPath });

import {
  extractToken,
  getCurrentUser,
  loginUser,
  registerUser,
  updateOnboarding,
  updateUserWatchlist,
} from "./auth.ts";
import { clearMemoryCache, getCacheStats } from "./cache.ts";
import {
  handleGetAgentConfig,
  handleGetModel,
  handleGetUserSettings,
  handleIndexModels,
  handleListAgentConfigs,
  handleListModels,
  handleListPipelineConfig,
  handleModelStats,
  handleUpdateAgentConfig,
  handleUpdatePipelineConfig,
  handleUpdateUserSettings,
} from "./config/routes.ts";
import { getAgentConfig, resolveAgentModel } from "./config/store.ts";
import { type ArgusEvent, getCreditStats, on } from "./events.ts";
// Types imported via function return types
import {
  connectMcpServer,
  disconnectAllMcp,
  type McpServerConfig,
} from "./mcp/bridge.ts";
import {
  addToWatchlist,
  getWatchlist,
  isPipelineRunning,
  removeFromWatchlist,
  startPipeline,
  stopPipeline,
  triggerManualRun,
  triggerReplay,
} from "./pipeline.ts";
import { registerAimlApiProvider } from "./providers/aimlapi.ts";
import {
  getAgentStatuses,
  getBriefsForCompany,
  getSignals,
  getSignalsForCompany,
  getStateStats,
} from "./state.ts";

const PORT = Number(process.env.PORT ?? "3001");

// ─── CORS ──────────────────────────────────────────────────────────────────

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders() });
}

// ─── SSE Streams ───────────────────────────────────────────────────────────

interface SseClient {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  generation: number;
}

const sseClients = new Set<SseClient>();
let sseGeneration = 0;

function broadcastEvent(event: ArgusEvent): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();
  for (const client of sseClients) {
    try {
      client.controller.enqueue(encoder.encode(data));
    } catch {
      sseClients.delete(client);
    }
  }
}

// Subscribe to all events and broadcast to SSE clients
on("monitor_tick", broadcastEvent);
on("evidence_collected", broadcastEvent);
on("fact_extracted", broadcastEvent);
on("fact_classified", broadcastEvent);
on("lens_analysis_complete", broadcastEvent);
on("convergence_detected", broadcastEvent);
on("brief_ready", broadcastEvent);
on("agent_degraded", broadcastEvent);
on("step_emitted", broadcastEvent);

function handleSseStream(req: Request): Response {
  const gen = ++sseGeneration;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const client: SseClient = { controller, encoder, generation: gen };
      sseClients.add(client);

      controller.enqueue(encoder.encode(":ok\n\n"));

      req.signal.addEventListener("abort", () => {
        sseClients.delete(client);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...corsHeaders(),
    },
  });
}

// ─── Route Handlers ────────────────────────────────────────────────────────

async function handleQuery(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { query?: string };
    const query = body.query?.trim() ?? "";
    if (!query) {
      return jsonResponse({ error: "Query required" }, 400);
    }

    if (query.toLowerCase().includes("watchlist")) {
      return jsonResponse({ type: "watchlist", companies: getWatchlist() });
    }

    if (query.toLowerCase().includes("signal")) {
      const company = getWatchlist().find((c) =>
        query.toLowerCase().includes(c.toLowerCase())
      );
      const signals = company ? getSignalsForCompany(company) : getSignals(10);
      return jsonResponse({
        type: "signals",
        signals,
        company: company ?? null,
      });
    }

    return jsonResponse({
      type: "text",
      text: `Received: "${query}". Try asking about signals, watchlist, or a company like NVIDIA.`,
    });
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
}

async function handleAddWatchlist(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { company?: string };
    const company = body.company?.trim();
    if (!company) {
      return jsonResponse({ error: "Company required" }, 400);
    }
    addToWatchlist(company);
    return jsonResponse({ success: true, companies: getWatchlist() });
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
}

async function handleRemoveWatchlist(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { company?: string };
    const company = body.company?.trim();
    if (!company) {
      return jsonResponse({ error: "Company required" }, 400);
    }
    removeFromWatchlist(company);
    return jsonResponse({ success: true, companies: getWatchlist() });
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
}

async function handleTriggerRun(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { company?: string; mode?: string };
    const company = body.company?.trim() ?? getWatchlist()[0];
    const mode = body.mode === "cached" ? "cached" : "live";
    if (!company) {
      return jsonResponse(
        { error: "No company specified and watchlist is empty" },
        400
      );
    }
    const runId = triggerManualRun(company, mode);
    return jsonResponse({ success: true, runId, company, mode });
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
}

async function handleReplay(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { scenario?: string };
    const scenario = body.scenario ?? "nvidia_convergence";
    triggerReplay(scenario);
    return jsonResponse({ success: true, scenario });
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

// ─── MCP State (updated async) ───────────────────────────────────────────

let mcpState = {
  brightdata: { connected: false, tools: 0 },
  cognee: { connected: false, tools: 0 },
};

async function connectMcpServersAsync(): Promise<void> {
  const brightDataKey = process.env.BRIGHTDATA_API_KEY;
  const cogneeUrl = process.env.COGNEE_MCP_URL ?? "http://localhost:8000";

  const mcpServers: McpServerConfig[] = [];

  if (brightDataKey) {
    mcpServers.push({
      name: "brightdata",
      url: `https://mcp.brightdata.com/mcp?token=${brightDataKey}`,
    });
    console.log("  Bright Data: configured");
  } else {
    console.warn("  ✗ BRIGHTDATA_API_KEY not set — Bright Data MCP disabled");
  }

  mcpServers.push({ name: "cognee", url: cogneeUrl });
  console.log("  Cognee: configured");

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

  mcpState = {
    brightdata: { connected: brightDataTools > 0, tools: brightDataTools },
    cognee: { connected: cogneeTools > 0, tools: cogneeTools },
  };

  console.log(
    `  Bright Data: ${brightDataTools > 0 ? `✓ ${brightDataTools} tools` : "✗ unavailable"}`
  );
  console.log(
    `  Cognee:      ${cogneeTools > 0 ? `✓ ${cogneeTools} tools` : "✗ unavailable"}`
  );

  // Start pipeline if MCP is ready
  if (brightDataTools > 0 || cogneeTools > 0) {
    startPipeline(5);
  } else {
    console.warn(
      "  ⚠ Pipeline not started — MCP servers unavailable. Replay mode still works."
    );
  }
}

async function handleRegister(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    const result = await registerUser(
      body.email ?? "",
      body.password ?? "",
      body.name ?? ""
    );
    if (!result.success) {
      return jsonResponse({ success: false, error: result.error }, 400);
    }
    return jsonResponse({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch {
    return jsonResponse({ success: false, error: "Invalid request" }, 400);
  }
}

async function handleLogin(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const result = await loginUser(body.email ?? "", body.password ?? "");
    if (!result.success) {
      return jsonResponse({ success: false, error: result.error }, 401);
    }
    return jsonResponse({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch {
    return jsonResponse({ success: false, error: "Invalid request" }, 400);
  }
}

async function handleMe(req: Request): Promise<Response> {
  const token = extractToken(req);
  if (!token) {
    return jsonResponse({ success: false, error: "Not authenticated" }, 401);
  }
  const user = await getCurrentUser(token);
  if (!user) {
    return jsonResponse({ success: false, error: "Invalid token" }, 401);
  }
  return jsonResponse({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep,
      watchlist: user.watchlist,
      createdAt: user.createdAt,
    },
  });
}

async function handleChat(req: Request): Promise<Response> {
  const token = extractToken(req);
  if (!token) {
    return jsonResponse({ success: false, error: "Not authenticated" }, 401);
  }
  const user = await getCurrentUser(token);
  if (!user) {
    return jsonResponse({ success: false, error: "Invalid token" }, 401);
  }

  try {
    const body = (await req.json()) as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
    };
    const message = body.message?.trim() ?? "";
    if (!message) {
      return jsonResponse({ success: false, error: "Message required" }, 400);
    }

    // Gather context from SQLite
    const allSignals = getSignals(20);
    const watchlistCompanies =
      user.watchlist.length > 0 ? user.watchlist : getWatchlist();
    const companyBriefs = watchlistCompanies
      .flatMap((c) => getBriefsForCompany(c))
      .slice(0, 5);

    // Simple keyword matching to find relevant signals
    const lowerMsg = message.toLowerCase();
    const relevantSignals = allSignals
      .filter((s) => {
        const text = `${s.headline} ${s.synthesis} ${s.lens}`.toLowerCase();
        return watchlistCompanies.some((c) =>
          lowerMsg.includes(c.toLowerCase())
        )
          ? text.includes(
              watchlistCompanies
                .find((c) => lowerMsg.includes(c.toLowerCase()))
                ?.toLowerCase() ?? ""
            )
          : true;
      })
      .slice(0, 10);

    // Build context for LLM
    const signalContext = relevantSignals
      .map(
        (s) =>
          `[${s.lens.toUpperCase()}] ${s.headline} (confidence: ${(s.confidence * 100).toFixed(0)}%) — ${s.synthesis}`
      )
      .join("\n");

    const briefContext = companyBriefs
      .map(
        (b) => `Brief for ${b.company}: ${b.headline} — Risk ${b.riskScore}/100`
      )
      .join("\n");

    const systemPrompt = `You are the Argus Intelligence Assistant. You help analysts query cross-lens intelligence (GTM, Finance, Security) from a live enterprise monitoring platform.

Current watchlist: ${watchlistCompanies.join(", ")}

Relevant signals from the platform:
${signalContext || "No signals available yet."}

Recent briefs:
${briefContext || "No briefs available yet."}

Instructions:
- Always cite which lens (GTM, Finance, Security) each insight comes from
- If generating a report, structure it with: Executive Summary, Key Findings (per lens), Risk Assessment, Recommendations
- Be concise but thorough. Use markdown formatting.
- If you don't have enough data, say so and suggest running a pipeline scan.`;

    const apiKey = process.env.AIMLAPI_KEY;
    if (!apiKey) {
      // Fallback: return structured data without LLM synthesis
      return jsonResponse({
        success: true,
        response: `Here's what I found in your intelligence database:\n\n${signalContext}\n\n${briefContext}\n\n(Note: LLM synthesis is unavailable — set AIMLAPI_KEY in .env for full analysis)`,
        sources: relevantSignals.map((s) => ({
          headline: s.headline,
          lens: s.lens,
          confidence: s.confidence,
        })),
      });
    }

    // Call AI/ML API
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.aimlapi.com/v1",
    });

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: systemPrompt }];

    if (body.history) {
      for (const h of body.history.slice(-4)) {
        const role =
          h.role === "assistant" ? ("assistant" as const) : ("user" as const);
        messages.push({ role, content: h.content });
      }
    }

    messages.push({ role: "user", content: message });

    const chatModel = resolveAgentModel("chat-assistant");
    const chatCfg = getAgentConfig("chat-assistant");
    const completion = await client.chat.completions.create({
      model: chatModel.id,
      messages: messages as never,
      temperature: chatCfg?.temperature ?? 0.3,
      max_completion_tokens: chatCfg?.maxTokens ?? 32_000,
    });

    const response =
      completion.choices[0]?.message?.content ?? "No response from AI.";

    return jsonResponse({
      success: true,
      response,
      sources: relevantSignals.map((s) => ({
        headline: s.headline,
        lens: s.lens,
        confidence: s.confidence,
      })),
    });
  } catch (err) {
    return jsonResponse(
      {
        success: false,
        error: err instanceof Error ? err.message : "Chat failed",
      },
      500
    );
  }
}

async function handleUpdateOnboarding(req: Request): Promise<Response> {
  const token = extractToken(req);
  if (!token) {
    return jsonResponse({ success: false, error: "Not authenticated" }, 401);
  }
  const user = await getCurrentUser(token);
  if (!user) {
    return jsonResponse({ success: false, error: "Invalid token" }, 401);
  }
  try {
    const body = (await req.json()) as {
      step?: number;
      complete?: boolean;
      watchlist?: string[];
    };
    if (body.step !== undefined) {
      updateOnboarding(
        user.id,
        body.step,
        body.complete ?? user.onboardingComplete
      );
    }
    if (body.watchlist) {
      updateUserWatchlist(user.id, body.watchlist);
    }
    const updated = getCurrentUser(token);
    return jsonResponse({ success: true, user: updated });
  } catch {
    return jsonResponse({ success: false, error: "Invalid request" }, 400);
  }
}

async function main() {
  console.log("\n  ╔══════════════════════════════════════╗");
  console.log("  ║    ARGUS v2 — Event-Driven Swarm   ║");
  console.log("  ╚══════════════════════════════════════╝\n");

  // 1. Register AI/ML API provider
  registerAimlApiProvider();
  console.log("  provider: aimlapi (AI/ML API)");

  // 2. Connect MCP servers in background (non-blocking)
  connectMcpServersAsync().catch((err) => {
    console.error("[mcp] Background connection error:", err);
  });

  // 3. Start HTTP server IMMEDIATELY (don't wait for MCP)
  Bun.serve({
    port: PORT,
    idleTimeout: 120,
    reusePort: true,
    routes: {
      "/health": () => {
        const stats = getStateStats();
        const creditStats = getCreditStats();
        const cacheStats = getCacheStats();
        return jsonResponse({
          status: "ok",
          version: "2.0.0-event-driven",
          pipeline: isPipelineRunning(),
          mcp: mcpState,
          watchlist: getWatchlist(),
          stats: {
            runs: stats.totalRuns,
            signals: stats.totalSignals,
            briefs: stats.totalBriefs,
            credits: creditStats,
            cache: cacheStats,
          },
        });
      },

      "/api/signals": async (req: Request) => {
        const token = extractToken(req);
        let userWatchlist: string[] = [];
        if (token) {
          const user = await getCurrentUser(token);
          if (user) {
            userWatchlist = user.watchlist;
          }
        }
        const allSignals = getSignals(100);
        const signals =
          userWatchlist.length > 0
            ? allSignals.filter((s) =>
                userWatchlist.some((c) =>
                  s.headline.toLowerCase().includes(c.toLowerCase())
                )
              )
            : allSignals;
        return jsonResponse({ signals, count: signals.length });
      },

      "/api/agents/status": () => {
        const statuses = getAgentStatuses();
        // Ensure all expected agents appear
        const expected = [
          "market-data-bot",
          "filing-data-bot",
          "social-data-bot",
          "supplier-data-bot",
          "news-data-bot",
          "gtm-lens",
          "finance-lens",
          "security-lens",
          "correlation-engine",
          "brief-writer",
          "normalizer",
        ];
        const byId = new Map(statuses.map((s) => [s.agentId, s]));
        const agents = expected.map((id) => {
          const s = byId.get(id);
          if (s) {
            return {
              id: s.agentId,
              status: s.status,
              task: s.task,
              lastRun: s.lastRun,
            };
          }
          return {
            id,
            status: "idle",
            task: "Waiting for events",
            lastRun: new Date().toISOString(),
          };
        });
        return jsonResponse({ agents });
      },

      "/api/watchlist": async (req: Request) => {
        const token = extractToken(req);
        if (token) {
          const user = await getCurrentUser(token);
          if (user) {
            return jsonResponse({ companies: user.watchlist });
          }
        }
        return jsonResponse({ companies: getWatchlist() });
      },

      "/api/briefs": async (req: Request) => {
        const token = extractToken(req);
        let userWatchlist: string[] = [];
        if (token) {
          const user = await getCurrentUser(token);
          if (user) {
            userWatchlist = user.watchlist;
          }
        }
        const companies =
          userWatchlist.length > 0 ? userWatchlist : getWatchlist();
        const allBriefs: Array<Record<string, unknown>> = [];
        for (const company of companies) {
          allBriefs.push(...getBriefsForCompany(company));
        }
        return jsonResponse({ briefs: allBriefs });
      },

      "/api/credits": () => jsonResponse(getCreditStats()),

      "/api/cache/clear": () => {
        clearMemoryCache();
        return jsonResponse({ success: true, message: "Memory cache cleared" });
      },
    },

    async fetch(req: Request) {
      const url = new URL(req.url);
      const method = req.method;

      if (method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }

      const route = `${method} ${url.pathname}`;

      switch (route) {
        case "GET /api/signals/stream":
          return handleSseStream(req);
        case "POST /api/query":
          return handleQuery(req);
        case "POST /api/watchlist":
          return handleAddWatchlist(req);
        case "DELETE /api/watchlist":
          return handleRemoveWatchlist(req);
        case "POST /api/run":
          return handleTriggerRun(req);
        case "POST /api/replay":
          return handleReplay(req);

        // ─── Settings / Config ─────────────────────────────────────────────
        case "GET /api/models":
          return handleListModels(req);
        case "GET /api/models/detail":
          return handleGetModel(req);
        case "POST /api/models/index":
          return handleIndexModels(req);
        case "GET /api/models/stats":
          return handleModelStats();
        case "GET /api/agents/config":
          return handleListAgentConfigs();
        case "GET /api/agents/config/detail":
          return handleGetAgentConfig(req);
        case "PUT /api/agents/config":
          return handleUpdateAgentConfig(req);
        case "GET /api/pipeline/config":
          return handleListPipelineConfig();
        case "PUT /api/pipeline/config":
          return handleUpdatePipelineConfig(req);
        case "GET /api/user/settings":
          return handleGetUserSettings(req);
        case "PUT /api/user/settings":
          return handleUpdateUserSettings(req);

        // ─── Auth ──────────────────────────────────────────────────────────
        case "POST /api/auth/register":
          return handleRegister(req);
        case "POST /api/auth/login":
          return handleLogin(req);
        case "GET /api/auth/me":
          return handleMe(req);
        case "PUT /api/auth/onboarding":
          return handleUpdateOnboarding(req);
        case "POST /api/chat":
          return handleChat(req);

        default:
          return new Response("Not found", {
            status: 404,
            headers: corsHeaders(),
          });
      }
    },
  });

  console.log(`\n  ✓ Server running on http://localhost:${PORT}`);
  console.log("  Endpoints:");
  console.log("    GET  /health");
  console.log("    GET  /api/signals");
  console.log("    GET  /api/signals/stream");
  console.log("    GET  /api/agents/status");
  console.log("    GET  /api/watchlist");
  console.log("    GET  /api/briefs");
  console.log("    GET  /api/credits");
  console.log("    POST /api/query");
  console.log("    POST /api/watchlist");
  console.log("    DELETE /api/watchlist");
  console.log("    POST /api/run (trigger manual run)");
  console.log("    POST /api/replay (trigger canned scenario)");
  console.log("    GET  /api/cache/clear");
  console.log("  Settings:");
  console.log("    GET  /api/models");
  console.log("    POST /api/models/index");
  console.log("    GET  /api/models/stats");
  console.log("    GET  /api/agents/config");
  console.log("    PUT  /api/agents/config");
  console.log("    GET  /api/pipeline/config");
  console.log("    PUT  /api/pipeline/config");
  console.log("    GET  /api/user/settings");
  console.log("    PUT  /api/user/settings");
  console.log();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  stopPipeline();
  await disconnectAllMcp();
  process.exit(0);
});
