/// <reference types="bun" />

import type { AgentStep, MemoryEntry, Signal, SignalLens } from "@argus/shared";
import { DATASETS } from "@argus/shared";
import type { Agent } from "@mohanscodex/spectra-agent";
import { callMcpTool, getMcpTools } from "./mcp/bridge.ts";

// ─── In-memory signal store with Cognee persistence ───
interface SignalStore {
  analysisListeners: Set<(analysis: unknown) => void>;
  briefs: Map<string, BriefEntry>;
  listeners: Set<(signal: Signal) => void>;
  signals: Signal[];
  stepListeners: Set<(step: AgentStep) => void>;
  steps: AgentStep[];
  watchlist: string[];
}

interface BriefEntry {
  company: string;
  generatedAt: string;
  lens: SignalLens;
  signals: Signal[];
  summary: string;
}

const store: SignalStore = {
  signals: [],
  briefs: new Map(),
  watchlist: ["NVIDIA", "AMD", "TSMC"],
  listeners: new Set(),
  stepListeners: new Set(),
  analysisListeners: new Set(),
  steps: [],
};

export function getStore() {
  return store;
}

export function addSignal(signal: Signal) {
  store.signals.unshift(signal);
  if (store.signals.length > 500) {
    store.signals.pop();
  }
  for (const listener of store.listeners) {
    listener(signal);
  }
}

export function subscribeToSignals(callback: (signal: Signal) => void) {
  store.listeners.add(callback);
  return () => store.listeners.delete(callback);
}

export function subscribeToSteps(callback: (step: AgentStep) => void) {
  store.stepListeners.add(callback);
  return () => store.stepListeners.delete(callback);
}

function emitStep(step: AgentStep) {
  store.steps = store.steps.filter(
    (s) => !(s.agent === step.agent && s.step === step.step)
  );
  store.steps.push(step);
  for (const listener of store.stepListeners) {
    listener(step);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Direct MCP scrapers (reliable, no LLM decision loop) ───

async function brightDataSearch(query: string): Promise<string> {
  try {
    const tools = getMcpTools("brightdata");
    const searchTool = tools.find(
      (t) => t.name.includes("search_engine") && !t.name.includes("batch")
    );
    if (!searchTool) {
      return "[degraded] search_engine not available";
    }
    const result = await callMcpTool("brightdata", searchTool.name, {
      query,
      num_results: 5,
    });
    const contents = result.content as
      | Array<{ type: string; text?: string }>
      | undefined;
    return (
      contents
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("\n") ?? "(no results)"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `[degraded] Bright Data search failed: ${msg}`;
  }
}

async function brightDataScrape(url: string): Promise<string> {
  try {
    const tools = getMcpTools("brightdata");
    const scrapeTool = tools.find((t) => t.name.includes("scrape_as_markdown"));
    if (!scrapeTool) {
      return "[degraded] scrape_as_markdown not available";
    }
    const result = await callMcpTool("brightdata", scrapeTool.name, { url });
    const contents = result.content as
      | Array<{ type: string; text?: string }>
      | undefined;
    return (
      contents
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("\n") ?? "(no content)"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `[degraded] Bright Data scrape failed: ${msg}`;
  }
}

// ─── Cognee helpers ───

function getDataset(dataType: string): string {
  switch (dataType) {
    case "price":
      return DATASETS.raw_market_data;
    case "filing":
      return DATASETS.raw_filing_data;
    case "social":
      return DATASETS.raw_social_data;
    case "supplier":
      return DATASETS.raw_supplier_data;
    case "news":
      return DATASETS.raw_news_data;
    case "lens_finding":
      return DATASETS.lens_findings;
    default:
      return DATASETS.correlation_signals;
  }
}

async function cogneeRemember(data: MemoryEntry): Promise<void> {
  try {
    await callMcpTool("cognee", "remember", {
      data: JSON.stringify(data),
      dataset_name: getDataset(data.data_type),
    });
  } catch (err) {
    console.warn(
      "[cognee] remember failed:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

async function cogneeRecall(query: string, datasets?: string): Promise<string> {
  try {
    const result = await callMcpTool("cognee", "recall", {
      query,
      datasets,
      top_k: 10,
    });
    const contents = result.content as
      | Array<{ type: string; text?: string }>
      | undefined;
    return (
      contents
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("\n") ?? ""
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[cognee] recall failed:", msg);
    return "";
  }
}

// ─── Collection Agents (direct MCP calls) ───

export async function runNewsCollection(company: string): Promise<void> {
  emitStep({
    id: generateId(),
    agent: "news-data-bot",
    step: 1,
    label: "Search",
    detail: `Bright Data SERP API searching for "${company} news"...`,
    status: "running",
    progress: 10,
    timestamp: new Date().toISOString(),
  });

  const searchResult = await brightDataSearch(`${company} news today finance`);

  emitStep({
    id: generateId(),
    agent: "news-data-bot",
    step: 2,
    label: "Evidence",
    detail: `Bright Data returned search results for ${company}`,
    status: "running",
    progress: 50,
    timestamp: new Date().toISOString(),
  });

  const urlMatches = searchResult.match(/https?:\/\/[^\s)\]>]+/g) ?? [];
  const urls = urlMatches
    .slice(0, 3)
    .filter((u) => !(u.includes("google.com") || u.includes("bing.com")));

  let detail = "";
  if (urls.length > 0) {
    detail = await brightDataScrape(urls[0]!);
    detail = detail.slice(0, 4000);
  }

  const content = `News search for ${company}:\n${searchResult}\n\nDetail from ${urls[0] ?? "N/A"}:\n${detail}`;

  emitStep({
    id: generateId(),
    agent: "news-data-bot",
    step: 3,
    label: "Store",
    detail: `Storing ${company} news in Cognee memory graph...`,
    status: "running",
    progress: 80,
    timestamp: new Date().toISOString(),
  });

  await cogneeRemember({
    source_url:
      urls[0] ?? `https://news.search?q=${encodeURIComponent(company)}`,
    scraped_at: new Date().toISOString(),
    agent_id: "news-data-bot",
    confidence: urls.length > 0 ? 0.75 : 0.5,
    data_type: "news",
    content,
    ttl_hours: 24,
  });

  const headline = detail
    ? `${company}: ${detail.slice(0, 80)}...`
    : `News search completed for ${company}`;

  addSignal({
    id: generateId(),
    lens: "finance",
    severity: "medium",
    headline,
    synthesis: content.slice(0, 300),
    source_urls:
      urls.length > 0
        ? urls
        : [`https://news.search?q=${encodeURIComponent(company)}`],
    confidence: urls.length > 0 ? 0.75 : 0.5,
    agent_id: "news-data-bot",
    detected_at: new Date().toISOString(),
  });

  emitStep({
    id: generateId(),
    agent: "news-data-bot",
    step: 4,
    label: "Complete",
    detail: `NewsDataBot finished for ${company} — ${urls.length} sources`,
    status: "success",
    progress: 100,
    timestamp: new Date().toISOString(),
  });
}

export async function runMarketCollection(company: string): Promise<void> {
  emitStep({
    id: generateId(),
    agent: "market-data-bot",
    step: 1,
    label: "Search",
    detail: `Searching market data for ${company}...`,
    status: "running",
    progress: 25,
    timestamp: new Date().toISOString(),
  });

  const searchResult = await brightDataSearch(`${company} stock price today`);

  emitStep({
    id: generateId(),
    agent: "market-data-bot",
    step: 2,
    label: "Store",
    detail: `Storing market data for ${company} in Cognee...`,
    status: "running",
    progress: 60,
    timestamp: new Date().toISOString(),
  });

  const content = `Market search for ${company}:\n${searchResult}`;

  await cogneeRemember({
    source_url: `https://finance.search?q=${encodeURIComponent(company)}`,
    scraped_at: new Date().toISOString(),
    agent_id: "market-data-bot",
    confidence: 0.6,
    data_type: "price",
    content,
    ttl_hours: 24,
  });

  addSignal({
    id: generateId(),
    lens: "finance",
    severity: "low",
    headline: `Market data collected for ${company}`,
    synthesis: content.slice(0, 300),
    source_urls: [`https://finance.search?q=${encodeURIComponent(company)}`],
    confidence: 0.6,
    agent_id: "market-data-bot",
    detected_at: new Date().toISOString(),
  });

  emitStep({
    id: generateId(),
    agent: "market-data-bot",
    step: 3,
    label: "Complete",
    detail: `MarketDataBot finished for ${company}`,
    status: "success",
    progress: 100,
    timestamp: new Date().toISOString(),
  });
}

export async function runSocialCollection(company: string): Promise<void> {
  emitStep({
    id: generateId(),
    agent: "social-data-bot",
    step: 1,
    label: "Search",
    detail: `Searching social signals for ${company}...`,
    status: "running",
    progress: 30,
    timestamp: new Date().toISOString(),
  });

  const searchResult = await brightDataSearch(
    `${company} LinkedIn hiring jobs 2026`
  );

  emitStep({
    id: generateId(),
    agent: "social-data-bot",
    step: 2,
    label: "Store",
    detail: `Storing social signals for ${company}...`,
    status: "running",
    progress: 70,
    timestamp: new Date().toISOString(),
  });

  const content = `Social signals for ${company}:\n${searchResult}`;

  await cogneeRemember({
    source_url: `https://social.search?q=${encodeURIComponent(company)}`,
    scraped_at: new Date().toISOString(),
    agent_id: "social-data-bot",
    confidence: 0.55,
    data_type: "social",
    content,
    ttl_hours: 48,
  });

  addSignal({
    id: generateId(),
    lens: "gtm",
    severity: "low",
    headline: `Social signals collected for ${company}`,
    synthesis: content.slice(0, 300),
    source_urls: [`https://social.search?q=${encodeURIComponent(company)}`],
    confidence: 0.55,
    agent_id: "social-data-bot",
    detected_at: new Date().toISOString(),
  });

  emitStep({
    id: generateId(),
    agent: "social-data-bot",
    step: 3,
    label: "Complete",
    detail: `SocialDataBot finished for ${company}`,
    status: "success",
    progress: 100,
    timestamp: new Date().toISOString(),
  });
}

// ─── Lens Agents (LLM-powered analysis via Spectra) ───

async function runLensAgent(
  agent: Agent,
  agentName: string,
  lens: SignalLens,
  company: string
): Promise<void> {
  emitStep({
    id: generateId(),
    agent: `${lens}-lens`,
    step: 1,
    label: "Recall",
    detail: `${agentName} recalling Cognee memory for ${company}...`,
    status: "running",
    progress: 20,
    timestamp: new Date().toISOString(),
    lens,
  });

  const rawData = await cogneeRecall(`all recent signals for ${company}`);

  emitStep({
    id: generateId(),
    agent: `${lens}-lens`,
    step: 2,
    label: "Analyze",
    detail: `${agentName} analyzing ${company} through ${lens.toUpperCase()} lens...`,
    status: "running",
    progress: 50,
    timestamp: new Date().toISOString(),
    lens,
  });

  const prompt = `Analyze the following raw intelligence data about ${company} through the ${lens.toUpperCase()} lens. Produce a concise signal with headline, synthesis (2-3 sentences), and confidence score (0.0-1.0).\n\nRaw data:\n${rawData || "No prior data in memory."}`;

  try {
    const events: unknown[] = [];
    for await (const event of agent.run(prompt)) {
      events.push(event);
    }

    let finalEvent: Record<string, unknown> | undefined;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i] as Record<string, unknown>;
      if (e?.type === "done") {
        finalEvent = e;
        break;
      }
    }

    const message = (finalEvent?.message as Record<string, unknown>) ?? {};
    const blocks =
      (message.content as Array<{ type: string; text?: string }>) ?? [];
    const text = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");

    if (text) {
      const confidenceMatch = text.match(/confidence[:\s]+(0\.\d+|1\.0|1)/i);
      const confidence = confidenceMatch
        ? Number.parseFloat(confidenceMatch[1]!)
        : 0.7;

      addSignal({
        id: generateId(),
        lens,
        severity:
          confidence > 0.85 ? "high" : confidence > 0.7 ? "medium" : "low",
        headline: `${company} — ${lens.toUpperCase()} analysis`,
        synthesis: text.slice(0, 400),
        source_urls: [`https://argus.internal/lens/${lens}/${company}`],
        confidence: Math.min(1, Math.max(0, confidence)),
        agent_id: `${lens}-lens`,
        detected_at: new Date().toISOString(),
      });

      await cogneeRemember({
        source_url: `https://argus.internal/lens/${lens}/${company}`,
        scraped_at: new Date().toISOString(),
        agent_id: `${lens}-lens`,
        confidence: Math.min(1, Math.max(0, confidence)),
        data_type: "lens_finding",
        content: text,
      });

      emitStep({
        id: generateId(),
        agent: `${lens}-lens`,
        step: 3,
        label: "Complete",
        detail: `${agentName} produced ${lens.toUpperCase()} finding for ${company} (confidence: ${confidence.toFixed(2)})`,
        status: "success",
        progress: 100,
        timestamp: new Date().toISOString(),
        lens,
      });
    } else {
      emitStep({
        id: generateId(),
        agent: `${lens}-lens`,
        step: 3,
        label: "Complete",
        detail: `${agentName} finished — no actionable finding for ${company}`,
        status: "success",
        progress: 100,
        timestamp: new Date().toISOString(),
        lens,
      });
    }
  } catch (err) {
    emitStep({
      id: generateId(),
      agent: `${lens}-lens`,
      step: 3,
      label: "Failed",
      detail: `${agentName} failed: ${err instanceof Error ? err.message : String(err)}`,
      status: "failed",
      progress: 100,
      timestamp: new Date().toISOString(),
      lens,
    });
  }
}

// ─── Correlation Engine ───

export async function runCorrelation(company: string): Promise<void> {
  emitStep({
    id: generateId(),
    agent: "correlation-engine",
    step: 1,
    label: "Scan",
    detail: `Scanning for cross-lens correlations on ${company}...`,
    status: "running",
    progress: 40,
    timestamp: new Date().toISOString(),
  });

  const recentSignals = store.signals
    .filter((s) => s.headline.toLowerCase().includes(company.toLowerCase()))
    .slice(0, 10);

  const domains = new Set(recentSignals.map((s) => s.lens));

  if (domains.size >= 2) {
    const confidence = Math.min(0.95, 0.5 + domains.size * 0.15);
    addSignal({
      id: generateId(),
      lens: "finance",
      severity: confidence > 0.8 ? "high" : "medium",
      headline: `${company}: cross-lens convergence detected (${domains.size} domains)`,
      synthesis: `Signals from ${Array.from(domains).join(", ")} lenses show correlated activity for ${company}.`,
      source_urls: recentSignals
        .map((s) => s.source_urls[0])
        .filter((u): u is string => Boolean(u)),
      confidence,
      agent_id: "correlation-engine",
      detected_at: new Date().toISOString(),
    });

    emitStep({
      id: generateId(),
      agent: "correlation-engine",
      step: 2,
      label: "Converged",
      detail: `${company}: convergence across ${domains.size} lenses (confidence: ${(confidence * 100).toFixed(0)}%)`,
      status: "success",
      progress: 100,
      timestamp: new Date().toISOString(),
    });
  } else {
    emitStep({
      id: generateId(),
      agent: "correlation-engine",
      step: 2,
      label: "No Match",
      detail: `${company}: insufficient cross-lens overlap`,
      status: "skipped",
      progress: 100,
      timestamp: new Date().toISOString(),
    });
  }
}

// ─── Orchestrator ───

let intervalId: Timer | null = null;

export function startOrchestrator(
  agents: {
    gtmLens: Agent;
    financeLens: Agent;
    securityLens: Agent;
  },
  pollMinutes = 5
): void {
  if (intervalId) {
    clearInterval(intervalId);
  }

  const tick = async () => {
    for (const company of store.watchlist) {
      try {
        await runNewsCollection(company);
        await runMarketCollection(company);
        await runSocialCollection(company);

        await runLensAgent(agents.gtmLens, "GTMLens", "gtm", company);
        await runLensAgent(
          agents.financeLens,
          "FinanceLens",
          "finance",
          company
        );
        await runLensAgent(
          agents.securityLens,
          "SecurityLens",
          "security",
          company
        );

        await runCorrelation(company);
      } catch (err) {
        console.error(
          `[orchestrator] Error processing ${company}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  };

  tick();
  intervalId = setInterval(tick, pollMinutes * 60 * 1000);
  console.log(
    `[orchestrator] Started — polling every ${pollMinutes} minutes for: ${store.watchlist.join(", ")}`
  );
}

export function stopOrchestrator(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function addToWatchlist(company: string): void {
  const normalized = company.trim();
  if (!store.watchlist.includes(normalized)) {
    store.watchlist.push(normalized);
  }
}

export function removeFromWatchlist(company: string): void {
  store.watchlist = store.watchlist.filter(
    (c) => c.toLowerCase() !== company.toLowerCase()
  );
}
